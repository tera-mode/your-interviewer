'use client';

import { Sparkles } from 'lucide-react';

interface PersonalityInsightProps {
  context: string;
}

export default function PersonalityInsight({ context }: PersonalityInsightProps) {
  return (
    <div className="glass-card p-4 bg-gradient-to-r from-emerald-50/60 to-teal-50/60">
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-400">
          <Sparkles size={16} className="text-white" />
        </div>
        <div>
          <p className="text-xs font-semibold text-emerald-700 mb-1">あなたの好みの傾向</p>
          <p className="text-sm leading-relaxed text-stone-700">{context}</p>
        </div>
      </div>
    </div>
  );
}
