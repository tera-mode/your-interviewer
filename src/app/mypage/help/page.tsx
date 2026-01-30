'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import UserHeader from '@/components/UserHeader';

const FAQ_ITEMS = [
  {
    question: 'インタビューは何回でも受けられますか？',
    answer:
      'はい、何回でもインタビューを受けることができます。インタビューを重ねるほど、あなたの特徴データが蓄積され、より精度の高いアウトプットを生成できるようになります。',
  },
  {
    question: 'ゲストモードとログインの違いは？',
    answer:
      'ゲストモードでは一時的にサービスを利用できますが、データは保存されません。ログインすると、インタビュー履歴、特徴データ、アウトプットなどが永続的に保存されます。',
  },
  {
    question: 'アウトプットはどのように作成されますか？',
    answer:
      'インタビューで抽出された特徴データをAIが分析し、SNSプロフィールや自己PR文などを自動生成します。生成後は自由に編集することもできます。',
  },
  {
    question: 'データは安全ですか？',
    answer:
      'はい、すべてのデータはセキュアなクラウド上で暗号化して保存されています。第三者にデータが共有されることはありません。',
  },
  {
    question: 'インタビューモードの違いは？',
    answer:
      '「基本インタビュー」は多角的にあなたを深掘りするエンドレスモード、「自己PR発見」は仕事の強みにフォーカスした10問、「わたしの取説」はコミュニケーションスタイルを明確にする10問です。',
  },
];

export default function HelpPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-warm">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 spinner-warm"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-warm">
      <div className="gradient-orb gradient-orb-orange absolute -right-40 top-20 h-96 w-96" />
      <div className="gradient-orb gradient-orb-yellow absolute -left-40 bottom-20 h-80 w-80" />

      <UserHeader />

      <div className="relative z-10 px-4 py-8">
        <main className="mx-auto max-w-2xl">
          {/* ヘッダー */}
          <div className="mb-8 text-center">
            <h1 className="mb-2 bg-gradient-to-r from-orange-600 via-amber-500 to-orange-500 bg-clip-text text-3xl font-bold text-transparent">
              ヘルプ・問い合わせ
            </h1>
            <p className="text-gray-600">よくある質問と使い方のご案内</p>
          </div>

          {/* よくある質問 */}
          <div className="glass-card mb-8 rounded-2xl p-6">
            <h2 className="mb-6 text-xl font-bold text-gray-800">
              よくある質問
            </h2>
            <div className="space-y-4">
              {FAQ_ITEMS.map((item, index) => (
                <details
                  key={index}
                  className="group rounded-xl bg-white/50 p-4"
                >
                  <summary className="flex cursor-pointer items-center justify-between font-semibold text-gray-800">
                    {item.question}
                    <span className="ml-2 text-orange-500 transition-transform group-open:rotate-180">
                      ▼
                    </span>
                  </summary>
                  <p className="mt-3 text-sm text-gray-600">{item.answer}</p>
                </details>
              ))}
            </div>
          </div>

          {/* 使い方ガイド */}
          <div className="glass-card mb-8 rounded-2xl p-6">
            <h2 className="mb-4 text-xl font-bold text-gray-800">使い方</h2>
            <ol className="space-y-4">
              <li className="flex gap-4">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-orange-100 font-bold text-orange-600">
                  1
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">
                    インタビューモードを選ぶ
                  </h3>
                  <p className="text-sm text-gray-600">
                    目的に合わせて「基本」「自己PR」「取説」から選択
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-orange-100 font-bold text-orange-600">
                  2
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">
                    AIインタビュワーと会話
                  </h3>
                  <p className="text-sm text-gray-600">
                    質問に答えると、あなたの特徴が自動的に抽出されます
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-orange-100 font-bold text-orange-600">
                  3
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">
                    アウトプットを作成
                  </h3>
                  <p className="text-sm text-gray-600">
                    蓄積した特徴からSNSプロフィールなどを自動生成
                  </p>
                </div>
              </li>
            </ol>
          </div>

          {/* お問い合わせ */}
          <div className="glass-card rounded-2xl p-6 text-center">
            <h2 className="mb-2 text-xl font-bold text-gray-800">
              お問い合わせ
            </h2>
            <p className="mb-4 text-sm text-gray-600">
              ご不明な点やフィードバックがございましたら、お気軽にお問い合わせください。
            </p>
            <a
              href="mailto:support@example.com"
              className="inline-block rounded-full border border-orange-200 bg-white/80 px-6 py-3 font-semibold text-gray-700 transition-all hover:bg-orange-50"
            >
              メールで問い合わせる
            </a>
          </div>

          {/* 戻るボタン */}
          <div className="mt-8 text-center">
            <button
              onClick={() => router.push('/mypage')}
              className="text-gray-500 underline decoration-orange-300 underline-offset-4 hover:text-orange-600"
            >
              マイページに戻る
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
