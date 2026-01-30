'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// 旧URLからのリダイレクト用ページ
// /select-interviewer → /interview/select-interviewer への移行
export default function SelectInterviewerRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/interview/select-interviewer');
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-warm">
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 spinner-warm"></div>
        <p className="text-gray-600">リダイレクト中...</p>
      </div>
    </div>
  );
}
