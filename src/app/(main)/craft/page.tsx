'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Sparkles, Clock, Palette, MessageSquare } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTraits } from '@/contexts/TraitsContext';
import { getEnabledOutputTypes } from '@/lib/outputTypes';
import { Output } from '@/types';
import { authenticatedFetch } from '@/lib/api/authenticatedFetch';
import { usePageHeader } from '@/contexts/PageHeaderContext';

export default function CraftPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { traitCount, isLoading: isLoadingTraits } = useTraits();
  const [recentOutputs, setRecentOutputs] = useState<Output[]>([]);
  const [isLoadingOutputs, setIsLoadingOutputs] = useState(true);
  usePageHeader({ title: 'つくる' });

  const outputTypes = getEnabledOutputTypes();

  useEffect(() => {
    if (user && !user.isAnonymous) {
      fetchRecentOutputs();
    } else {
      setIsLoadingOutputs(false);
    }
  }, [user]);

  const fetchRecentOutputs = async () => {
    try {
      const response = await authenticatedFetch(`/api/outputs?userId=${user?.uid}`);
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

  const craftMenuItems = [
    {
      title: '自分画像生成',
      description: '特徴データからイメージ画像を生成',
      icon: Palette,
      iconColor: 'text-purple-600',
      bgGradient: 'from-purple-200 to-pink-200',
      buttonGradient: 'from-purple-500 to-pink-500',
      href: '/craft/self-image',
      requiresTraits: true,
    },
    {
      title: '自分AIと話す',
      description: '特徴を学んだAIと対話して新しい視点を得る',
      icon: MessageSquare,
      iconColor: 'text-blue-600',
      bgGradient: 'from-blue-200 to-cyan-200',
      buttonGradient: 'from-blue-500 to-cyan-500',
      href: '/craft/talk-with-self',
      requiresTraits: true,
    },
    {
      title: 'テキスト生成',
      description: '特徴を使って自己PRや紹介文を生成',
      icon: Sparkles,
      iconColor: 'text-sky-600',
      bgGradient: 'from-sky-200 to-blue-200',
      buttonGradient: 'from-sky-500 to-blue-500',
      href: '/craft/create',
      requiresTraits: false,
    },
    {
      title: 'アウトプット履歴',
      description: '過去に作成したアウトプットを確認',
      icon: Clock,
      iconColor: 'text-amber-600',
      bgGradient: 'from-amber-200 to-yellow-200',
      buttonGradient: 'from-amber-500 to-yellow-500',
      href: '/craft/history',
      requiresTraits: false,
    },
  ];

  return (
    <div className="px-4 py-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 text-center">
          <p className="text-sm text-gray-600">
            集めた特徴からアウトプットを生成
          </p>
        </div>

        {/* Guest user message */}
        {user?.isAnonymous && (
          <div className="glass-card mb-6 p-6 text-center">
            <h3 className="mb-2 text-lg font-semibold text-sky-700">
              ログインが必要です
            </h3>
            <p className="mb-4 text-sm text-gray-600">
              アウトプット機能を利用するには、ログインしてください。
            </p>
            <button
              onClick={() => router.push('/login')}
              className="rounded-xl bg-gradient-to-r from-sky-500 to-blue-500 px-6 py-2 font-semibold text-white shadow-md"
            >
              ログイン
            </button>
          </div>
        )}

        {!user?.isAnonymous && (
          <>
            {isLoadingTraits ? (
              <div className="glass-card mb-6 p-4 text-center">
                <div className="flex items-center justify-center gap-3">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-sky-400 border-t-transparent"></div>
                  <p className="text-sm text-gray-600">特徴データを読み込み中...</p>
                </div>
              </div>
            ) : traitCount === 0 ? (
              <div className="glass-card mb-6 p-6 text-center">
                <h3 className="mb-2 text-lg font-semibold text-sky-700">
                  特徴データがありません
                </h3>
                <p className="mb-4 text-sm text-gray-600">
                  まずはインタビューを受けて、あなたの特徴を発見しましょう。
                </p>
                <button
                  onClick={() => router.push('/dig')}
                  className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-2 font-semibold text-white shadow-md"
                >
                  ほるに行く
                </button>
              </div>
            ) : (
              <>
                {/* Trait summary */}
                <div className="glass-card mb-6 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      蓄積された特徴: <span className="font-bold text-sky-600">{traitCount}個</span>
                    </span>
                    <button
                      onClick={() => router.push('/mypage')}
                      className="text-sm text-sky-600 underline"
                    >
                      詳細を見る
                    </button>
                  </div>
                </div>

                {/* 4-button unified grid */}
                <div className="mb-6 grid grid-cols-2 gap-4">
                  {craftMenuItems.map((item) => {
                    const Icon = item.icon;
                    const isLocked = item.requiresTraits && traitCount < 10;

                    return (
                      <div
                        key={item.href}
                        className={`glass-card flex flex-col items-center p-5 text-center ${isLocked ? 'opacity-50' : ''}`}
                      >
                        <div className={`mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${item.bgGradient}`}>
                          <Icon size={24} className={item.iconColor} />
                        </div>
                        <h3 className="mb-1 text-sm font-bold text-gray-900">{item.title}</h3>
                        <p className="mb-3 text-xs text-gray-600 leading-relaxed">{item.description}</p>
                        {isLocked ? (
                          <p className="text-xs text-gray-500">
                            特徴10個以上必要（{traitCount}/10）
                          </p>
                        ) : (
                          <button
                            onClick={() => router.push(item.href)}
                            className={`w-full rounded-xl bg-gradient-to-r ${item.buttonGradient} px-4 py-2 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg`}
                          >
                            はじめる
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Recent outputs */}
                {!isLoadingOutputs && recentOutputs.length > 0 && (
                  <div className="glass-card p-5">
                    <div className="mb-4 flex items-center justify-between">
                      <h2 className="flex items-center gap-2 font-bold text-gray-800">
                        <Clock size={18} className="text-sky-500" />
                        最近のアウトプット
                      </h2>
                      <button
                        onClick={() => router.push('/craft/history')}
                        className="text-sm text-sky-600 underline"
                      >
                        すべて見る
                      </button>
                    </div>
                    <div className="space-y-3">
                      {recentOutputs.map((output) => {
                        const type = outputTypes.find((t) => t.id === output.type);
                        const preview =
                          (output.editedContent || output.content.body).slice(0, 50) + '...';

                        return (
                          <button
                            key={output.id}
                            onClick={() => router.push(`/craft/${output.id}`)}
                            className="flex w-full items-center gap-3 rounded-xl bg-white/50 p-3 text-left transition-all hover:bg-white/80"
                          >
                            <span className="text-xl">{type?.icon || '📄'}</span>
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-semibold text-gray-800">
                                {type?.name || output.type}
                              </div>
                              <div className="truncate text-xs text-gray-500">{preview}</div>
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
          </>
        )}
      </div>
    </div>
  );
}
