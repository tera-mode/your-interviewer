'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import UserHeader from '@/components/UserHeader';
import { getEnabledOutputTypes } from '@/lib/outputTypes';
import { Output } from '@/types';

export default function OutputHubPage() {
  const router = useRouter();
  const { user, loading, isOnboardingRequired } = useAuth();
  const [recentOutputs, setRecentOutputs] = useState<Output[]>([]);
  const [isLoadingOutputs, setIsLoadingOutputs] = useState(true);

  const outputTypes = getEnabledOutputTypes();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
      return;
    }

    if (!loading && isOnboardingRequired) {
      router.push('/onboarding');
      return;
    }

    if (user && !user.isAnonymous) {
      fetchRecentOutputs();
    } else {
      setIsLoadingOutputs(false);
    }
  }, [user, loading, isOnboardingRequired, router]);

  const fetchRecentOutputs = async () => {
    try {
      const response = await fetch(`/api/outputs?userId=${user?.uid}`);
      if (!response.ok) throw new Error('Failed to fetch outputs');

      const data = await response.json();
      const activeOutputs = (data.outputs || [])
        .filter((o: Output) => o.status !== 'archived')
        .slice(0, 3);
      setRecentOutputs(activeOutputs);
    } catch (error) {
      console.error('Error fetching outputs:', error);
    } finally {
      setIsLoadingOutputs(false);
    }
  };

  if (loading || isOnboardingRequired) {
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
        <main className="mx-auto max-w-4xl">
          {/* ヘッダー */}
          <div className="mb-8 text-center">
            <h1 className="mb-3 bg-gradient-to-r from-orange-600 via-amber-500 to-orange-500 bg-clip-text text-3xl font-bold text-transparent md:text-4xl">
              アウトプット
            </h1>
            <p className="text-gray-600">
              インタビューで発見した特徴から様々なアウトプットを作成
            </p>
          </div>

          {/* ゲストユーザー向けメッセージ */}
          {user?.isAnonymous && (
            <div className="glass-card mb-8 rounded-2xl p-6 text-center">
              <h3 className="mb-2 text-lg font-semibold text-orange-700">
                ログインが必要です
              </h3>
              <p className="mb-4 text-sm text-gray-600">
                アウトプット機能を利用するには、ログインしてください。
              </p>
              <button
                onClick={() => router.push('/login')}
                className="btn-gradient-primary rounded-full px-6 py-2 font-semibold text-white"
              >
                ログイン
              </button>
            </div>
          )}

          {!user?.isAnonymous && (
            <>
              {/* アクションカード */}
              <div className="mb-8 grid gap-4 md:grid-cols-2">
                <button
                  onClick={() => router.push('/output/create')}
                  className="glass-card group flex items-center gap-4 rounded-2xl p-5 text-left transition-all hover:shadow-md"
                >
                  <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-200 to-amber-200 text-2xl shadow-md">
                    ✨
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">新規作成</h3>
                    <p className="text-sm text-gray-600">
                      特徴データからアウトプットを生成
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => router.push('/output/history')}
                  className="glass-card group flex items-center gap-4 rounded-2xl p-5 text-left transition-all hover:shadow-md"
                >
                  <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-200 to-yellow-200 text-2xl shadow-md">
                    📋
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">履歴を見る</h3>
                    <p className="text-sm text-gray-600">
                      過去に作成したアウトプット一覧
                    </p>
                  </div>
                </button>
              </div>

              {/* 作成可能なタイプ */}
              <div className="glass-card mb-8 rounded-2xl p-6">
                <h2 className="mb-4 font-bold text-gray-800">
                  作成できるアウトプット
                </h2>
                <div className="grid gap-3 md:grid-cols-2">
                  {outputTypes.map((type) => (
                    <div
                      key={type.id}
                      className="flex items-center gap-3 rounded-xl bg-white/50 p-3"
                    >
                      <span className="text-2xl">{type.icon}</span>
                      <div>
                        <div className="font-semibold text-gray-800">
                          {type.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {type.minLength}〜{type.maxLength}文字
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 最近のアウトプット */}
              {!isLoadingOutputs && recentOutputs.length > 0 && (
                <div className="glass-card rounded-2xl p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="font-bold text-gray-800">
                      最近のアウトプット
                    </h2>
                    <button
                      onClick={() => router.push('/output/history')}
                      className="text-sm text-orange-600 underline"
                    >
                      すべて見る
                    </button>
                  </div>
                  <div className="space-y-3">
                    {recentOutputs.map((output) => {
                      const type = outputTypes.find(
                        (t) => t.id === output.type
                      );
                      const preview =
                        (output.editedContent || output.content.body).slice(
                          0,
                          50
                        ) + '...';

                      return (
                        <button
                          key={output.id}
                          onClick={() => router.push(`/output/${output.id}`)}
                          className="flex w-full items-center gap-3 rounded-xl bg-white/50 p-3 text-left transition-all hover:bg-white/80"
                        >
                          <span className="text-xl">{type?.icon || '📄'}</span>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold text-gray-800">
                              {type?.name || output.type}
                            </div>
                            <div className="truncate text-xs text-gray-500">
                              {preview}
                            </div>
                          </div>
                          <span className="text-gray-400">→</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}

          {/* 戻るボタン */}
          <div className="mt-8 text-center">
            <button
              onClick={() => router.push('/home')}
              className="text-gray-500 underline decoration-orange-300 underline-offset-4 hover:text-orange-600 hover:decoration-orange-500"
            >
              ホームに戻る
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
