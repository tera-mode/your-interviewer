export interface SwipeQuestion {
  id: string;
  optionA: string;
  optionB: string;
  categoryHint: string;
}

const QUESTION_POOL: SwipeQuestion[] = [
  // エネルギー
  { id: 'e1', optionA: '大人数のパーティーが好き', optionB: '少人数でじっくり話したい', categoryHint: 'energy' },
  { id: 'e2', optionA: '外に出かけるのが好き', optionB: '家でまったりが好き', categoryHint: 'energy' },
  { id: 'e3', optionA: '休日は予定を詰め込みたい', optionB: '休日はのんびり過ごしたい', categoryHint: 'energy' },
  { id: 'e4', optionA: '人と会うと元気になる', optionB: '一人の時間で回復する', categoryHint: 'energy' },
  { id: 'e5', optionA: '刺激のある環境が好き', optionB: '落ち着いた環境が好き', categoryHint: 'energy' },

  // 行動
  { id: 'a1', optionA: '計画を立ててから動く', optionB: 'とりあえずやってみる', categoryHint: 'action' },
  { id: 'a2', optionA: 'コツコツ積み上げるタイプ', optionB: '一気に集中してやるタイプ', categoryHint: 'action' },
  { id: 'a3', optionA: 'マルチタスクが得意', optionB: 'ひとつに集中したい', categoryHint: 'action' },
  { id: 'a4', optionA: '早めに始めて余裕を持つ', optionB: '締切直前に力を発揮する', categoryHint: 'action' },
  { id: 'a5', optionA: 'リスクを避けて確実に', optionB: 'リスクを取ってでも挑戦', categoryHint: 'action' },

  // 思考
  { id: 't1', optionA: '論理的に考えるタイプ', optionB: '直感で決めるタイプ', categoryHint: 'thinking' },
  { id: 't2', optionA: '細部にこだわる', optionB: '全体像を大切にする', categoryHint: 'thinking' },
  { id: 't3', optionA: '新しいことにチャレンジ', optionB: '慣れたやり方を大切に', categoryHint: 'thinking' },
  { id: 't4', optionA: '具体的な事実で判断する', optionB: '可能性やイメージで判断する', categoryHint: 'thinking' },
  { id: 't5', optionA: '答えを出すまで考え抜く', optionB: '考えすぎず流れに任せる', categoryHint: 'thinking' },

  // コミュニケーション
  { id: 'c1', optionA: '自分から話しかける方', optionB: '話しかけられる方が多い', categoryHint: 'communication' },
  { id: 'c2', optionA: '意見をはっきり言う', optionB: '周りの意見を聞いてから', categoryHint: 'communication' },
  { id: 'c3', optionA: 'リーダーをやりたい', optionB: 'サポート役が好き', categoryHint: 'communication' },
  { id: 'c4', optionA: '本音で話すのが好き', optionB: '空気を読んで合わせる', categoryHint: 'communication' },
  { id: 'c5', optionA: '議論して深めたい', optionB: '共感して寄り添いたい', categoryHint: 'communication' },

  // 価値観
  { id: 'v1', optionA: '安定した生活が大事', optionB: 'ワクワクする体験が大事', categoryHint: 'values' },
  { id: 'v2', optionA: '結果が大事', optionB: 'プロセスが大事', categoryHint: 'values' },
  { id: 'v3', optionA: '自分の成長を追求', optionB: '人の役に立ちたい', categoryHint: 'values' },
  { id: 'v4', optionA: '自由に働きたい', optionB: 'チームで働きたい', categoryHint: 'values' },
  { id: 'v5', optionA: '効率を重視する', optionB: '丁寧さを重視する', categoryHint: 'values' },

  // モチベーション
  { id: 'm1', optionA: '褒められるとやる気UP', optionB: '自分の納得感が大事', categoryHint: 'motivation' },
  { id: 'm2', optionA: '競争があるとやる気が出る', optionB: '自分のペースでやりたい', categoryHint: 'motivation' },
  { id: 'm3', optionA: '目標を決めて頑張る', optionB: '楽しいと思えることをやる', categoryHint: 'motivation' },
  { id: 'm4', optionA: '成果が数字で見えると嬉しい', optionB: '感謝の言葉が嬉しい', categoryHint: 'motivation' },

  // ライフスタイル
  { id: 'l1', optionA: '朝型の生活', optionB: '夜型の生活', categoryHint: 'lifestyle' },
  { id: 'l2', optionA: 'ものはシンプルに', optionB: '好きなものに囲まれたい', categoryHint: 'lifestyle' },
  { id: 'l3', optionA: 'ルーティンがあると安心', optionB: '毎日違う過ごし方が好き', categoryHint: 'lifestyle' },
  { id: 'l4', optionA: '健康・体調管理を大切にする', optionB: '好きなことを優先する', categoryHint: 'lifestyle' },

  // 仕事スタイル
  { id: 'w1', optionA: 'アイデアを出すのが好き', optionB: '形にするのが好き', categoryHint: 'workstyle' },
  { id: 'w2', optionA: 'スピード重視', optionB: 'クオリティ重視', categoryHint: 'workstyle' },
  { id: 'w3', optionA: '幅広くやりたい', optionB: '専門を極めたい', categoryHint: 'workstyle' },
  { id: 'w4', optionA: '指示がある方がやりやすい', optionB: '自分で考えて動きたい', categoryHint: 'workstyle' },
  { id: 'w5', optionA: '人と協力して進める', optionB: '黙々と作業に没頭する', categoryHint: 'workstyle' },

  // 感情・感性
  { id: 'f1', optionA: '感情を素直に表す', optionB: '感情はあまり出さない', categoryHint: 'emotion' },
  { id: 'f2', optionA: 'ポジティブに考えがち', optionB: '慎重に考えがち', categoryHint: 'emotion' },
  { id: 'f3', optionA: '変化にワクワクする', optionB: '変化に不安を感じる', categoryHint: 'emotion' },
  { id: 'f4', optionA: '映画は泣ける系が好き', optionB: '映画はアクション系が好き', categoryHint: 'emotion' },

  // 人間関係
  { id: 'r1', optionA: '広く浅い付き合いが好き', optionB: '狭く深い付き合いが好き', categoryHint: 'relationship' },
  { id: 'r2', optionA: '頼られると嬉しい', optionB: '頼るのが上手', categoryHint: 'relationship' },
  { id: 'r3', optionA: '初対面でもすぐ打ち解ける', optionB: '時間をかけて仲良くなる', categoryHint: 'relationship' },
  { id: 'r4', optionA: '約束はきっちり守る', optionB: '柔軟に対応する', categoryHint: 'relationship' },
];

/**
 * カテゴリバランスを保ちながらランダムに質問を選択
 * 各カテゴリから最大1問ずつ選び、足りない分はランダムに補充
 */
export function getRandomQuestions(count: number = 5): SwipeQuestion[] {
  // カテゴリごとにグループ化
  const byCategory = new Map<string, SwipeQuestion[]>();
  for (const q of QUESTION_POOL) {
    const list = byCategory.get(q.categoryHint) || [];
    list.push(q);
    byCategory.set(q.categoryHint, list);
  }

  const categories = [...byCategory.keys()];
  // カテゴリ順をシャッフル
  for (let i = categories.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [categories[i], categories[j]] = [categories[j], categories[i]];
  }

  const selected: SwipeQuestion[] = [];
  const usedIds = new Set<string>();

  // 各カテゴリから1問ずつ選択
  for (const cat of categories) {
    if (selected.length >= count) break;
    const questions = byCategory.get(cat)!;
    const pick = questions[Math.floor(Math.random() * questions.length)];
    selected.push(pick);
    usedIds.add(pick.id);
  }

  // まだ足りなければ残りからランダム補充
  if (selected.length < count) {
    const remaining = QUESTION_POOL.filter(q => !usedIds.has(q.id));
    for (let i = remaining.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [remaining[i], remaining[j]] = [remaining[j], remaining[i]];
    }
    for (const q of remaining) {
      if (selected.length >= count) break;
      selected.push(q);
    }
  }

  // 最終シャッフル
  for (let i = selected.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [selected[i], selected[j]] = [selected[j], selected[i]];
  }

  return selected;
}

export { QUESTION_POOL };
