'use client';

import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getInterviewer } from '@/lib/interviewers';
import { InterviewerId, FixedUserData, DynamicData } from '@/types';

interface InterviewData {
  fixed: FixedUserData;
  dynamic?: DynamicData;
  createdAt: string;
  updatedAt: string;
}

export default function InterviewDetail() {
  const router = useRouter();
  const params = useParams();
  const { user, loading } = useAuth();
  const interviewId = params.id as string;

  const [interviewData, setInterviewData] = useState<InterviewData | null>(null);
  const [interviewerId, setInterviewerId] = useState<InterviewerId | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.push('/login');
      return;
    }

    if (user.isAnonymous) {
      alert('この機能はログインユーザーのみ利用できます。');
      router.push('/');
      return;
    }

    loadInterviewData();
  }, [user, loading, interviewId, router]);

  const loadInterviewData = async () => {
    try {
      console.log('Loading interview detail:', interviewId);

      const response = await fetch(`/api/get-interview?id=${interviewId}`);

      if (!response.ok) {
        throw new Error('Failed to load interview');
      }

      const result = await response.json();
      console.log('Interview detail loaded:', result);

      // インタビューデータとインタビュワーIDを取得
      const fullData = result.interview || {};
      setInterviewData(fullData.data);
      setInterviewerId(fullData.interviewerId);
    } catch (error) {
      console.error('Error loading interview:', error);
      alert('インタビューデータの読み込みに失敗しました。');
      router.push('/mypage');
    } finally {
      setIsLoading(false);
    }
  };

  if (loading || isLoading) {
    return (
      <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-warm">
        <div className="gradient-orb gradient-orb-orange absolute -left-32 top-20 h-80 w-80" />
        <div className="gradient-orb gradient-orb-yellow absolute -right-32 bottom-20 h-72 w-72" />
        <div className="relative z-10 text-center">
          <div className="mb-4 flex justify-center">
            <div className="h-16 w-16 animate-spin rounded-full border-4 spinner-warm"></div>
          </div>
          <p className="text-xl font-semibold text-gray-700">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!interviewData) {
    return (
      <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-warm">
        <div className="gradient-orb gradient-orb-orange absolute -left-32 top-20 h-80 w-80" />
        <div className="gradient-orb gradient-orb-yellow absolute -right-32 bottom-20 h-72 w-72" />
        <div className="relative z-10 text-center">
          <p className="text-xl text-gray-700">インタビューが見つかりませんでした</p>
          <button
            onClick={() => router.push('/mypage')}
            className="btn-gradient-primary mt-4 rounded-full px-6 py-3 font-semibold text-white shadow-md"
          >
            マイページに戻る
          </button>
        </div>
      </div>
    );
  }

  const interviewer = interviewerId ? getInterviewer(interviewerId) : null;

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-warm px-4 py-12">
      {/* 装飾用グラデーションオーブ */}
      <div className="gradient-orb gradient-orb-orange absolute -right-40 top-40 h-96 w-96" />
      <div className="gradient-orb gradient-orb-yellow absolute -left-40 bottom-20 h-80 w-80" />

      <main className="relative z-10 mx-auto max-w-4xl">
        {/* ヘッダー */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <h1 className="bg-gradient-to-r from-orange-600 via-amber-500 to-orange-500 bg-clip-text text-4xl font-bold text-transparent">
            インタビュー詳細
          </h1>
          <button
            onClick={() => router.push('/mypage')}
            className="gradient-border rounded-full bg-white px-6 py-3 font-semibold text-orange-600 shadow-md transition-all hover:shadow-lg"
          >
            マイページに戻る
          </button>
        </div>

        {/* プロフィール */}
        <div className="glass-card mb-8 rounded-3xl p-6">
          <h2 className="mb-4 text-2xl font-bold text-gray-800">プロフィール</h2>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <span className="font-semibold text-gray-700">名前:</span>{' '}
              {interviewData.fixed.name}
            </div>
            <div>
              <span className="font-semibold text-gray-700">ニックネーム:</span>{' '}
              {interviewData.fixed.nickname}
            </div>
            <div>
              <span className="font-semibold text-gray-700">性別:</span>{' '}
              {interviewData.fixed.gender}
            </div>
            <div>
              <span className="font-semibold text-gray-700">年齢:</span>{' '}
              {interviewData.fixed.age}歳
            </div>
            <div>
              <span className="font-semibold text-gray-700">居住地:</span>{' '}
              {interviewData.fixed.location}
            </div>
            <div>
              <span className="font-semibold text-gray-700">職業:</span>{' '}
              {interviewData.fixed.occupation}
            </div>
          </div>
          {interviewData.fixed.occupationDetail && (
            <div className="mt-3">
              <span className="font-semibold text-gray-700">職業詳細:</span>{' '}
              {interviewData.fixed.occupationDetail}
            </div>
          )}
        </div>

        {/* 深掘り情報 */}
        {interviewData.dynamic && Object.keys(interviewData.dynamic).length > 0 && (
          <div className="glass-card mb-8 rounded-3xl p-6">
            <h2 className="mb-4 text-2xl font-bold text-gray-800">深掘り情報</h2>
            <div className="space-y-4">
              {Object.entries(interviewData.dynamic).map(([key, item]) => (
                <div key={key} className="glass rounded-xl p-4">
                  <p className="mb-1 text-xs font-semibold text-orange-600">
                    {item.category}
                  </p>
                  <p className="mb-2 font-semibold text-gray-800">
                    Q: {item.question}
                  </p>
                  <p className="text-gray-700">A: {item.answer}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* アクションボタン */}
        <div className="flex flex-col gap-4 md:flex-row md:justify-center">
          <button
            onClick={() => router.push(`/result?id=${interviewId}`)}
            className="btn-gradient-primary rounded-full px-8 py-4 text-lg font-semibold text-white shadow-lg"
          >
            記事を見る
          </button>
          <button
            onClick={() => router.push('/mypage')}
            className="gradient-border rounded-full bg-white px-8 py-4 text-lg font-semibold text-orange-600 shadow-md transition-all hover:shadow-lg"
          >
            マイページに戻る
          </button>
        </div>
      </main>
    </div>
  );
}
