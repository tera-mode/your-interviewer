'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { InterviewerId } from '@/types';
import Cookies from 'js-cookie';

interface Interview {
  id: string;
  userId: string;
  interviewerId: InterviewerId;
  data: {
    fixed: {
      name: string;
      nickname: string;
      gender: string;
      age: number;
      location: string;
      occupation: string;
      occupationDetail: string;
    };
    dynamic?: any;
  };
  status: string;
  createdAt: string;
  updatedAt: string;
}

export default function MyPage() {
  const router = useRouter();
  const { user, loading, signOut } = useAuth();
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [isLoadingInterviews, setIsLoadingInterviews] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const isGuest = user?.isAnonymous ?? false;

  useEffect(() => {
    if (loading || isLoggingOut) return;

    if (!user) {
      // ログインしていない場合はログインページへ
      router.push('/login');
      return;
    }

    // ゲストユーザーも含めてインタビューを取得
    fetchInterviews();
  }, [user, loading, router, isLoggingOut]);

  const fetchInterviews = async () => {
    if (!user) return;

    setIsLoadingInterviews(true);
    try {
      console.log('Loading interviews for user:', user.uid);

      const response = await fetch(`/api/get-user-interviews?userId=${user.uid}`);

      if (!response.ok) {
        throw new Error('Failed to load interviews');
      }

      const result = await response.json();
      console.log('Interviews loaded:', result.interviews);

      setInterviews(result.interviews);
    } catch (error) {
      console.error('Error loading interviews:', error);
      alert('インタビュー一覧の読み込みに失敗しました。');
    } finally {
      setIsLoadingInterviews(false);
    }
  };

  const handleSignOut = async () => {
    if (!confirm('ログアウトしますか？')) {
      return;
    }
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

  const handleNewInterview = () => {
    // ゲストセッションIDがない場合は作成
    if (!Cookies.get('guest_session_id')) {
      const { v4: uuidv4 } = require('uuid');
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
    <div className="relative min-h-screen overflow-hidden bg-gradient-warm px-4 py-12">
      {/* 装飾用グラデーションオーブ */}
      <div className="gradient-orb gradient-orb-orange absolute -right-40 top-20 h-96 w-96" />
      <div className="gradient-orb gradient-orb-yellow absolute -left-40 bottom-40 h-80 w-80" />

      <main className="relative z-10 mx-auto max-w-6xl">
        {/* ゲストユーザー向けログイン案内 */}
        {isGuest && (
          <div className="glass-card mb-8 rounded-3xl p-6">
            <div className="flex flex-col items-center gap-4 text-center md:flex-row md:justify-between md:text-left">
              <div>
                <h2 className="text-xl font-bold text-orange-700">
                  ログインしてインタビューを保存しよう
                </h2>
                <p className="mt-2 text-gray-600">
                  ログインすると、インタビュー履歴を永続的に保存できます
                </p>
              </div>
              <button
                onClick={() => router.push('/login')}
                className="btn-gradient-secondary whitespace-nowrap rounded-full px-8 py-3 font-semibold text-white shadow-md"
              >
                ログインして保存
              </button>
            </div>
          </div>
        )}

        {/* ヘッダー */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="bg-gradient-to-r from-orange-600 via-amber-500 to-orange-500 bg-clip-text text-4xl font-bold text-transparent">
              マイページ
            </h1>
            <p className="mt-2 text-gray-600">
              {isGuest ? 'ゲストユーザー' : user.email}
            </p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={handleNewInterview}
              className="btn-gradient-primary rounded-full px-6 py-3 font-semibold text-white shadow-md"
            >
              新しいインタビュー
            </button>
            <button
              onClick={handleSignOut}
              className="rounded-full border border-orange-200 bg-white/80 px-6 py-3 font-semibold text-gray-700 backdrop-blur-sm transition-all hover:bg-orange-50"
            >
              ログアウト
            </button>
          </div>
        </div>

        {/* インタビュー一覧 */}
        <div className="glass-card rounded-3xl p-8">
          <h2 className="mb-6 text-2xl font-bold text-gray-800">
            過去のインタビュー
          </h2>

          {isLoadingInterviews ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 spinner-warm"></div>
              <p className="ml-3 text-gray-600">読み込み中...</p>
            </div>
          ) : interviews.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 mb-4">
                {isGuest
                  ? 'ゲストのインタビュー履歴は保存されません'
                  : 'まだインタビューがありません'}
              </p>
              <div className="flex flex-col items-center gap-3">
                <button
                  onClick={handleNewInterview}
                  className="btn-gradient-primary rounded-full px-6 py-3 font-semibold text-white shadow-md"
                >
                  {isGuest ? 'インタビューを始める' : '最初のインタビューを始める'}
                </button>
                {isGuest && (
                  <button
                    onClick={() => router.push('/login')}
                    className="text-orange-600 underline decoration-orange-300 underline-offset-4 hover:decoration-orange-500"
                  >
                    ログインして履歴を保存する
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {interviews.map((interview) => {
                const date = new Date(interview.createdAt);

                return (
                  <div
                    key={interview.id}
                    className="glass cursor-pointer rounded-2xl p-6 transition-all hover:scale-[1.02] hover-glow"
                    onClick={() => router.push(`/mypage/interview/${interview.id}`)}
                  >
                    {/* 日付 */}
                    <div className="mb-4 text-sm text-orange-600">
                      {date.toLocaleDateString('ja-JP', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </div>

                    {/* 基本情報 */}
                    <div className="space-y-2">
                      <div>
                        <span className="text-sm font-semibold text-gray-700">
                          名前:
                        </span>{' '}
                        <span className="text-sm text-gray-600">
                          {interview.data.fixed.name}
                        </span>
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-gray-700">
                          職業:
                        </span>{' '}
                        <span className="text-sm text-gray-600">
                          {interview.data.fixed.occupation}
                        </span>
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-gray-700">
                          深掘り質問:
                        </span>{' '}
                        <span className="text-sm text-gray-600">
                          {interview.data.dynamic
                            ? Object.keys(interview.data.dynamic).length
                            : 0}
                          件
                        </span>
                      </div>
                    </div>

                    {/* 詳細を見るボタン */}
                    <div className="mt-4 text-center">
                      <span className="text-sm font-semibold text-orange-600">
                        詳細を見る →
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* HOMEに戻るボタン */}
        <div className="mt-8 text-center">
          <button
            onClick={() => router.push('/home')}
            className="text-gray-500 underline decoration-orange-300 underline-offset-4 hover:text-orange-600 hover:decoration-orange-500"
          >
            HOMEに戻る
          </button>
        </div>
      </main>
    </div>
  );
}
