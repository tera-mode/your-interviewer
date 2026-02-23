'use client';

import Link from 'next/link';
import { Lock } from 'lucide-react';
import { EncounterCategory } from '@/types/encounter';
import { ENCOUNTER_UNLOCK_RULES } from '@/lib/encounter/unlockRules';

interface CategoryCardProps {
  category: EncounterCategory;
  traitCount: number;
  itemCount?: number;
}

export default function CategoryCard({ category, traitCount, itemCount }: CategoryCardProps) {
  const rule = ENCOUNTER_UNLOCK_RULES[category];
  const isUnlocked = traitCount >= rule.requiredTraits;
  const remaining = rule.requiredTraits - traitCount;

  const gradientMap: Record<EncounterCategory, string> = {
    books: 'from-amber-100 to-orange-100',
    movies: 'from-violet-100 to-purple-100',
    goods: 'from-rose-100 to-pink-100',
    skills: 'from-sky-100 to-blue-100',
  };

  const borderMap: Record<EncounterCategory, string> = {
    books: 'border-amber-200',
    movies: 'border-violet-200',
    goods: 'border-rose-200',
    skills: 'border-sky-200',
  };

  const textMap: Record<EncounterCategory, string> = {
    books: 'text-amber-700',
    movies: 'text-violet-700',
    goods: 'text-rose-700',
    skills: 'text-sky-700',
  };

  const content = (
    <div
      className={`glass-card border ${borderMap[category]} bg-gradient-to-br ${gradientMap[category]} p-5 transition-all ${
        isUnlocked ? 'hover:shadow-lg hover:-translate-y-0.5 cursor-pointer' : 'opacity-60'
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="text-3xl mb-2">{rule.icon}</div>
          <h3 className={`text-base font-bold ${textMap[category]}`}>{rule.label}とのであい</h3>
          <p className="text-xs text-stone-500 mt-1">{rule.description}</p>
        </div>
        {!isUnlocked && (
          <div className="flex items-center gap-1 rounded-full bg-stone-100 px-2 py-1">
            <Lock size={12} className="text-stone-400" />
            <span className="text-xs text-stone-400">あと{remaining}個</span>
          </div>
        )}
      </div>
      {isUnlocked && (
        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs text-stone-500">
            {itemCount !== undefined ? `${itemCount}件のであい` : 'であいを探す'}
          </span>
          <span className={`text-xs font-medium ${textMap[category]}`}>→</span>
        </div>
      )}
      {!isUnlocked && (
        <div className="mt-3">
          <div className="h-1.5 overflow-hidden rounded-full bg-stone-200">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-400 transition-all"
              style={{ width: `${Math.min(100, (traitCount / rule.requiredTraits) * 100)}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-stone-400">
            {traitCount}/{rule.requiredTraits}個で解放
          </p>
        </div>
      )}
    </div>
  );

  if (!isUnlocked) return content;

  return (
    <Link href={`/encounter/${category}`}>
      {content}
    </Link>
  );
}
