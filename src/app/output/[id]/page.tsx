'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function OutputDetailRedirect() {
  const params = useParams();
  const router = useRouter();

  useEffect(() => {
    router.replace(`/craft/${params.id}`);
  }, [params.id, router]);

  return null;
}
