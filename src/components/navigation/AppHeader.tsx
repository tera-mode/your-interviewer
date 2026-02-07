'use client';

import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';

interface AppHeaderProps {
  title?: string;
  showBackButton?: boolean;
  onBack?: () => void;
  rightAction?: React.ReactNode;
}

export default function AppHeader({ title, showBackButton = false, onBack, rightAction }: AppHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <header className="sticky top-0 z-30 glass-header px-4 py-3 shadow-sm">
      <div className="mx-auto flex max-w-4xl items-center justify-between">
        <div className="flex items-center gap-2">
          {showBackButton && (
            <button onClick={handleBack} className="rounded-full p-1 hover:bg-white/50 transition-colors">
              <ChevronLeft size={24} className="text-gray-700" />
            </button>
          )}
          {title && (
            <h1 className="text-lg font-bold text-gray-900">{title}</h1>
          )}
        </div>
        {rightAction && <div>{rightAction}</div>}
      </div>
    </header>
  );
}
