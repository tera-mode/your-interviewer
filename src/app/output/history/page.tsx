'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import UserHeader from '@/components/UserHeader';
import { getOutputType } from '@/lib/outputTypes';
import { Output } from '@/types';

export default function OutputHistoryPage() {
  const router = useRouter();
  const { user, loading, isOnboardingRequired } = useAuth();
  const [outputs, setOutputs] = useState<Output[]>([]);
  const [isLoadingOutputs, setIsLoadingOutputs] = useState(true);

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
      fetchOutputs();
    } else {
      setIsLoadingOutputs(false);
    }
  }, [user, loading, isOnboardingRequired, router]);

  const fetchOutputs = async () => {
    try {
      const response = await fetch(`/api/outputs?userId=${user?.uid}`);
      if (!response.ok) throw new Error('Failed to fetch outputs');

      const data = await response.json();
      // アーカイブ済みを除外
      const activeOutputs = (data.outputs || []).filter(
        (o: Output) => o.status !== 'archived'
      );
      setOutputs(activeOutputs);
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
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-gradient-warm">
      <div className="gradient-orb gradient-orb-orange absolute -right-40 top-20 h-96 w-96" />
      <div className="gradient-orb gradient-orb-yellow absolute -left-40 bottom-20 h-80 w-80" />

      <UserHeader />

      <div className="relative z-10 flex flex-1 flex-col px-4 py-8">
        <main className="mx-auto w-full max-w-4xl">
          {/* ヘッダー */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="mb-2 bg-gradient-to-r from-orange-600 via-amber-500 to-orange-500 bg-clip-text text-3xl font-bold text-transparent">
                アウトプット履歴
              </h1>
              <p className="text-gray-600">
                これまでに作成したアウトプット一覧
              </p>
            </div>
            <button
              onClick={() => router.push('/output/create')}
              className="btn-gradient-primary rounded-full px-4 py-2 font-semibold text-white shadow-md"
            >
              新規作成
            </button>
          </div>

          {/* ゲストユーザー向けメッセージ */}
          {user?.isAnonymous && (
            <div className="glass-card mb-6 rounded-2xl p-6 text-center">
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
              {isLoadingOutputs ? (
                <div className="glass-card rounded-2xl p-8 text-center">
                  <div className="flex items-center justify-center gap-3">
                    <div className="h-6 w-6 animate-spin rounded-full border-4 spinner-warm"></div>
                    <p className="text-gray-600">読み込み中...</p>
                  </div>
                </div>
              ) : outputs.length === 0 ? (
                <div className="glass-card rounded-2xl p-8 text-center">
                  <div className="mb-4 text-5xl">📝</div>
                  <h3 className="mb-2 text-lg font-semibold text-gray-900">
                    まだアウトプットがありません
                  </h3>
                  <p className="mb-4 text-sm text-gray-600">
                    インタビュー結果からアウトプットを作成してみましょう
                  </p>
                  <button
                    onClick={() => router.push('/output/create')}
                    className="btn-gradient-primary rounded-full px-6 py-2 font-semibold text-white"
                  >
                    アウトプットを作成
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {outputs.map((output) => {
                    const config = getOutputType(output.type);
                    const displayContent =
                      output.editedContent || output.content.body;
                    const preview =
                      displayContent.length > 100
                        ? displayContent.slice(0, 100) + '...'
                        : displayContent;

                    return (
                      <button
                        key={output.id}
                        onClick={() => router.push(`/output/${output.id}`)}
                        className="glass-card w-full rounded-2xl p-5 text-left transition-all hover:shadow-md"
                      >
                        <div className="flex items-start gap-4">
                          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-200 to-amber-200 text-2xl">
                            {config?.icon || '📄'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="mb-1 flex items-center gap-2">
                              <h3 className="font-bold text-gray-900">
                                {config?.name || output.type}
                              </h3>
                              {output.isEdited && (
                                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">
                                  編集済み
                                </span>
                              )}
                            </div>
                            <p className="mb-2 text-sm text-gray-600 line-clamp-2">
                              {preview}
                            </p>
                            <p className="text-xs text-gray-400">
                              {output.createdAt
                                ? new Date(output.createdAt).toLocaleDateString(
                                    'ja-JP'
                                  )
                                : ''}
                            </p>
                          </div>
                          <span className="text-gray-400">→</span>
                        </div>
                      </button>
                    );
                  })}
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
