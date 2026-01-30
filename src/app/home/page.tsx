'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import UserHeader from '@/components/UserHeader';

export default function Home() {
  const router = useRouter();
  const { user, loading, userProfile, isOnboardingRequired } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
      return;
    }

    if (!loading && isOnboardingRequired) {
      router.push('/onboarding');
    }
  }, [user, loading, isOnboardingRequired, router]);

  const handleStartInterview = () => {
    router.push('/interview/select-mode');
  };

  const handleCreateOutput = () => {
    router.push('/output/create');
  };

  if (loading || !user || isOnboardingRequired) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-warm">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 spinner-warm"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  const displayName = userProfile?.nickname || (user.isAnonymous ? 'ゲスト' : user.email?.split('@')[0]);

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-gradient-warm">
      {/* 装飾用グラデーションオーブ */}
      <div className="gradient-orb gradient-orb-orange absolute -right-40 top-20 h-96 w-96" />
      <div className="gradient-orb gradient-orb-yellow absolute -left-40 bottom-20 h-80 w-80" />

      <UserHeader showHomeButton={false} />

      <div className="relative z-10 flex flex-1 items-center justify-center px-4 py-12">
        <main className="flex w-full max-w-4xl flex-col items-center gap-10 text-center">
          {/* ウェルカムメッセージ */}
          <div className="flex flex-col gap-4">
            <h1 className="bg-gradient-to-r from-orange-600 via-amber-500 to-orange-500 bg-clip-text text-4xl font-bold text-transparent md:text-5xl">
              {displayName}さん、こんにちは
            </h1>
            <p className="text-xl text-gray-600">
              今日は何をしますか？
            </p>
          </div>

          {/* メインアクションカード */}
          <div className="grid w-full gap-6 md:grid-cols-2">
            {/* インタビューを始める */}
            <button
              onClick={handleStartInterview}
              className="glass-card group flex flex-col items-center gap-4 rounded-3xl p-8 transition-all hover:scale-[1.02] hover-glow"
            >
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-orange-200 to-amber-200 text-4xl shadow-md transition-all group-hover:from-orange-300 group-hover:to-amber-300 group-hover:shadow-lg">
                💬
              </div>
              <div>
                <h2 className="mb-2 text-2xl font-bold text-gray-900">
                  インタビューを受ける
                </h2>
                <p className="text-gray-600">
                  AIとの対話であなたの魅力を発見
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                <span className="rounded-full bg-orange-100 px-3 py-1 text-xs text-orange-700">
                  基本
                </span>
                <span className="rounded-full bg-orange-100 px-3 py-1 text-xs text-orange-700">
                  自己PR
                </span>
                <span className="rounded-full bg-orange-100 px-3 py-1 text-xs text-orange-700">
                  取説
                </span>
              </div>
            </button>

            {/* アウトプットを作成 */}
            <button
              onClick={handleCreateOutput}
              className="glass-card group flex flex-col items-center gap-4 rounded-3xl p-8 transition-all hover:scale-[1.02] hover-glow"
            >
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-amber-200 to-yellow-200 text-4xl shadow-md transition-all group-hover:from-amber-300 group-hover:to-yellow-300 group-hover:shadow-lg">
                📝
              </div>
              <div>
                <h2 className="mb-2 text-2xl font-bold text-gray-900">
                  アウトプットを作成
                </h2>
                <p className="text-gray-600">
                  特徴からプロフィール文などを生成
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs text-amber-700">
                  SNSプロフィール
                </span>
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs text-amber-700">
                  自己PR
                </span>
              </div>
            </button>
          </div>

          {/* サブアクション */}
          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={() => router.push('/mypage')}
              className="rounded-full border border-orange-200 bg-white/80 px-6 py-3 font-semibold text-gray-700 backdrop-blur-sm transition-all hover:bg-orange-50 hover:border-orange-300"
            >
              マイページ
            </button>
            <button
              onClick={() => router.push('/output/history')}
              className="rounded-full border border-orange-200 bg-white/80 px-6 py-3 font-semibold text-gray-700 backdrop-blur-sm transition-all hover:bg-orange-50 hover:border-orange-300"
            >
              アウトプット履歴
            </button>
          </div>

          {/* ゲストユーザー向けメッセージ */}
          {user.isAnonymous && (
            <div className="glass-card w-full max-w-2xl rounded-2xl p-6 text-left">
              <h3 className="mb-2 text-lg font-semibold text-orange-700">
                ゲストモードでご利用中
              </h3>
              <p className="mb-4 text-sm text-gray-600">
                ログインすると、インタビュー履歴やアウトプットを永続的に保存できます。
              </p>
              <button
                onClick={() => router.push('/login')}
                className="btn-gradient-secondary rounded-full px-6 py-2 text-sm font-semibold text-white shadow-md"
              >
                ログインして保存する
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
