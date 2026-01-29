'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import UserHeader from '@/components/UserHeader';
import { TraitCard } from '@/components/interview';
import { UserTrait, TRAIT_CATEGORY_LABELS } from '@/types';
import { authenticatedFetch } from '@/lib/api/authenticatedFetch';

export default function TraitsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [traits, setTraits] = useState<UserTrait[]>([]);
  const [isLoadingTraits, setIsLoadingTraits] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [deletingTraitLabel, setDeletingTraitLabel] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
      return;
    }

    if (!loading && user?.isAnonymous) {
      router.push('/mypage');
      return;
    }

    if (user && !user.isAnonymous) {
      fetchTraits();
    }
  }, [user, loading, router]);

  const fetchTraits = async () => {
    try {
      const response = await fetch(`/api/get-user-interviews?userId=${user?.uid}`);
      if (!response.ok) throw new Error('Failed to fetch interviews');

      const data = await response.json();
      const allTraits: UserTrait[] = [];

      data.interviews?.forEach((interview: { traits?: UserTrait[] }) => {
        if (interview.traits) {
          allTraits.push(...interview.traits);
        }
      });

      // 重複を除去（labelが同じものは最新のものを使用）
      const uniqueTraits = allTraits.reduce((acc: UserTrait[], trait) => {
        const existingIndex = acc.findIndex((t) => t.label === trait.label);
        if (existingIndex === -1) {
          acc.push(trait);
        } else {
          // より新しい方を使う
          const existing = acc[existingIndex];
          if (
            new Date(trait.extractedAt) > new Date(existing.extractedAt)
          ) {
            acc[existingIndex] = trait;
          }
        }
        return acc;
      }, []);

      // 確信度でソート
      uniqueTraits.sort((a, b) => b.confidence - a.confidence);
      setTraits(uniqueTraits);
    } catch (error) {
      console.error('Error fetching traits:', error);
    } finally {
      setIsLoadingTraits(false);
    }
  };

  const handleDeleteTrait = async (traitLabel: string) => {
    setDeletingTraitLabel(traitLabel);
    try {
      const response = await authenticatedFetch('/api/delete-trait', {
        method: 'POST',
        body: JSON.stringify({ traitLabel }),
      });

      if (!response.ok) throw new Error('Failed to delete trait');

      // 削除成功したらローカルの状態も更新
      setTraits((prev) => prev.filter((t) => t.label !== traitLabel));
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting trait:', error);
      alert('特徴の削除に失敗しました。もう一度お試しください。');
    } finally {
      setDeletingTraitLabel(null);
    }
  };

  const categories = ['all', ...Object.keys(TRAIT_CATEGORY_LABELS)];
  const filteredTraits =
    selectedCategory === 'all'
      ? traits
      : traits.filter((t) => t.category === selectedCategory);

  // カテゴリごとの統計
  const categoryStats = Object.entries(TRAIT_CATEGORY_LABELS).map(
    ([key, label]) => ({
      key,
      label,
      count: traits.filter((t) => t.category === key).length,
    })
  );

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
        <main className="mx-auto max-w-4xl">
          {/* ヘッダー */}
          <div className="mb-8">
            <h1 className="mb-2 bg-gradient-to-r from-orange-600 via-amber-500 to-orange-500 bg-clip-text text-3xl font-bold text-transparent">
              特徴データ管理
            </h1>
            <p className="text-gray-600">
              インタビューで発見されたあなたの特徴
            </p>
          </div>

          {/* 統計サマリー */}
          <div className="glass-card mb-6 rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-gray-700">
                合計: {traits.length}個の特徴
              </span>
              <button
                onClick={() => router.push('/interview/select-mode')}
                className="text-sm text-orange-600 underline"
              >
                インタビューで増やす
              </button>
            </div>
          </div>

          {isLoadingTraits ? (
            <div className="glass-card rounded-2xl p-8 text-center">
              <div className="flex items-center justify-center gap-3">
                <div className="h-6 w-6 animate-spin rounded-full border-4 spinner-warm"></div>
                <p className="text-gray-600">読み込み中...</p>
              </div>
            </div>
          ) : traits.length === 0 ? (
            <div className="glass-card rounded-2xl p-8 text-center">
              <div className="mb-4 text-5xl">🏷️</div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">
                まだ特徴がありません
              </h3>
              <p className="mb-4 text-sm text-gray-600">
                インタビューを受けると、あなたの特徴が自動的に抽出されます
              </p>
              <button
                onClick={() => router.push('/interview/select-mode')}
                className="btn-gradient-primary rounded-full px-6 py-2 font-semibold text-white"
              >
                インタビューを始める
              </button>
            </div>
          ) : (
            <>
              {/* カテゴリフィルター */}
              <div className="mb-6 flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                    selectedCategory === 'all'
                      ? 'bg-orange-500 text-white'
                      : 'bg-white/50 text-gray-700 hover:bg-white/80'
                  }`}
                >
                  すべて ({traits.length})
                </button>
                {categoryStats
                  .filter((cat) => cat.count > 0)
                  .map((cat) => (
                    <button
                      key={cat.key}
                      onClick={() => setSelectedCategory(cat.key)}
                      className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                        selectedCategory === cat.key
                          ? 'bg-orange-500 text-white'
                          : 'bg-white/50 text-gray-700 hover:bg-white/80'
                      }`}
                    >
                      {cat.label} ({cat.count})
                    </button>
                  ))}
              </div>

              {/* 特徴カード一覧 */}
              <div className="grid gap-4 md:grid-cols-2">
                {filteredTraits.map((trait) => (
                  <div key={trait.id} className="flex flex-col">
                    <TraitCard trait={trait} size="full" />
                    <div className="flex justify-end mt-1 px-1">
                      <button
                        onClick={() => setShowDeleteConfirm(trait.label)}
                        disabled={deletingTraitLabel === trait.label}
                        className="text-xs text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50 flex items-center gap-1"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-3 w-3"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                        削除
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

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

      {/* 削除確認モーダル */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="glass-modal w-full max-w-md rounded-3xl p-6">
            <h2 className="mb-4 text-center text-xl font-bold text-gray-900">
              特徴を削除しますか？
            </h2>
            <p className="mb-2 text-center text-sm text-gray-600">
              「{showDeleteConfirm}」を削除します。
            </p>
            <p className="mb-6 text-center text-xs text-gray-500">
              この操作は取り消せません。
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                disabled={deletingTraitLabel !== null}
                className="flex-1 rounded-xl border border-orange-200 bg-white/80 px-4 py-3 font-semibold text-gray-700 transition-all hover:bg-orange-50 disabled:opacity-50"
              >
                キャンセル
              </button>
              <button
                onClick={() => handleDeleteTrait(showDeleteConfirm)}
                disabled={deletingTraitLabel !== null}
                className="flex-1 rounded-xl bg-red-500 px-4 py-3 font-semibold text-white shadow-md hover:bg-red-600 disabled:opacity-50"
              >
                {deletingTraitLabel ? '削除中...' : '削除する'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
