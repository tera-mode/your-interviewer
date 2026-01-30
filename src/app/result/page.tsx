'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { FixedUserData, DynamicData, InterviewData } from '@/types';
import UserHeader from '@/components/UserHeader';
import Cookies from 'js-cookie';

function ResultContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const interviewId = searchParams.get('id');

  const [interviewData, setInterviewData] = useState<Partial<InterviewData> | null>(null);
  const [article, setArticle] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    console.log('Result page loaded with ID:', interviewId);

    if (!interviewId) {
      console.error('No interview ID provided, redirecting to home');
      router.push('/');
      return;
    }

    // FirestoreからインタビューデータをIDで取得
    loadInterviewData(interviewId);
  }, [router, interviewId]);

  const loadInterviewData = async (id: string) => {
    try {
      console.log('Loading interview data from Firestore:', id);

      const response = await fetch(`/api/get-interview?id=${id}`);

      if (!response.ok) {
        throw new Error('Failed to load interview data');
      }

      const result = await response.json();
      console.log('Interview data loaded:', result);

      setInterviewData(result.data);

      // 記事生成
      if (result.data.fixed) {
        console.log('Generating article with fixed data');
        generateArticle(result.data.fixed);
      } else {
        console.error('No fixed data found in interview data');
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error loading interview data:', error);
      alert('インタビューデータの読み込みに失敗しました。');
      router.push('/');
    }
  };

  const generateArticle = async (data: Partial<FixedUserData>) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/generate-article', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ interviewData: data }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate article');
      }

      const result = await response.json();
      setArticle(result.article);
    } catch (error) {
      console.error('Error generating article:', error);
      setArticle('記事の生成に失敗しました。もう一度お試しください。');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyArticle = async () => {
    try {
      await navigator.clipboard.writeText(article);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  };

  const handleStartNew = () => {
    router.push('/interview/select-mode');
  };

  const handleCreateOutput = () => {
    router.push('/output/create');
  };

  if (isLoading) {
    return (
      <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-warm">
        {/* 装飾用グラデーションオーブ */}
        <div className="gradient-orb gradient-orb-orange absolute -left-32 top-20 h-80 w-80" />
        <div className="gradient-orb gradient-orb-yellow absolute -right-32 bottom-20 h-72 w-72" />

        <div className="relative z-10 text-center">
          <div className="mb-4 flex justify-center">
            <div className="h-16 w-16 animate-spin rounded-full border-4 spinner-warm"></div>
          </div>
          <p className="text-xl font-semibold text-gray-700">
            インタビュー記事を生成中...
          </p>
          <p className="mt-2 text-gray-500">少々お待ちください</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-warm">
      {/* 装飾用グラデーションオーブ */}
      <div className="gradient-orb gradient-orb-orange absolute -right-40 top-40 h-96 w-96" />
      <div className="gradient-orb gradient-orb-yellow absolute -left-40 bottom-20 h-80 w-80" />

      {/* ユーザーヘッダー */}
      <UserHeader />

      <div className="relative z-10 px-4 py-12">
        <main className="mx-auto max-w-4xl">
        {/* ヘッダー */}
        <div className="mb-8 text-center">
          <h1 className="mb-4 bg-gradient-to-r from-orange-600 via-amber-500 to-orange-500 bg-clip-text text-4xl font-bold text-transparent md:text-5xl">
            インタビュー記事が完成しました
          </h1>
          <p className="text-lg text-gray-600">
            あなたの魅力を引き出した記事をご覧ください
          </p>
        </div>

        {/* プロフィール概要 */}
        {interviewData && (
          <div className="glass-card mb-8 rounded-3xl p-6">
            <h2 className="mb-4 text-2xl font-bold text-gray-800">
              プロフィール
            </h2>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <span className="font-semibold text-gray-700">名前:</span>{' '}
                {interviewData.fixed?.name}
              </div>
              <div>
                <span className="font-semibold text-gray-700">ニックネーム:</span>{' '}
                {interviewData.fixed?.nickname}
              </div>
              <div>
                <span className="font-semibold text-gray-700">性別:</span>{' '}
                {interviewData.fixed?.gender}
              </div>
              <div>
                <span className="font-semibold text-gray-700">年齢:</span>{' '}
                {interviewData.fixed?.age}歳
              </div>
              <div>
                <span className="font-semibold text-gray-700">居住地:</span>{' '}
                {interviewData.fixed?.location}
              </div>
              <div>
                <span className="font-semibold text-gray-700">職業:</span>{' '}
                {interviewData.fixed?.occupation}
              </div>
            </div>
            {interviewData.fixed?.occupationDetail && (
              <div className="mt-3">
                <span className="font-semibold text-gray-700">職業詳細:</span>{' '}
                {interviewData.fixed.occupationDetail}
              </div>
            )}

            {/* 深掘り情報（Phase 2-1で追加） */}
            {interviewData.dynamic &&
              Object.keys(interviewData.dynamic).length > 0 && (
                <>
                  <hr className="my-6 border-orange-200" />
                  <h3 className="mb-3 text-xl font-semibold text-gray-800">
                    深掘り情報
                  </h3>
                  <div className="space-y-4">
                    {Object.entries(interviewData.dynamic).map(
                      ([key, item]) => (
                        <div key={key} className="glass rounded-xl p-4">
                          <p className="mb-1 text-xs font-semibold text-orange-600">
                            {item.category}
                          </p>
                          <p className="mb-2 font-semibold text-gray-800">
                            Q: {item.question}
                          </p>
                          <p className="text-gray-700">A: {item.answer}</p>
                        </div>
                      )
                    )}
                  </div>
                </>
              )}
          </div>
        )}

        {/* インタビュー記事 */}
        <div className="glass-card mb-8 rounded-3xl p-8">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-800">インタビュー記事</h2>
            <button
              onClick={handleCopyArticle}
              className={`rounded-full px-6 py-2 font-semibold text-white shadow-md transition-all ${
                copySuccess
                  ? 'bg-green-500'
                  : 'btn-gradient-primary'
              }`}
            >
              {copySuccess ? 'コピーしました！' : 'コピー'}
            </button>
          </div>
          <div className="prose max-w-none">
            <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
              {article}
            </div>
          </div>
        </div>

        {/* アウトプット作成CTA */}
        <div className="glass-card mb-8 rounded-3xl p-6 text-center">
          <h3 className="mb-2 text-xl font-bold text-gray-800">
            アウトプットを作成しませんか？
          </h3>
          <p className="mb-4 text-gray-600">
            インタビューで発見した特徴から、SNSプロフィールや自己PR文を自動生成できます
          </p>
          <button
            onClick={handleCreateOutput}
            className="btn-gradient-secondary rounded-full px-8 py-3 text-lg font-semibold text-white shadow-lg"
          >
            アウトプットを作成する
          </button>
        </div>

        {/* アクションボタン */}
        <div className="flex flex-col gap-4 md:flex-row md:justify-center">
          <button
            onClick={handleStartNew}
            className="btn-gradient-primary rounded-full px-8 py-4 text-lg font-semibold text-white shadow-lg"
          >
            新しいインタビューを始める
          </button>
          <button
            onClick={() => router.push('/home')}
            className="gradient-border rounded-full bg-white px-8 py-4 text-lg font-semibold text-orange-600 shadow-md transition-all hover:shadow-lg"
          >
            HOMEに戻る
          </button>
        </div>
        </main>
      </div>
    </div>
  );
}

export default function Result() {
  return (
    <Suspense fallback={
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
    }>
      <ResultContent />
    </Suspense>
  );
}
