import { NextRequest, NextResponse } from 'next/server';
import { getGeminiModel } from '@/lib/gemini';
import { getOutputType } from '@/lib/outputTypes';
import { OutputType, UserTrait } from '@/types';
import { verifyAuth } from '@/lib/auth/verifyAuth';

interface GenerateOutputRequest {
  type: OutputType;
  traits: UserTrait[];
  userProfile?: {
    nickname?: string;
    occupation?: string;
    gender?: string;
    birthYear?: number;
  };
}

export async function POST(request: NextRequest) {
  try {
    // 認証検証
    const authResult = await verifyAuth(request);
    if (!authResult.authenticated || !authResult.uid) {
      return NextResponse.json(
        { error: authResult.error || 'Unauthorized' },
        { status: 401 }
      );
    }

    const { type, traits, userProfile } = (await request.json()) as GenerateOutputRequest;

    if (!type || !traits || traits.length === 0) {
      return NextResponse.json(
        { error: 'type and traits are required' },
        { status: 400 }
      );
    }

    const outputConfig = getOutputType(type);
    if (!outputConfig || !outputConfig.enabled) {
      return NextResponse.json(
        { error: 'Invalid or disabled output type' },
        { status: 400 }
      );
    }

    // 特徴データを整形
    const traitsSummary = traits.map((trait) => {
      let line = `- ${trait.label}`;
      if (trait.intensityLabel) {
        line += `（${trait.intensityLabel}）`;
      }
      if (trait.description) {
        line += `: ${trait.description}`;
      }
      return line;
    }).join('\n');

    // ユーザープロフィール情報を整形
    const currentYear = new Date().getFullYear();
    const age = userProfile?.birthYear ? currentYear - userProfile.birthYear : null;

    const profileInfo = userProfile
      ? `【ユーザー情報】
- 呼び名: ${userProfile.nickname || '不明'}
- 職業: ${userProfile.occupation || '不明'}
- 性別: ${userProfile.gender || '不明'}
- 年齢: ${age ? `${age}歳` : '不明'}

`
      : '';

    // プロンプトを生成
    const prompt = `${outputConfig.systemPrompt}

${profileInfo}【ユーザーの特徴】
${traitsSummary}

【文字数制限】
${outputConfig.minLength}〜${outputConfig.maxLength}文字

生成してください：`;

    const model = getGeminiModel();
    const result = await model.generateContent(prompt);
    const generatedText = result.response.text().trim();

    return NextResponse.json({
      success: true,
      content: generatedText,
      type,
      characterCount: generatedText.length,
    });
  } catch (error) {
    console.error('Error generating output:', error);
    return NextResponse.json(
      { error: 'Failed to generate output' },
      { status: 500 }
    );
  }
}
