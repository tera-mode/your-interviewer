import { OutputType } from '@/types';

// アウトプットタイプ設定
export interface OutputTypeConfig {
  id: OutputType;
  name: string;
  description: string;
  minLength: number;
  maxLength: number;
  icon: string;
  enabled: boolean; // 有効/無効フラグ
  recommendedModes: string[]; // 推奨インタビューモード
  systemPrompt: string; // 生成時のシステムプロンプト
}

export const OUTPUT_TYPES: OutputTypeConfig[] = [
  {
    id: 'sns-profile',
    name: 'SNS用プロフィール',
    description: 'Twitter/InstagramなどのSNSプロフィール欄に使える自己紹介文',
    minLength: 50,
    maxLength: 150,
    icon: '📱',
    enabled: true,
    recommendedModes: ['basic', 'manual'],
    systemPrompt: `
以下のユーザー特徴データを元に、SNSプロフィール欄に使える自己紹介文を作成してください。

【条件】
- 50〜150文字
- 親しみやすく、個性が伝わる文章
- 絵文字は2〜3個程度使用可
- 箇条書きではなく、文章形式
- 職業や興味関心を自然に盛り込む

【出力形式】
プロフィール文のみを出力してください。説明や注釈は不要です。
`,
  },
  {
    id: 'self-pr',
    name: '自己PRページ',
    description: '転職・就活で使える自己PR文',
    minLength: 300,
    maxLength: 500,
    icon: '📝',
    enabled: true,
    recommendedModes: ['self-pr'],
    systemPrompt: `
以下のユーザー特徴データを元に、自己PR文を作成してください。

【条件】
- 300〜500文字
- 具体的なエピソードや実績を含める
- 強み→具体例→活かし方の流れ
- 読み手に好印象を与える文章
- ビジネスシーンにふさわしい敬体

【構成】
1. 自分の強み（結論）
2. 具体的なエピソード・実績
3. その強みをどう活かせるか

【出力形式】
自己PR文のみを出力してください。見出しや説明は不要です。
`,
  },
  {
    id: 'resume',
    name: '履歴書・職務経歴書',
    description: '履歴書の自己PR欄に使える文章',
    minLength: 200,
    maxLength: 400,
    icon: '📄',
    enabled: false, // 後日実装
    recommendedModes: ['self-pr'],
    systemPrompt: `
以下のユーザー特徴データを元に、履歴書の自己PR欄に使える文章を作成してください。

【条件】
- 200〜400文字
- フォーマルな文体
- 具体的な数字や成果を含める
- 志望動機につながる内容

【出力形式】
自己PR文のみを出力してください。
`,
  },
];

// タイプ取得関数
export const getOutputType = (id: OutputType): OutputTypeConfig | undefined => {
  return OUTPUT_TYPES.find((type) => type.id === id);
};

// 有効なタイプのみ取得
export const getEnabledOutputTypes = (): OutputTypeConfig[] => {
  return OUTPUT_TYPES.filter((type) => type.enabled);
};

// 推奨モードに基づくタイプ取得
export const getRecommendedOutputTypes = (mode: string): OutputTypeConfig[] => {
  return OUTPUT_TYPES.filter(
    (type) => type.enabled && type.recommendedModes.includes(mode)
  );
};
