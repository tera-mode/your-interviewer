// プロフィールの固定キー
export type ProfileFieldKey =
  | 'nickname'
  | 'occupation'
  | 'gender'
  | 'birthYear'
  | 'educationStage';

// 学歴段階
export type EducationStage =
  | '高校'
  | '専門学校'
  | '大学'
  | '大学院'
  | 'その他';

// プロフィールフィールドのメタ情報
export interface ProfileFieldMeta {
  key: ProfileFieldKey;
  label: string;
  isPrivate: boolean;
  inputType: 'text' | 'select' | 'number';
  options?: string[];
  placeholder?: string;
}

// フィールド定義（UIレンダリングとバリデーションに使用）
export const PROFILE_FIELDS: ProfileFieldMeta[] = [
  {
    key: 'nickname',
    label: 'ニックネーム',
    isPrivate: false,
    inputType: 'text',
    placeholder: '呼んでほしい名前',
  },
  {
    key: 'occupation',
    label: '職業',
    isPrivate: false,
    inputType: 'select',
    options: [
      '会社員', '経営者', '自営業', '公務員', 'フリーランス',
      '主婦/主夫', '学生（高校生）', '学生（大学生）', '学生（大学院生）',
      '無職', 'その他',
    ],
  },
  {
    key: 'gender',
    label: '性別',
    isPrivate: true,
    inputType: 'select',
    options: ['男性', '女性', 'その他'],
  },
  {
    key: 'birthYear',
    label: '生まれ年',
    isPrivate: true,
    inputType: 'number',
    placeholder: '例: 2002',
  },
  {
    key: 'educationStage',
    label: '学歴',
    isPrivate: true,
    inputType: 'select',
    options: ['高校', '専門学校', '大学', '大学院', 'その他'],
  },
];

// クラフト機能の要件定義
export interface CraftRequirement {
  minTraits: number;
  requireLogin: boolean;
  guestAllowed?: boolean;
  requiredProfileKeys?: ProfileFieldKey[];
}
