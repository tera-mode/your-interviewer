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

  // 行動
  { id: 'a1', optionA: '計画を立ててから動く', optionB: 'とりあえずやってみる', categoryHint: 'action' },
  { id: 'a2', optionA: 'コツコツ積み上げるタイプ', optionB: '一気に集中してやるタイプ', categoryHint: 'action' },
  { id: 'a3', optionA: 'マルチタスクが得意', optionB: 'ひとつに集中したい', categoryHint: 'action' },

  // 思考
  { id: 't1', optionA: '論理的に考えるタイプ', optionB: '直感で決めるタイプ', categoryHint: 'thinking' },
  { id: 't2', optionA: '細部にこだわる', optionB: '全体像を大切にする', categoryHint: 'thinking' },
  { id: 't3', optionA: '新しいことにチャレンジ', optionB: '慣れたやり方を大切に', categoryHint: 'thinking' },

  // コミュニケーション
  { id: 'c1', optionA: '自分から話しかける方', optionB: '話しかけられる方が多い', categoryHint: 'communication' },
  { id: 'c2', optionA: '意見をはっきり言う', optionB: '周りの意見を聞いてから', categoryHint: 'communication' },
  { id: 'c3', optionA: 'リーダーをやりたい', optionB: 'サポート役が好き', categoryHint: 'communication' },

  // 価値観
  { id: 'v1', optionA: '安定した生活が大事', optionB: 'ワクワクする体験が大事', categoryHint: 'values' },
  { id: 'v2', optionA: '結果が大事', optionB: 'プロセスが大事', categoryHint: 'values' },
  { id: 'v3', optionA: '自分の成長を追求', optionB: '人の役に立ちたい', categoryHint: 'values' },
  { id: 'v4', optionA: '自由に働きたい', optionB: 'チームで働きたい', categoryHint: 'values' },

  // モチベーション
  { id: 'm1', optionA: '褒められるとやる気UP', optionB: '自分の納得感が大事', categoryHint: 'motivation' },
  { id: 'm2', optionA: '競争があるとやる気が出る', optionB: '自分のペースでやりたい', categoryHint: 'motivation' },

  // ライフスタイル
  { id: 'l1', optionA: '朝型の生活', optionB: '夜型の生活', categoryHint: 'lifestyle' },
  { id: 'l2', optionA: 'ものはシンプルに', optionB: '好きなものに囲まれたい', categoryHint: 'lifestyle' },

  // 仕事スタイル
  { id: 'w1', optionA: 'アイデアを出すのが好き', optionB: '形にするのが好き', categoryHint: 'workstyle' },
  { id: 'w2', optionA: 'スピード重視', optionB: 'クオリティ重視', categoryHint: 'workstyle' },
  { id: 'w3', optionA: '幅広くやりたい', optionB: '専門を極めたい', categoryHint: 'workstyle' },
];

/**
 * Fisher-Yates shuffle and pick n random questions
 */
export function getRandomQuestions(count: number = 5): SwipeQuestion[] {
  const shuffled = [...QUESTION_POOL];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, count);
}

export { QUESTION_POOL };
