'use client';

import { RefreshCw } from 'lucide-react';

interface RefreshButtonProps {
  onRefresh: () => void;
  isLoading?: boolean;
  generatedAt?: string;
}

function formatRelativeTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMin / 60);

  if (diffMin < 1) return 'たった今';
  if (diffMin < 60) return `${diffMin}分前`;
  if (diffHour < 24) return `${diffHour}時間前`;
  return `${Math.floor(diffHour / 24)}日前`;
}

export default function RefreshButton({ onRefresh, isLoading, generatedAt }: RefreshButtonProps) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-stone-400">
        {generatedAt ? `最終更新: ${formatRelativeTime(generatedAt)}` : ''}
      </span>
      <button
        onClick={onRefresh}
        disabled={isLoading}
        className="flex items-center gap-2 rounded-xl bg-stone-100 px-4 py-2 text-sm font-medium text-stone-600 transition-all hover:bg-stone-200 disabled:opacity-50"
      >
        <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
        新しいであいを探す
      </button>
    </div>
  );
}
