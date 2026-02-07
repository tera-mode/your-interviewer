'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Pickaxe, MessageSquare } from 'lucide-react';
import { usePageHeader } from '@/contexts/PageHeaderContext';
import { GlassCard } from '@/components/ui';

export default function DigPage() {
  const router = useRouter();
  usePageHeader({ title: 'ほる' });

  const [isSwipeUsedToday, setIsSwipeUsedToday] = useState(false);

  useEffect(() => {
    const lastDate = localStorage.getItem('lastSwipeDate');
    if (lastDate === new Date().toISOString().slice(0, 10)) {
      setIsSwipeUsedToday(true);
    }
  }, []);

  return (
    <div className="px-4 py-6">
      <div className="mx-auto max-w-lg">
        <div className="mb-6 text-center">
          <h2 className="mb-2 text-2xl font-bold text-gray-900">じぶんを掘り出そう</h2>
          <p className="text-sm text-gray-600">2つの方法であなたの特徴を発見</p>
        </div>

        <div className="space-y-4">
          {/* Swipe diagnosis */}
          <div className="relative">
            <GlassCard
              variant="voxel"
              onClick={isSwipeUsedToday ? undefined : () => router.push('/dig/swipe')}
              className={`w-full border-amber-200/60 ${isSwipeUsedToday ? 'opacity-50 pointer-events-none' : ''}`}
            >
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-200 to-yellow-200 shadow-md">
                  <Pickaxe size={32} className="text-amber-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900">1分じぶん掘り</h3>
                  <p className="text-sm text-gray-600">スワイプ診断でじぶん発見</p>
                </div>
                <span className="text-gray-400">→</span>
              </div>
            </GlassCard>
            {isSwipeUsedToday && (
              <p className="mt-2 text-center text-xs text-gray-500">
                本日の利用回数に達しました。次回は明日ご利用できます
              </p>
            )}
          </div>

          {/* AI Interview */}
          <GlassCard variant="voxel" onClick={() => router.push('/dig/interview/select-mode')} className="w-full border-emerald-200/60">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-200 to-teal-200 shadow-md">
                <MessageSquare size={32} className="text-emerald-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900">AIインタビュー</h3>
                <p className="text-sm text-gray-600">じっくり深掘り</p>
                <span className="mt-1 inline-block rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                  AIと対話
                </span>
              </div>
              <span className="text-gray-400">→</span>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
