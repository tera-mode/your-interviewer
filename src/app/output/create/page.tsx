'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import UserHeader from '@/components/UserHeader';
import { getEnabledOutputTypes, OutputTypeConfig } from '@/lib/outputTypes';
import { UserTrait } from '@/types';
import { authenticatedFetch } from '@/lib/api/authenticatedFetch';

export default function CreateOutputPage() {
  const router = useRouter();
  const { user, loading, userProfile, isOnboardingRequired } = useAuth();
  const [selectedType, setSelectedType] = useState<OutputTypeConfig | null>(null);
  const [traits, setTraits] = useState<UserTrait[]>([]);
  const [isLoadingTraits, setIsLoadingTraits] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<string>('');
  const [error, setError] = useState('');

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

    // ユーザーの全インタビューから特徴を集約
    if (user && !user.isAnonymous) {
      fetchUserTraits();
    } else {
      setIsLoadingTraits(false);
    }
  }, [user, loading, isOnboardingRequired, router]);

  const fetchUserTraits = async () => {
    try {
      const response = await fetch(`/api/get-user-interviews?userId=${user?.uid}`);
      if (!response.ok) throw new Error('Failed to fetch interviews');

      const data = await response.json();
      const allTraits: UserTrait[] = [];

      // 全インタビューから特徴を集約
      data.interviews?.forEach((interview: { traits?: UserTrait[] }) => {
        if (interview.traits) {
          allTraits.push(...interview.traits);
        }
      });

      // 重複を除去（labelが同じものは最新のものを使用）
      const uniqueTraits = allTraits.reduce((acc: UserTrait[], trait) => {
        const existing = acc.find((t) => t.label === trait.label);
        if (!existing) {
          acc.push(trait);
        }
        return acc;
      }, []);

      setTraits(uniqueTraits);
    } catch (error) {
      console.error('Error fetching traits:', error);
    } finally {
      setIsLoadingTraits(false);
    }
  };

  const handleSelectType = (type: OutputTypeConfig) => {
    setSelectedType(type);
    setGeneratedContent('');
    setError('');
  };

  const handleGenerate = async () => {
    if (!selectedType || traits.length === 0) return;

    setIsGenerating(true);
    setError('');

    try {
      const response = await authenticatedFetch('/api/generate-output', {
        method: 'POST',
        body: JSON.stringify({
          type: selectedType.id,
          traits,
          userProfile: userProfile
            ? {
                nickname: userProfile.nickname,
                occupation: userProfile.occupation,
              }
            : undefined,
        }),
      });

      if (!response.ok) throw new Error('Failed to generate output');

      const data = await response.json();
      setGeneratedContent(data.content);
    } catch (err) {
      console.error('Error generating output:', err);
      setError('生成に失敗しました。もう一度お試しください。');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!selectedType || !generatedContent || !user) return;

    try {
      const response = await authenticatedFetch('/api/outputs', {
        method: 'POST',
        body: JSON.stringify({
          userId: user.uid,
          type: selectedType.id,
          content: generatedContent,
          traits,
          interviewIds: [],
        }),
      });

      if (!response.ok) throw new Error('Failed to save output');

      const data = await response.json();
      router.push(`/output/${data.outputId}`);
    } catch (err) {
      console.error('Error saving output:', err);
      setError('保存に失敗しました。もう一度お試しください。');
    }
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

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-gradient-warm">
      <div className="gradient-orb gradient-orb-orange absolute -right-40 top-20 h-96 w-96" />
      <div className="gradient-orb gradient-orb-yellow absolute -left-40 bottom-20 h-80 w-80" />

      <UserHeader />

      <div className="relative z-10 flex flex-1 flex-col px-4 py-8">
        <main className="mx-auto w-full max-w-4xl">
          {/* ヘッダー */}
          <div className="mb-8 text-center">
            <h1 className="mb-3 bg-gradient-to-r from-orange-600 via-amber-500 to-orange-500 bg-clip-text text-3xl font-bold text-transparent md:text-4xl">
              アウトプットを作成
            </h1>
            <p className="text-gray-600">
              インタビューで発見した特徴から、様々なアウトプットを生成できます
            </p>
          </div>

          {/* ゲストユーザー向けメッセージ */}
          {user.isAnonymous && (
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

          {!user.isAnonymous && (
            <>
              {/* 特徴データの状態 */}
              {isLoadingTraits ? (
                <div className="glass-card mb-6 rounded-2xl p-6 text-center">
                  <div className="flex items-center justify-center gap-3">
                    <div className="h-6 w-6 animate-spin rounded-full border-4 spinner-warm"></div>
                    <p className="text-gray-600">特徴データを読み込み中...</p>
                  </div>
                </div>
              ) : traits.length === 0 ? (
                <div className="glass-card mb-6 rounded-2xl p-6 text-center">
                  <h3 className="mb-2 text-lg font-semibold text-orange-700">
                    特徴データがありません
                  </h3>
                  <p className="mb-4 text-sm text-gray-600">
                    まずはインタビューを受けて、あなたの特徴を発見しましょう。
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
                  {/* 特徴サマリー */}
                  <div className="glass-card mb-6 rounded-2xl p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">
                        蓄積された特徴: {traits.length}個
                      </span>
                      <button
                        onClick={() => router.push('/mypage/traits')}
                        className="text-sm text-orange-600 underline"
                      >
                        詳細を見る
                      </button>
                    </div>
                  </div>

                  {/* アウトプットタイプ選択 */}
                  <div className="mb-8 grid gap-4 md:grid-cols-2">
                    {outputTypes.map((type) => (
                      <button
                        key={type.id}
                        onClick={() => handleSelectType(type)}
                        className={`glass-card flex items-start gap-4 rounded-2xl p-5 text-left transition-all ${
                          selectedType?.id === type.id
                            ? 'ring-2 ring-orange-400 shadow-lg'
                            : 'hover:shadow-md'
                        }`}
                      >
                        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-200 to-amber-200 text-2xl">
                          {type.icon}
                        </div>
                        <div>
                          <h3 className="mb-1 font-bold text-gray-900">{type.name}</h3>
                          <p className="text-sm text-gray-600">{type.description}</p>
                          <p className="mt-1 text-xs text-gray-500">
                            {type.minLength}〜{type.maxLength}文字
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* 生成ボタン */}
                  {selectedType && (
                    <div className="mb-6 text-center">
                      <button
                        onClick={handleGenerate}
                        disabled={isGenerating}
                        className="btn-gradient-primary rounded-full px-8 py-3 font-bold text-white shadow-lg disabled:opacity-50"
                      >
                        {isGenerating ? (
                          <span className="flex items-center gap-2">
                            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                            生成中...
                          </span>
                        ) : (
                          `${selectedType.name}を生成`
                        )}
                      </button>
                    </div>
                  )}

                  {/* エラー表示 */}
                  {error && (
                    <div className="mb-6 rounded-lg bg-red-50 p-3 text-sm text-red-600">
                      {error}
                    </div>
                  )}

                  {/* 生成結果 */}
                  {generatedContent && (
                    <div className="glass-card rounded-2xl p-6">
                      <h3 className="mb-4 text-lg font-bold text-gray-900">
                        生成結果
                      </h3>
                      <div className="mb-4 rounded-xl bg-white/50 p-4">
                        <p className="whitespace-pre-wrap text-gray-800">
                          {generatedContent}
                        </p>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">
                          {generatedContent.length}文字
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={handleGenerate}
                            disabled={isGenerating}
                            className="rounded-full border border-orange-200 bg-white/80 px-4 py-2 text-sm font-semibold text-gray-700 transition-all hover:bg-orange-50 disabled:opacity-50"
                          >
                            再生成
                          </button>
                          <button
                            onClick={handleSave}
                            className="btn-gradient-primary rounded-full px-4 py-2 text-sm font-semibold text-white"
                          >
                            保存する
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
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
