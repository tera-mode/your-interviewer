'use client';

import { useRouter } from 'next/navigation';
import { Pickaxe } from 'lucide-react';

interface TraitGateCTAProps {
  currentTraits: number;
  requiredTraits: number;
  categoryLabel?: string;
}

export default function TraitGateCTA({
  currentTraits,
  requiredTraits,
  categoryLabel,
}: TraitGateCTAProps) {
  const router = useRouter();
  const remaining = requiredTraits - currentTraits;

  return (
    <div className="glass-card p-6 text-center">
      <div className="mb-4 flex justify-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-emerald-100 to-teal-100">
          <Pickaxe size={32} className="text-emerald-600" />
        </div>
      </div>
      <h3 className="mb-2 text-lg font-bold text-stone-800">
        特徴をもっと集めよう
      </h3>
      <p className="mb-2 text-sm text-stone-500">
        {categoryLabel ? `「${categoryLabel}とのであい」を解放するには` : 'であいを解放するには'}
        あと<span className="font-bold text-emerald-600">{remaining}個</span>の特徴が必要です
      </p>

      <div className="mx-auto mb-4 max-w-xs">
        <div className="mb-1 flex justify-between text-xs text-stone-400">
          <span>現在 {currentTraits}個</span>
          <span>目標 {requiredTraits}個</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-stone-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-400 transition-all"
            style={{ width: `${Math.min(100, (currentTraits / requiredTraits) * 100)}%` }}
          />
        </div>
      </div>

      <button
        onClick={() => router.push('/dig')}
        className="btn-gradient-primary rounded-xl px-6 py-3 font-semibold text-white"
      >
        特徴をほりに行く →
      </button>
    </div>
  );
}
