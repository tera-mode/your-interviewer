'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import UserHeader from '@/components/UserHeader';
import Cookies from 'js-cookie';
import { v4 as uuidv4 } from 'uuid';

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    // ログインしていない場合はLPへリダイレクト
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  const handleStartInterview = () => {
    // ゲストセッションIDがない場合は作成
    if (!Cookies.get('guest_session_id')) {
      const sessionId = uuidv4();
      Cookies.set('guest_session_id', sessionId, { expires: 30, path: '/' });
    }

    // すでにインタビュワーが選択されている場合は直接インタビューページへ
    const selectedInterviewer = Cookies.get('selected_interviewer');
    if (selectedInterviewer) {
      router.push('/interview');
    } else {
      // 初回の場合はインタビュワー選択ページへ
      router.push('/select-interviewer');
    }
  };

  const handleGoToMyPage = () => {
    router.push('/mypage');
  };

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
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-gradient-warm">
      {/* 装飾用グラデーションオーブ */}
      <div className="gradient-orb gradient-orb-orange absolute -right-40 top-20 h-96 w-96" />
      <div className="gradient-orb gradient-orb-yellow absolute -left-40 bottom-20 h-80 w-80" />

      {/* ユーザーヘッダー */}
      <UserHeader showHomeButton={false} />

      <div className="relative z-10 flex flex-1 items-center justify-center px-4 py-12">
        <main className="flex w-full max-w-4xl flex-col items-center gap-12 text-center">
          {/* ヘッダー */}
          <div className="flex flex-col gap-4">
            <h1 className="bg-gradient-to-r from-orange-600 via-amber-500 to-orange-500 bg-clip-text text-5xl font-bold text-transparent md:text-6xl">
              ようこそ
            </h1>
            <p className="text-xl text-gray-600 md:text-2xl">
              AIインタビューで自分の魅力を発見しましょう
            </p>
          </div>

          {/* アクションカード */}
          <div className="grid w-full gap-6 md:grid-cols-2">
            {/* 新しいインタビューを始める */}
            <button
              onClick={handleStartInterview}
              className="glass-card group flex flex-col items-center gap-4 rounded-3xl p-8 transition-all hover:scale-[1.02] hover-glow"
            >
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-orange-200 to-amber-200 text-4xl shadow-md transition-all group-hover:from-orange-300 group-hover:to-amber-300 group-hover:shadow-lg">
                💬
              </div>
              <div>
                <h2 className="mb-2 text-2xl font-bold text-gray-900">
                  新しいインタビュー
                </h2>
                <p className="text-gray-600">
                  AIとの対話であなたの魅力を引き出します
                </p>
              </div>
            </button>

            {/* マイページ */}
            <button
              onClick={handleGoToMyPage}
              className="glass-card group flex flex-col items-center gap-4 rounded-3xl p-8 transition-all hover:scale-[1.02] hover-glow"
            >
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-amber-200 to-yellow-200 text-4xl shadow-md transition-all group-hover:from-amber-300 group-hover:to-yellow-300 group-hover:shadow-lg">
                📝
              </div>
              <div>
                <h2 className="mb-2 text-2xl font-bold text-gray-900">
                  マイページ
                </h2>
                <p className="text-gray-600">
                  {user.isAnonymous
                    ? 'ログインして過去のインタビューを確認'
                    : '過去のインタビューを確認'}
                </p>
              </div>
            </button>
          </div>

          {/* ゲストユーザー向けメッセージ */}
          {user.isAnonymous && (
            <div className="glass-card w-full max-w-2xl rounded-2xl p-6 text-left">
              <h3 className="mb-2 text-lg font-semibold text-orange-700">
                ゲストモードでご利用中
              </h3>
              <p className="mb-4 text-sm text-gray-600">
                ログインすることで、インタビュー履歴を永続的に保存できます。
              </p>
              <button
                onClick={() => router.push('/login')}
                className="btn-gradient-secondary rounded-full px-6 py-2 text-sm font-semibold text-white shadow-md"
              >
                ログインする
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
