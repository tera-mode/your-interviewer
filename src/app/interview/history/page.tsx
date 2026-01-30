'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import UserHeader from '@/components/UserHeader';
import { getInterviewMode } from '@/lib/interviewModes';
import { InterviewerId, InterviewMode } from '@/types';

interface Interview {
  id: string;
  userId: string;
  interviewerId: InterviewerId;
  mode?: InterviewMode;
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

export default function InterviewHistoryPage() {
  const router = useRouter();
  const { user, loading, isOnboardingRequired } = useAuth();
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [isLoadingInterviews, setIsLoadingInterviews] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
      return;
    }

    if (!loading && isOnboardingRequired) {
      router.push('/onboarding');
      return;
    }

    if (user) {
      fetchInterviews();
    }
  }, [user, loading, isOnboardingRequired, router]);

  const fetchInterviews = async () => {
    try {
      const response = await fetch(`/api/get-user-interviews?userId=${user?.uid}`);
      if (!response.ok) throw new Error('Failed to load interviews');

      const result = await response.json();
      setInterviews(result.interviews || []);
    } catch (error) {
      console.error('Error loading interviews:', error);
    } finally {
      setIsLoadingInterviews(false);
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
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="mb-2 bg-gradient-to-r from-orange-600 via-amber-500 to-orange-500 bg-clip-text text-3xl font-bold text-transparent">
                インタビュー履歴
              </h1>
              <p className="text-gray-600">
                過去のインタビュー一覧
              </p>
            </div>
            <button
              onClick={() => router.push('/interview/select-mode')}
              className="btn-gradient-primary rounded-full px-4 py-2 font-semibold text-white shadow-md"
            >
              新規インタビュー
            </button>
          </div>

          {/* ゲストユーザー向けメッセージ */}
          {user?.isAnonymous && (
            <div className="glass-card mb-6 rounded-2xl p-6 text-center">
              <h3 className="mb-2 text-lg font-semibold text-orange-700">
                ゲストモードでは履歴が保存されません
              </h3>
              <p className="mb-4 text-sm text-gray-600">
                ログインすると、インタビュー履歴を永続的に保存できます。
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
              {isLoadingInterviews ? (
                <div className="glass-card rounded-2xl p-8 text-center">
                  <div className="flex items-center justify-center gap-3">
                    <div className="h-6 w-6 animate-spin rounded-full border-4 spinner-warm"></div>
                    <p className="text-gray-600">読み込み中...</p>
                  </div>
                </div>
              ) : interviews.length === 0 ? (
                <div className="glass-card rounded-2xl p-8 text-center">
                  <div className="mb-4 text-5xl">💬</div>
                  <h3 className="mb-2 text-lg font-semibold text-gray-900">
                    まだインタビューがありません
                  </h3>
                  <p className="mb-4 text-sm text-gray-600">
                    最初のインタビューを始めましょう
                  </p>
                  <button
                    onClick={() => router.push('/interview/select-mode')}
                    className="btn-gradient-primary rounded-full px-6 py-2 font-semibold text-white"
                  >
                    インタビューを始める
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {interviews.map((interview) => {
                    const date = new Date(interview.createdAt);
                    const nickname =
                      interview.data.fixed.nickname ||
                      interview.data.fixed.name ||
                      '不明';
                    const modeConfig = interview.mode
                      ? getInterviewMode(interview.mode)
                      : null;
                    const dynamicCount = interview.data.dynamic
                      ? Object.keys(interview.data.dynamic).length
                      : 0;

                    return (
                      <button
                        key={interview.id}
                        onClick={() =>
                          router.push(`/mypage/interview/${interview.id}`)
                        }
                        className="glass-card w-full rounded-2xl p-5 text-left transition-all hover:shadow-md"
                      >
                        <div className="flex items-start gap-4">
                          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-200 to-amber-200 text-2xl">
                            {modeConfig?.icon || '💬'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="mb-1 flex items-center gap-2">
                              <h3 className="font-bold text-gray-900">
                                {nickname}さんのインタビュー
                              </h3>
                              {modeConfig && (
                                <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs text-orange-700">
                                  {modeConfig.name}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600">
                              {interview.data.fixed.occupation || '職業未設定'}
                            </p>
                            <p className="mt-1 text-xs text-gray-400">
                              {date.toLocaleDateString('ja-JP', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              })}
                              {' ・ '}
                              {dynamicCount}件の質問
                              {interview.status === 'in_progress' && (
                                <span className="ml-2 text-amber-600">
                                  （進行中）
                                </span>
                              )}
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
