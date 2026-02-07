'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function InterviewModeRedirect() {
  const params = useParams();
  const router = useRouter();

  useEffect(() => {
    router.replace(`/dig/interview/${params.mode}`);
  }, [params.mode, router]);

  return null;
}
