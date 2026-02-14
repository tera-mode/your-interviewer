'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';
import { Lock } from 'lucide-react';
import { ProfileFieldKey, PROFILE_FIELDS } from '@/types/profile';

interface MenuCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  iconColor: string;
  bgGradient: string;
  buttonGradient: string;
  href: string;
  disabled?: boolean;
  disabledMessage?: string;
  // ゲーティング拡張
  traitsMet?: boolean;
  minTraits?: number;
  traitCount?: number;
  missingProfileKeys?: ProfileFieldKey[];
  needsLogin?: boolean;
  // ミッション風表示
  isNextMission?: boolean;
}

export default function MenuCard({
  title,
  description,
  icon: Icon,
  iconColor,
  bgGradient,
  buttonGradient,
  href,
  disabled = false,
  traitsMet,
  minTraits,
  traitCount,
  missingProfileKeys = [],
  needsLogin = false,
  isNextMission = false,
}: MenuCardProps) {
  const router = useRouter();

  const hasConditions = !needsLogin && (minTraits !== undefined || missingProfileKeys.length > 0);
  const traitsProgress = minTraits && traitCount !== undefined
    ? Math.min(100, Math.round((traitCount / minTraits) * 100))
    : 100;

  // --- アンロック済み ---
  if (!disabled) {
    return (
      <div className="glass-card rounded-2xl p-4">
        <div className="flex items-center gap-4">
          <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${bgGradient}`}>
            <Icon size={24} className={iconColor} />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-bold text-stone-800">{title}</h3>
            <p className="text-sm text-stone-500">{description}</p>
          </div>
          <button
            onClick={() => router.push(href)}
            className={`flex-shrink-0 rounded-xl bg-gradient-to-r ${buttonGradient} px-4 py-2 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg`}
          >
            はじめる
          </button>
        </div>
      </div>
    );
  }

  // --- ロック中（ミッション風） ---
  return (
    <div className={`relative rounded-2xl border p-4 transition-all ${
      isNextMission
        ? 'border-stone-300 bg-white/70'
        : 'border-stone-200/60 bg-white/60'
    }`}>
      {/* NEXT バッジ */}
      {isNextMission && (
        <div className="absolute -top-2.5 left-4 rounded-full border border-stone-300 bg-white px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-stone-500">
          NEXT
        </div>
      )}

      <div className="flex items-center gap-4">
        <div className={`relative flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-stone-100`}>
          <Icon size={24} className="text-stone-400" />
          {!isNextMission && (
            <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-stone-300">
              <Lock size={10} className="text-white" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-bold text-stone-500">
            {title}
          </h3>
          <p className="text-sm text-stone-400">
            {description}
          </p>
        </div>
      </div>

      {/* 解放条件 */}
      {hasConditions && (
        <div className="mt-3 rounded-xl bg-stone-50/80 p-3">
          <p className="mb-2 text-xs font-bold text-stone-500">
            🔓 解放条件
          </p>

          {/* 特徴プログレスバー */}
          {minTraits !== undefined && minTraits > 0 && (
            <div className="mb-2">
              <div className="mb-1 flex items-center justify-between">
                <span className={`text-xs font-medium ${traitsMet ? 'text-emerald-600' : 'text-stone-500'}`}>
                  {traitsMet ? '✅' : '⬜'} 特徴 {minTraits}個以上
                </span>
                <span className={`text-xs font-bold ${traitsMet ? 'text-emerald-600' : 'text-stone-400'}`}>
                  {traitCount}/{minTraits}
                </span>
              </div>
              {!traitsMet && (
                <div className="h-2 overflow-hidden rounded-full bg-stone-100">
                  <div
                    className="h-full rounded-full bg-stone-300 transition-all duration-500"
                    style={{ width: `${traitsProgress}%` }}
                  />
                </div>
              )}
            </div>
          )}

          {/* プロフィール条件 */}
          {missingProfileKeys.map((key) => {
            const field = PROFILE_FIELDS.find(f => f.key === key);
            return (
              <div key={key} className="flex items-center gap-2 text-xs">
                <span>⬜</span>
                <span className="text-stone-500">
                  プロフィール「{field?.label || key}」を設定
                </span>
              </div>
            );
          })}

          {/* プロフィール設定リンク */}
          {missingProfileKeys.length > 0 && (
            <Link
              href="/mypage?tab=profile"
              className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-stone-400 hover:text-stone-600"
            >
              → プロフィールを設定する
            </Link>
          )}
        </div>
      )}

      {/* ログイン必要メッセージ */}
      {needsLogin && (
        <div className="mt-3 rounded-xl bg-amber-50/80 p-3">
          <p className="text-xs font-bold text-amber-700">
            🔒 ログインが必要です
          </p>
        </div>
      )}
    </div>
  );
}
