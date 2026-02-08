import { NextRequest, NextResponse } from 'next/server';
import { getGeminiModel } from '@/lib/gemini';
import { getInterviewer } from '@/lib/interviewers';
import { getInterviewMode, isEndlessMode, getQuestionCount, getRandomQuestion } from '@/lib/interviewModes';
import { ChatMessage, InterviewerId, InterviewMode, FixedUserData, DynamicData } from '@/types';
import { verifyAuth } from '@/lib/auth/verifyAuth';

// インタビューの状態を管理するためのインターフェース
interface InterviewState {
  collectedData: Partial<FixedUserData>;
  dynamicData: DynamicData;
  currentStep: number;
  totalSteps: number;
  isFixedPhaseComplete: boolean;
  mode: InterviewMode;
}

// Phase 1: 基本情報収集のステップ（ニックネームは登録時に取得済み、職業のみ）
const FIXED_INTERVIEW_STEPS = ['occupation'];

/**
 * カスタム性格をシステムプロンプトに組み込むためのヘルパー関数
 * 一箇所で管理することで冗長性を排除
 */
function buildPersonalityContext(
  baseCharacter: string,
  baseTone: string,
  customPersonality?: string
): { header: string; characterSection: string } {
  if (!customPersonality) {
    return {
      header: '',
      characterSection: `## キャラクター設定
- 性格: ${baseCharacter}
- 話し方: ${baseTone}`,
    };
  }

  return {
    header: `## あなたの個性
${customPersonality}

この個性を自然に会話に反映させてください。

`,
    characterSection: `## キャラクター設定
- ベース性格: ${baseCharacter}
- ベース話し方: ${baseTone}
- カスタム性格: 上記「あなたの個性」を優先`,
  };
}

// デフォルトの深掘り質問数（エンドレスモード以外）
const DEFAULT_DYNAMIC_STEPS = 10;

export async function POST(request: NextRequest) {
  try {
    // 認証検証（匿名ユーザーも含む）
    const authResult = await verifyAuth(request);
    if (!authResult.authenticated || !authResult.uid) {
      return NextResponse.json(
        { error: authResult.error || 'Unauthorized' },
        { status: 401 }
      );
    }

    const { messages, interviewerId, mode = 'basic', forceComplete = false, userProfile, interviewerCustomization, isInitialGreeting = false, interviewerName } = await request.json();

    if (!messages || !Array.isArray(messages) || !interviewerId) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const interviewer = getInterviewer(interviewerId as InterviewerId);
    if (!interviewer) {
      return NextResponse.json(
        { error: 'Interviewer not found' },
        { status: 404 }
      );
    }

    // 初期挨拶の生成
    if (isInitialGreeting) {
      return generateInitialGreeting(
        interviewer,
        mode as InterviewMode,
        interviewerName,
        userProfile,
        interviewerCustomization
      );
    }

    // インタビューの状態を分析（userProfileがあれば固定質問をスキップ）
    const state = await analyzeInterviewState(messages, mode as InterviewMode, userProfile);

    // 強制終了フラグがある場合（エンドレスモードの終了ボタン）
    if (forceComplete && isEndlessMode(mode)) {
      return handleForceComplete(state, interviewer, interviewerCustomization);
    }

    // システムプロンプトを生成
    const systemPrompt = generateSystemPrompt(interviewer, state, interviewerCustomization, messages);

    // Gemini APIを使用して返答を生成
    const model = getGeminiModel();

    // 履歴を構築（最初のassistantメッセージは除外してuserから始める）
    const historyMessages = messages.slice(0, -1);
    const validHistory: Array<{ role: string; parts: Array<{ text: string }> }> = [];

    // 最初のuserメッセージのインデックスを見つける
    const firstUserIndex = historyMessages.findIndex(msg => msg.role === 'user');

    if (firstUserIndex !== -1) {
      // userメッセージから始まる履歴を作成
      for (let i = firstUserIndex; i < historyMessages.length; i++) {
        validHistory.push({
          role: historyMessages[i].role === 'assistant' ? 'model' : 'user',
          parts: [{ text: historyMessages[i].content }],
        });
      }
    }

    const chat = model.startChat({
      history: validHistory,
    });

    const result = await chat.sendMessage(
      `${systemPrompt}\n\nユーザーの返答: ${messages[messages.length - 1].content}`
    );

    const responseText = result.response.text();

    // === 完了判定 ===
    // エンドレスモードの場合はforceCompleteでのみ完了
    const isCompleted = isEndlessMode(mode) ? false : state.currentStep >= state.totalSteps;

    // === カテゴリ分類を追加 ===
    let finalDynamicData = state.dynamicData;
    if (isCompleted && Object.keys(state.dynamicData).length > 0) {
      finalDynamicData = await categorizeDynamicData(state.dynamicData);
    }

    // 収集したデータを返す
    return NextResponse.json({
      message: responseText,
      isCompleted,
      interviewData: isCompleted
        ? {
            ...state.collectedData,
            dynamic: finalDynamicData,
          }
        : null,
      // ニックネームが抽出されたらフロントに通知
      extractedNickname: state.collectedData.nickname || null,
    });
  } catch (error) {
    console.error('Error in chat API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * 初期挨拶を生成
 */
async function generateInitialGreeting(
  interviewer: { tone: string; character: string },
  mode: InterviewMode,
  interviewerName?: string,
  userProfile?: { nickname: string; occupation?: string },
  interviewerCustomization?: string
) {
  const model = getGeminiModel();
  const modeConfig = getInterviewMode(mode);
  const modeName = modeConfig?.name || '基本インタビュー';
  const iceBreakQuestion = getRandomQuestion(mode, 'iceBreak') || '最近ハマってることってありますか？';
  const nickname = userProfile?.nickname || 'ゲスト';

  // 統一されたヘルパー関数でキャラクター設定を構築
  const personality = buildPersonalityContext(
    interviewer.character,
    interviewer.tone,
    interviewerCustomization
  );

  try {
    const prompt = `${personality.header}あなたは${interviewerName || 'インタビュワー'}です。

${personality.characterSection}

## 状況
${nickname}さんとこれから「${modeName}」モードでインタビューを始めます。

## 指示
1. 自己紹介をして、親しみやすく挨拶してください
2. 今日のインタビューモードについて簡単に説明してください
3. 以下のアイスブレイク質問で会話を始めてください：「${iceBreakQuestion}」

## ルール
- 自然で親しみやすい雰囲気で
- 2〜4文程度で
- 堅苦しくならないように`;

    const result = await model.generateContent(prompt);
    const greeting = result.response.text();

    return NextResponse.json({
      message: greeting,
      isCompleted: false,
      interviewData: null,
    });
  } catch (error) {
    console.error('Error generating initial greeting:', error);
    const fallbackGreeting = `こんにちは、${nickname}さん！私は${interviewerName}です。今日は「${modeName}」モードで、${nickname}さんの魅力をたくさん引き出していきますね。\n\n${iceBreakQuestion}`;

    return NextResponse.json({
      message: fallbackGreeting,
      isCompleted: false,
      interviewData: null,
    });
  }
}

/**
 * エンドレスモードの強制終了処理
 */
async function handleForceComplete(
  state: InterviewState,
  interviewer: { tone: string; character: string },
  interviewerCustomization?: string
) {
  // 最終メッセージを生成
  const model = getGeminiModel();
  const personality = buildPersonalityContext(
    interviewer.character,
    interviewer.tone,
    interviewerCustomization
  );

  const prompt = `${personality.header}あなたはインタビュワーです。

${personality.characterSection}

インタビューが終了しました。${state.collectedData.nickname}さんに感謝の言葉を述べて、インタビューを締めくくってください。
- 2〜3文で簡潔に
- 相手の魅力が引き出せたことを喜ぶ
- 温かい言葉で締めくくる`;

  const result = await model.generateContent(prompt);
  const responseText = result.response.text();

  // カテゴリ分類
  let finalDynamicData = state.dynamicData;
  if (Object.keys(state.dynamicData).length > 0) {
    finalDynamicData = await categorizeDynamicData(state.dynamicData);
  }

  return NextResponse.json({
    message: responseText,
    isCompleted: true,
    interviewData: {
      ...state.collectedData,
      dynamic: finalDynamicData,
    },
    extractedNickname: state.collectedData.nickname || null,
  });
}

/**
 * DynamicDataの各質問に対してカテゴリを自動分類
 */
async function categorizeDynamicData(
  dynamicData: DynamicData
): Promise<DynamicData> {
  const model = getGeminiModel();

  const items = Object.entries(dynamicData).map(([key, item]) => ({
    key,
    question: item.question,
    answer: item.answer,
  }));

  const prompt = `以下のインタビュー質問と回答のセットに対して、適切なカテゴリを付けてください。

【カテゴリの選択肢】
- 趣味・ライフスタイル
- 価値観・仕事
- エピソード・経験
- 将来の目標・夢
- 人間関係
- その他

【質問と回答】
${items
    .map(
      (item, index) =>
        `${index + 1}. 質問: ${item.question}\n   回答: ${item.answer}`
    )
    .join('\n\n')}

【出力形式】
以下のJSON形式で出力してください（他の文章は一切含めないでください）：
{
  "dynamic_1": "カテゴリ名",
  "dynamic_2": "カテゴリ名",
  ...
}`;

  try {
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('Failed to extract JSON from category response');
      return dynamicData;
    }

    const categories = JSON.parse(jsonMatch[0]) as Record<string, string>;

    const categorizedData: DynamicData = {};
    Object.entries(dynamicData).forEach(([key, item]) => {
      categorizedData[key] = {
        ...item,
        category: categories[key] || 'その他',
      };
    });

    return categorizedData;
  } catch (error) {
    console.error('Error categorizing dynamic data:', error);
    return dynamicData;
  }
}

// ヘルパー関数: assistantメッセージから質問文を抽出
function extractQuestionFromMessage(content: string): string {
  const sentences = content.split(/[。.]/);
  const questionSentence = sentences.find((s) =>
    s.includes('?') || s.includes('？')
  );
  return questionSentence ? questionSentence.trim() : content;
}

async function analyzeInterviewState(
  messages: ChatMessage[],
  mode: InterviewMode,
  userProfile?: { nickname: string; occupation?: string }
): Promise<InterviewState> {
  const collectedData: Partial<FixedUserData> = {};
  const dynamicData: DynamicData = {};
  let currentStep = 0;

  // モードに基づく質問数を取得
  const questionCount = getQuestionCount(mode) || DEFAULT_DYNAMIC_STEPS;
  const totalSteps = isEndlessMode(mode) ? Infinity : FIXED_INTERVIEW_STEPS.length + questionCount;

  // メッセージ履歴から収集済みの情報を抽出
  const userMessages = messages.filter((msg) => msg.role === 'user');

  // ニックネームはクライアントから常に渡される（登録時に取得済み）
  collectedData.nickname = userProfile?.nickname || 'ゲスト';

  // === nickname + occupation が揃っている場合は Phase 1 をスキップ ===
  if (userProfile?.nickname && userProfile?.occupation) {
    collectedData.occupation = userProfile.occupation;
    currentStep = FIXED_INTERVIEW_STEPS.length; // Phase 1 完了済み

    // 全ユーザーメッセージを深掘りデータとして抽出
    const assistantMessages = messages.filter((msg) => msg.role === 'assistant');
    userMessages.forEach((userMsg, index) => {
      const questionMsg = assistantMessages[index];
      if (questionMsg && index > 0) {
        const key = `dynamic_${index}`;
        dynamicData[key] = {
          question: extractQuestionFromMessage(questionMsg.content),
          answer: userMsg.content,
          category: '',
        };
      } else if (index === 0) {
        const key = `dynamic_1`;
        dynamicData[key] = {
          question: extractQuestionFromMessage(assistantMessages[0]?.content || ''),
          answer: userMsg.content,
          category: '',
        };
      }
      currentStep = FIXED_INTERVIEW_STEPS.length + index + 1;
    });

    return {
      collectedData,
      dynamicData,
      currentStep,
      totalSteps,
      isFixedPhaseComplete: true,
      mode,
    };
  }

  // === Phase 1: 職業のみ収集（1ステップ） ===
  if (userMessages.length >= 1 && currentStep === 0) {
    collectedData.occupation = userMessages[0].content;
    currentStep = 1; // Phase 1 完了
  }

  // === Phase 2: 深掘り情報の抽出 ===
  const isFixedPhaseComplete = currentStep >= FIXED_INTERVIEW_STEPS.length;

  if (isFixedPhaseComplete && userMessages.length > FIXED_INTERVIEW_STEPS.length) {
    const assistantMessages = messages.filter((msg) => msg.role === 'assistant');
    const phase2UserMessages = userMessages.slice(FIXED_INTERVIEW_STEPS.length);

    // Phase 2の質問はassistantメッセージのインデックス2以降
    // （挨拶1個 + Phase 1の質問1個 = インデックス2から）
    phase2UserMessages.forEach((userMsg, index) => {
      const questionIndex = FIXED_INTERVIEW_STEPS.length + 1 + index;
      const questionMsg = assistantMessages[questionIndex];

      if (questionMsg) {
        const key = `dynamic_${index + 1}`;
        dynamicData[key] = {
          question: extractQuestionFromMessage(questionMsg.content),
          answer: userMsg.content,
          category: '',
        };
        currentStep = FIXED_INTERVIEW_STEPS.length + index + 1;
      }
    });
  }

  return {
    collectedData,
    dynamicData,
    currentStep,
    totalSteps,
    isFixedPhaseComplete,
    mode,
  };
}

/**
 * 直近の会話を分析し、同じトピックが3回以上連続している場合に強制切り替え指示を返す
 */
function detectTopicRepetition(messages?: ChatMessage[]): string {
  if (!messages || messages.length < 6) return '';

  // 直近のassistantメッセージ（質問）を3つ取得
  const recentAssistant = messages
    .filter((m) => m.role === 'assistant')
    .slice(-3);

  if (recentAssistant.length < 3) return '';

  // 簡易的な類似度チェック: 直近3つの質問で共通するキーワードが多い場合
  const texts = recentAssistant.map((m) => m.content);
  const words0 = new Set(texts[0].split(/[\s、。？！?!,.\n]+/).filter((w) => w.length >= 2));
  const words1 = new Set(texts[1].split(/[\s、。？！?!,.\n]+/).filter((w) => w.length >= 2));
  const words2 = new Set(texts[2].split(/[\s、。？！?!,.\n]+/).filter((w) => w.length >= 2));

  // 3つの質問すべてに共通するキーワードを数える
  let commonCount = 0;
  for (const w of words0) {
    if (words1.has(w) && words2.has(w)) commonCount++;
  }

  if (commonCount >= 3) {
    return `
【強制】直近の質問で同じテーマが続いています。必ず違う話題に切り替えてください。`;
  }

  return '';
}

/**
 * 職業に応じた質問の配慮指示を返す
 */
function getOccupationGuidance(occupation: string): string {
  if (occupation.startsWith('学生')) {
    return `対象者は「${occupation}」です。「仕事」ではなく「学校生活」「勉強」「部活」「サークル」等の文脈で質問してください。`;
  }
  if (occupation === '主婦/主夫') {
    return `対象者は「${occupation}」です。「仕事」ではなく「日常」「家庭」「趣味」「子育て」等の文脈で質問してください。`;
  }
  if (occupation === '無職') {
    return `対象者の職業は「${occupation}」です。仕事関連の質問は避け、趣味・関心・日常生活について質問してください。`;
  }
  return `対象者の職業は「${occupation}」です。仕事についても自然に質問してOKです。`;
}

function generateSystemPrompt(
  interviewer: { tone: string; character: string },
  state: InterviewState,
  interviewerCustomization?: string,
  messages?: ChatMessage[]
): string {
  const modeConfig = getInterviewMode(state.mode);
  const modeFocus = modeConfig?.systemPromptFocus || '';

  // 質問バンクから参考質問を取得
  const questionBank = modeConfig?.questionBank;
  const deepDiveQuestions = modeConfig?.deepDiveQuestions || [];

  // === Phase 1: 職業収集モード（1ステップ） ===
  if (!state.isFixedPhaseComplete) {
    const stepInstruction = '普段どんなことをして過ごしているか聞いてください。お仕事、学校、家事など、どんな形でもOKという雰囲気で。例: 「普段はどんなことして過ごしてますか？お仕事とか学校とか」';

    const progressText = isEndlessMode(state.mode)
      ? `${state.currentStep} ステップ完了（エンドレスモード）`
      : `${state.currentStep} / ${state.totalSteps} ステップ完了`;

    // 統一されたヘルパー関数でキャラクター設定を構築
    const personality = buildPersonalityContext(
      interviewer.character,
      interviewer.tone,
      interviewerCustomization
    );

    return `${personality.header}あなたは一流雑誌のインタビュワーです。目の前の人が「自分ってこんなに面白い人間だったんだ」と気づくような会話を創り出すことがあなたの使命です。

${personality.characterSection}

## 絶対ルール
1. 質問は1回のレスポンスで必ず1つだけ
2. 軽く反応してから次の質問へ
3. 「はい/いいえ」で終わる質問は避ける
4. 1回の返答は2〜3文程度に抑える

## 反応のバリエーション（毎回違うものを使う）
- 「あ、いいね！」「お、なるほど」「ほー！」
- 「うんうん」「あーね」「おお」

## 禁止事項
- 「へぇ〜！○○なんですね」←オウム返し禁止
- 同じ反応を2回連続使う
- 「〇〇についてお聞かせください」のような硬い言い回し

## 次のステップ
${stepInstruction}

【現在の進行状況】
${progressText}`;
  }

  // === Phase 2: 深掘りモード ===
  const dynamicStepNumber = state.currentStep - FIXED_INTERVIEW_STEPS.length;
  const questionCount = getQuestionCount(state.mode) || DEFAULT_DYNAMIC_STEPS;
  const remainingQuestions = isEndlessMode(state.mode) ? null : questionCount - dynamicStepNumber;

  // エンドレスモード用の進行状況テキスト
  const progressText = isEndlessMode(state.mode)
    ? `深掘り質問: ${dynamicStepNumber}問完了（エンドレスモード - ユーザーが終了するまで継続）`
    : `深掘り質問: ${dynamicStepNumber} / ${questionCount} 完了`;

  // 残り質問数のテキスト
  const remainingText = isEndlessMode(state.mode)
    ? 'ユーザーが「インタビューを終了」ボタンを押すまで、様々な角度から質問を続けてください。'
    : `あと${remainingQuestions}個の質問を行います`;

  // 最後の質問かどうか
  const isLastQuestion = !isEndlessMode(state.mode) && remainingQuestions === 1;

  // フェーズを判定（質問数に基づく）
  let currentPhase = 'phase2';
  let phaseDescription = '価値観・人となりを探る質問';
  if (dynamicStepNumber >= 5) {
    currentPhase = 'phase3';
    phaseDescription = '具体的なエピソードを引き出す質問';
  }
  if (dynamicStepNumber >= 8 || isLastQuestion) {
    currentPhase = 'closing';
    phaseDescription = '未来・夢について締めくくりの質問';
  }

  // 質問の参考例を取得
  let questionExamples = '';
  if (questionBank) {
    if (currentPhase === 'phase2' && questionBank.phase2.length > 0) {
      const randomCategory = questionBank.phase2[Math.floor(Math.random() * questionBank.phase2.length)];
      const randomQuestions = randomCategory.questions.slice(0, 3);
      questionExamples = `
【参考: ${randomCategory.category}の質問例】
${randomQuestions.map(q => `- 「${q}」`).join('\n')}`;
    } else if (currentPhase === 'phase3' && questionBank.phase3.length > 0) {
      const randomCategory = questionBank.phase3[Math.floor(Math.random() * questionBank.phase3.length)];
      const randomQuestions = randomCategory.questions.slice(0, 3);
      questionExamples = `
【参考: ${randomCategory.category}の質問例】
${randomQuestions.map(q => `- 「${q}」`).join('\n')}`;
    } else if (currentPhase === 'closing' && questionBank.closing.length > 0) {
      const randomQuestions = questionBank.closing.slice(0, 3);
      questionExamples = `
【参考: 締めくくりの質問例】
${randomQuestions.map(q => `- 「${q}」`).join('\n')}`;
    }
  }

  // 深掘り質問の参考例
  const deepDiveExamples = deepDiveQuestions.length > 0
    ? `
【深掘りテクニック（ユーザーの回答をさらに掘り下げたい時）】
${deepDiveQuestions.slice(0, 5).map(q => `- 「${q}」`).join('\n')}`
    : '';

  // 統一されたヘルパー関数でキャラクター設定を構築
  const personality = buildPersonalityContext(
    interviewer.character,
    interviewer.tone,
    interviewerCustomization
  );

  return `${personality.header}あなたは一流雑誌のインタビュワーです。楽しい雑談のような会話で、相手の魅力を自然に引き出してください。

${personality.characterSection}

## インタビュー対象者
- 呼び名: ${state.collectedData.nickname}さん
- 職業: ${state.collectedData.occupation}

## 職業に応じた配慮
${getOccupationGuidance(state.collectedData.occupation || '')}

## インタビューモード: ${modeConfig?.name || '基本インタビュー'}
${modeFocus}

## 質問数
${remainingText}

## 深掘りのバランス【厳守ルール】

同じ話題の深掘りは最大2回まで。3回目は必ず別の話題に移ること。
これは絶対に守るべきルールです。

深掘りの良い例:
1. 最初の質問「趣味は何？」→ 回答「読書です」
2. 深掘り1回目「どんなジャンルが好き？」→ 回答「ミステリー」
3. 話題転換「ところで、休日は他に何してる？」

話題を変える時のフレーズ:
- 「ところで、〜」「話変わるけど、〜」「そういえば、〜」

避けること:
- 同じ話題で「なぜ？」「どう感じた？」「どんな意味？」を連続で聞く
- 一つの回答を延々と掘り続ける

## 会話の流れ

1. ユーザーの回答に軽く反応（1文だけ！）
2. すぐ次の質問へ

### 超重要：反応のバリエーション
同じ反応を2回連続で使わない！毎回違う反応を使うこと。

反応パターン（ローテーションで使う）:
- 「あ、いいね！」「お、なるほど」「ほー！」
- 「あはは、わかる」「それ気になる」「へぇ意外」
- 「うんうん」「あーね」「おお」

### 絶対NG
- 「へぇ〜！○○なんですね」←オウム返し禁止
- ユーザーが言ったことをそのまま繰り返す
- 「素敵ですね」「すごいですね」の連発
- 決めつけ（「〜ですよね」）
- 長い解釈や意味づけ

## 質問のコツ
${questionExamples}

### 良い質問（軽くて答えやすい）
- 「最近だと何かある？」
- 「例えばどんなこと？」
- 「逆に〇〇な時は？」

### 悪い質問（重すぎる）
- 「それはどんな価値観から？」
- 「何が満たされる感覚？」
- 「根底にあるものは？」
${isLastQuestion ? `
## 最後の質問
これが最後の質問です。回答を受け取ったら、軽く温かい言葉で締めくくってください。` : ''}
${detectTopicRepetition(messages)}
【進行状況】${progressText}`;
}
