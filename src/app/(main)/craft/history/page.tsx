'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { usePageHeader } from '@/contexts/PageHeaderContext';
import { getOutputType } from '@/lib/outputTypes';
import { Output } from '@/types';
import { authenticatedFetch } from '@/lib/api/authenticatedFetch';

export default function OutputHistoryPage() {
  const router = useRouter();
  const { user } = useAuth();
  usePageHeader({ title: 'アウトプット履歴', showBackButton: true, onBack: () => router.push('/craft') });
  const [outputs, setOutputs] = useState<Output[]>([]);
  const [isLoadingOutputs, setIsLoadingOutputs] = useState(true);

  useEffect(() => {
    if (user && !user.isAnonymous) {
      fetchOutputs();
    } else {
      setIsLoadingOutputs(false);
    }
  }, [user]);

  const fetchOutputs = async () => {
    try {
      const response = await authenticatedFetch(`/api/outputs?userId=${user?.uid}`);
      if (!response.ok) throw new Error('Failed to fetch outputs');

      const data = await response.json();
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

  return (
    <div className="px-4 py-6">
      <div className="mx-auto max-w-4xl">
        {/* 新規作成ボタン */}
        <div className="mb-6 flex justify-end">
          <button
            onClick={() => router.push('/craft/create')}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-500 px-4 py-2 font-semibold text-white shadow-md"
          >
            <Plus size={16} />
            新規作成
          </button>
        </div>

        {/* ゲストユーザー向けメッセージ */}
        {user?.isAnonymous && (
          <div className="glass-card mb-6 p-6 text-center">
            <h3 className="mb-2 text-lg font-semibold text-sky-700">ログインが必要です</h3>
            <p className="mb-4 text-sm text-gray-600">
              アウトプット機能を利用するには、ログインしてください。
            </p>
            <button
              onClick={() => router.push('/login')}
              className="rounded-xl bg-gradient-to-r from-sky-500 to-blue-500 px-6 py-2 font-semibold text-white"
            >
              ログイン
            </button>
          </div>
        )}

        {!user?.isAnonymous && (
          <>
            {isLoadingOutputs ? (
              <div className="glass-card p-8 text-center">
                <div className="flex items-center justify-center gap-3">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-sky-400 border-t-transparent"></div>
                  <p className="text-sm text-gray-600">読み込み中...</p>
                </div>
              </div>
            ) : outputs.length === 0 ? (
              <div className="glass-card p-8 text-center">
                <div className="mb-4 text-5xl">📝</div>
                <h3 className="mb-2 text-lg font-semibold text-gray-900">
                  まだアウトプットがありません
                </h3>
                <p className="mb-4 text-sm text-gray-600">
                  インタビュー結果からアウトプットを作成してみましょう
                </p>
                <button
                  onClick={() => router.push('/craft/create')}
                  className="rounded-xl bg-gradient-to-r from-sky-500 to-blue-500 px-6 py-2 font-semibold text-white"
                >
                  アウトプットを作成
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {outputs.map((output) => {
                  const config = getOutputType(output.type);
                  const displayContent = output.editedContent || output.content.body;
                  const preview =
                    displayContent.length > 100
                      ? displayContent.slice(0, 100) + '...'
                      : displayContent;

                  return (
                    <button
                      key={output.id}
                      onClick={() => router.push(`/craft/${output.id}`)}
                      className="glass-card w-full p-5 text-left transition-all hover:shadow-md"
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-200 to-blue-200 text-2xl">
                          {config?.icon || '📄'}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="mb-1 flex items-center gap-2">
                            <h3 className="font-bold text-gray-900">
                              {config?.name || output.type}
                            </h3>
                            {output.isEdited && (
                              <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs text-sky-700">
                                編集済み
                              </span>
                            )}
                          </div>
                          <p className="mb-2 line-clamp-2 text-sm text-gray-600">{preview}</p>
                          <p className="text-xs text-gray-400">
                            {output.createdAt
                              ? new Date(output.createdAt).toLocaleDateString('ja-JP')
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
      </div>
    </div>
  );
}
