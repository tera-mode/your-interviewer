'use client';

interface MatchedTraitBadgesProps {
  traits: string[];
  maxDisplay?: number;
}

export default function MatchedTraitBadges({ traits, maxDisplay = 3 }: MatchedTraitBadgesProps) {
  const displayed = traits.slice(0, maxDisplay);
  const remaining = traits.length - maxDisplay;

  return (
    <div className="flex flex-wrap gap-1.5">
      {displayed.map((trait) => (
        <span
          key={trait}
          className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 border border-emerald-100"
        >
          📎 {trait}
        </span>
      ))}
      {remaining > 0 && (
        <span className="inline-flex items-center rounded-full bg-stone-50 px-2.5 py-1 text-xs text-stone-400 border border-stone-100">
          +{remaining}
        </span>
      )}
    </div>
  );
}
