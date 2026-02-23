// ビッグファイブ性格特性 → 商品カテゴリ マッピング表
// Geminiプロンプトの補助情報として使用

export const PERSONALITY_PRODUCT_MAP = {
  // 開放性が高い → 新奇・アート・クリエイティブ系
  high_openness: {
    bookGenres: ['アート', '哲学', 'SF', '海外文学', 'サイエンス'],
    movieGenres: [878, 99, 14, 16],  // SF, ドキュメンタリー, ファンタジー, アニメ
    rakutenKeywords: ['デザイン', 'クリエイティブ', 'ユニーク', '実験的'],
    goodsAffinity: ['アート用品', 'ガジェット', 'インテリア雑貨'],
  },

  // 誠実性が高い → 実用的・定番・品質重視
  high_conscientiousness: {
    bookGenres: ['ビジネス', '自己啓発', '実用書', '資格'],
    movieGenres: [99, 18, 36],  // ドキュメンタリー, ドラマ, 歴史
    rakutenKeywords: ['定番', '高品質', 'ロングセラー', 'プロ仕様'],
    goodsAffinity: ['文房具', '手帳', 'ビジネスグッズ'],
  },

  // 外向性が高い → 社交的・体験型・トレンド系
  high_extraversion: {
    bookGenres: ['コミュニケーション', 'エッセイ', 'トラベル', 'グルメ'],
    movieGenres: [35, 28, 10402],  // コメディ, アクション, 音楽
    rakutenKeywords: ['パーティー', 'アウトドア', 'トレンド', 'シェア'],
    goodsAffinity: ['パーティーグッズ', 'アウトドア用品', 'ファッション小物'],
  },

  // 協調性が高い → 温かみ・ファミリー・癒し系
  high_agreeableness: {
    bookGenres: ['絵本', 'エッセイ', '料理', '暮らし'],
    movieGenres: [10751, 10749, 16],  // ファミリー, ロマンス, アニメ
    rakutenKeywords: ['オーガニック', 'ナチュラル', '手作り', 'フェアトレード'],
    goodsAffinity: ['アロマ', 'ハーブ', 'キッチン雑貨'],
  },

  // 神経症傾向が低い（情緒安定）→ チャレンジ系
  low_neuroticism: {
    bookGenres: ['冒険', 'スポーツ', '投資', 'スタートアップ'],
    movieGenres: [12, 53, 80],  // アドベンチャー, スリラー, クライム
    rakutenKeywords: ['チャレンジ', '新体験', 'プレミアム'],
    goodsAffinity: ['スポーツ用品', 'トラベルグッズ'],
  },
} as const;
