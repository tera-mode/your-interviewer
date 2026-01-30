'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import UserHeader from '@/components/UserHeader';
import { InterviewerId } from '@/types';

interface Interview {
  id: string;
  userId: string;
  interviewerId: InterviewerId;
  mode?: string;
  data: {
    fixed: {
      name?: string;
      nickname?: string;
      occupation?: string;
    };
    dynamic?: Record<string, unknown>;
  };
  status: string;
  createdAt: string;
  updatedAt: string;
}

const MENU_ITEMS = [
  {
    id: 'profile',
    title: '基本情報編集',
    description: 'ニックネーム・職業を変更',
    icon: '👤',
    href: '/mypage/profile',
  },
  {
    id: 'traits',
    title: '特徴データ管理',
    description: 'インタビューで発見した特徴を確認',
    icon: '🏷️',
    href: '/mypage/traits',
  },
  {
    id: 'interviewer',
    title: 'インタビュワー設定',
    description: 'AIインタビュワーの名前を変更',
    icon: '🎙️',
    href: '/mypage/interviewer',
  },
  {
    id: 'help',
    title: 'ヘルプ・問い合わせ',
    description: '使い方やお問い合わせ',
    icon: '❓',
    href: '/mypage/help',
  },
];

export default function MyPage() {
  const router = useRouter();
  const { user, loading, userProfile, signOut } = useAuth();
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [isLoadingInterviews, setIsLoadingInterviews] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const isGuest = user?.isAnonymous ?? false;

  useEffect(() => {
    if (loading || isLoggingOut) return;

    if (!user) {
      router.push('/login');
      return;
    }

    fetchInterviews();
  }, [user, loading, router, isLoggingOut]);

  const fetchInterviews = async () => {
    if (!user) return;

    setIsLoadingInterviews(true);
    try {
      const response = await fetch(`/api/get-user-interviews?userId=${user.uid}`);
      if (!response.ok) throw new Error('Failed to load interviews');

      const result = await response.json();
      setInterviews(result.interviews || []);
    } catch (error) {
      console.error('Error loading interviews:', error);
    } finally {
      setIsLoadingInterviews(false);
    }
  };

  const handleSignOut = async () => {
    if (!confirm('ログアウトしますか？')) return;

    try {
      setIsLoggingOut(true);
      await signOut();
      router.push('/');
    } catch (error) {
      console.error('ログアウトエラー:', error);
      alert('ログアウトに失敗しました。もう一度お試しください。');
      setIsLoggingOut(false);
    }
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
    <div className="relative min-h-screen overflow-hidden bg-gradient-warm">
      <div className="gradient-orb gradient-orb-orange absolute -right-40 top-20 h-96 w-96" />
      <div className="gradient-orb gradient-orb-yellow absolute -left-40 bottom-40 h-80 w-80" />

      <UserHeader showHomeButton={true} />

      <div className="relative z-10 px-4 py-8">
        <main className="mx-auto max-w-6xl">
          {/* ゲストユーザー向けログイン案内 */}
          {isGuest && (
            <div className="glass-card mb-8 rounded-3xl p-6">
              <div className="flex flex-col items-center gap-4 text-center md:flex-row md:justify-between md:text-left">
                <div>
                  <h2 className="text-xl font-bold text-orange-700">
                    ログインしてデータを保存しよう
                  </h2>
                  <p className="mt-2 text-gray-600">
                    ログインすると、インタビュー履歴やプロフィールを永続的に保存できます
                  </p>
                </div>
                <button
                  onClick={() => router.push('/login')}
                  className="btn-gradient-secondary whitespace-nowrap rounded-full px-8 py-3 font-semibold text-white shadow-md"
                >
                  ログイン
                </button>
              </div>
            </div>
          )}

          {/* プロフィールサマリー */}
          <div className="glass-card mb-8 rounded-3xl p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-orange-200 to-amber-200 text-3xl shadow-md">
                {userProfile?.nickname ? '😊' : '👤'}
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900">
                  {userProfile?.nickname
                    ? `${userProfile.nickname}さん`
                    : isGuest
                      ? 'ゲストユーザー'
                      : user.email}
                </h1>
                {userProfile?.occupation && (
                  <p className="text-gray-600">{userProfile.occupation}</p>
                )}
              </div>
              <button
                onClick={handleSignOut}
                className="rounded-full border border-orange-200 bg-white/80 px-4 py-2 text-sm font-semibold text-gray-700 backdrop-blur-sm transition-all hover:bg-orange-50"
              >
                ログアウト
              </button>
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            {/* 左側：メニュー */}
            <div className="lg:col-span-1">
              <div className="glass-card rounded-3xl p-6">
                <h2 className="mb-4 text-lg font-bold text-gray-800">設定</h2>
                <div className="space-y-2">
                  {MENU_ITEMS.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => router.push(item.href)}
                      className="flex w-full items-center gap-3 rounded-xl p-3 text-left transition-all hover:bg-orange-50"
                    >
                      <span className="text-xl">{item.icon}</span>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-800">
                          {item.title}
                        </div>
                        <div className="text-xs text-gray-500">
                          {item.description}
                        </div>
                      </div>
                      <span className="text-gray-400">→</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 右側：インタビュー履歴 */}
            <div className="lg:col-span-2">
              <div className="glass-card rounded-3xl p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-bold text-gray-800">
                    インタビュー履歴
                  </h2>
                  <button
                    onClick={() => router.push('/interview/select-mode')}
                    className="btn-gradient-primary rounded-full px-4 py-2 text-sm font-semibold text-white shadow-md"
                  >
                    新規インタビュー
                  </button>
                </div>

                {isLoadingInterviews ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="h-6 w-6 animate-spin rounded-full border-4 spinner-warm"></div>
                    <p className="ml-3 text-gray-600">読み込み中...</p>
                  </div>
                ) : interviews.length === 0 ? (
                  <div className="py-8 text-center">
                    <div className="mb-3 text-4xl">💬</div>
                    <p className="mb-4 text-gray-600">
                      まだインタビューがありません
                    </p>
                    <button
                      onClick={() => router.push('/interview/select-mode')}
                      className="text-orange-600 underline"
                    >
                      最初のインタビューを始める
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {interviews.slice(0, 5).map((interview) => {
                      const date = new Date(interview.createdAt);
                      const nickname =
                        interview.data.fixed.nickname ||
                        interview.data.fixed.name ||
                        '不明';

                      return (
                        <button
                          key={interview.id}
                          onClick={() =>
                            router.push(`/mypage/interview/${interview.id}`)
                          }
                          className="flex w-full items-center gap-4 rounded-xl bg-white/50 p-4 text-left transition-all hover:bg-white/80"
                        >
                          <div className="flex-1">
                            <div className="font-semibold text-gray-800">
                              {nickname}さんのインタビュー
                            </div>
                            <div className="text-sm text-gray-500">
                              {date.toLocaleDateString('ja-JP')} ・{' '}
                              {interview.data.dynamic
                                ? Object.keys(interview.data.dynamic).length
                                : 0}
                              件の質問
                            </div>
                          </div>
                          <span className="text-gray-400">→</span>
                        </button>
                      );
                    })}
                    {interviews.length > 5 && (
                      <div className="text-center pt-2">
                        <button
                          onClick={() => router.push('/interview/history')}
                          className="text-sm text-orange-600 underline"
                        >
                          すべて見る（{interviews.length}件）
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
