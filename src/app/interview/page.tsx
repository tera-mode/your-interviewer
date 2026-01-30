'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { InterviewMode } from '@/types';

// 旧URLからのリダイレクト用ページ
// /interview → /interview/[mode] への移行
export default function InterviewRedirect() {
  const router = useRouter();

  useEffect(() => {
    // 保存されているモードがあればそのモードへ、なければモード選択へ
    const savedMode = Cookies.get('interview_mode') as InterviewMode;

    if (savedMode) {
      // インタビュワーが選択されているか確認
      const selectedInterviewer = Cookies.get('selected_interviewer');
      const interviewerName = Cookies.get('interviewer_name');

      if (selectedInterviewer && interviewerName) {
        router.replace(`/interview/${savedMode}`);
      } else {
        router.replace('/interview/select-interviewer');
      }
    } else {
      router.replace('/interview/select-mode');
    }
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
