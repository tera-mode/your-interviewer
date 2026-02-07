'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { INTERVIEW_MODES, InterviewModeConfig } from '@/lib/interviewModes';
import Cookies from 'js-cookie';
import { v4 as uuidv4 } from 'uuid';
import { usePageHeader } from '@/contexts/PageHeaderContext';

export default function SelectModePage() {
  const router = useRouter();
  const { userInterviewer } = useAuth();
  usePageHeader({ title: 'モード選択', showBackButton: true, onBack: () => router.push('/dig') });

  const handleSelectMode = (mode: InterviewModeConfig) => {
    if (!Cookies.get('guest_session_id')) {
      const sessionId = uuidv4();
      Cookies.set('guest_session_id', sessionId, { expires: 30, path: '/' });
    }

    Cookies.set('interview_mode', mode.id, { expires: 1, path: '/' });

    const selectedInterviewerCookie = Cookies.get('selected_interviewer');
    const interviewerNameCookie = Cookies.get('interviewer_name');

    const hasInterviewerInCookie = selectedInterviewerCookie && interviewerNameCookie;
    const hasInterviewerInUserData = userInterviewer?.id && userInterviewer?.customName;

    if (hasInterviewerInCookie || hasInterviewerInUserData) {
      if (hasInterviewerInUserData && !hasInterviewerInCookie) {
        Cookies.set('selected_interviewer', userInterviewer.id, { expires: 365, path: '/' });
        Cookies.set('interviewer_name', userInterviewer.customName!, { expires: 365, path: '/' });
      }
      router.push(`/dig/interview/${mode.id}`);
    } else {
      router.push('/dig/interview/select-interviewer');
    }
  };

  return (
    <>

      <div className="px-4 py-6">
        <div className="mx-auto max-w-4xl">
          <div className="mb-6 text-center">
            <h2 className="mb-2 text-2xl font-bold text-gray-900">
              インタビューモードを選択
            </h2>
            <p className="text-sm text-gray-600">目的に合わせたモードを選んでください</p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {INTERVIEW_MODES.map((mode) => (
              <button
                key={mode.id}
                onClick={() => handleSelectMode(mode)}
                className="glass-card group flex flex-col items-center gap-3 rounded-2xl p-6 text-left transition-all hover:scale-[1.02] hover-glow"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-emerald-200 to-teal-200 text-2xl shadow-md transition-all group-hover:from-emerald-300 group-hover:to-teal-300">
                  {mode.icon}
                </div>

                <div className="text-center">
                  <h3 className="mb-1 text-lg font-bold text-gray-900">{mode.name}</h3>
                  <p className="mb-3 text-xs text-gray-600">{mode.description}</p>
                </div>

                <div className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
                  {mode.questionCount === 'endless' ? 'いつでも終了可能' : `${mode.questionCount}問`}
                </div>

                <ul className="space-y-1 text-xs text-gray-600">
                  {mode.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-1">
                      <span className="mt-0.5 text-emerald-500">✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
