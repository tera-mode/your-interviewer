'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import UserHeader from '@/components/UserHeader';
import { OccupationCategory } from '@/types';

const OCCUPATION_OPTIONS: OccupationCategory[] = [
  '会社員',
  '経営者',
  '自営業',
  '公務員',
  'フリーランス',
  '主婦/主夫',
  '学生（小学生）',
  '学生（中学生）',
  '学生（高校生）',
  '学生（大学生）',
  '学生（大学院生）',
  '無職',
  'その他',
];

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading, userProfile, updateUserProfile } = useAuth();

  const [nickname, setNickname] = useState('');
  const [occupation, setOccupation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
      return;
    }

    if (!loading && user?.isAnonymous) {
      router.push('/mypage');
      return;
    }

    if (userProfile) {
      setNickname(userProfile.nickname || '');
      setOccupation(userProfile.occupation || '');
    }
  }, [user, loading, userProfile, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!nickname.trim()) {
      setError('ニックネームを入力してください');
      return;
    }

    setIsSubmitting(true);

    try {
      await updateUserProfile({
        nickname: nickname.trim(),
        occupation,
        onboardingCompleted: true,
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('保存に失敗しました。もう一度お試しください。');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-warm">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 spinner-warm"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-gradient-warm">
      <div className="gradient-orb gradient-orb-orange absolute -right-40 top-20 h-96 w-96" />
      <div className="gradient-orb gradient-orb-yellow absolute -left-40 bottom-20 h-80 w-80" />

      <UserHeader />

      <div className="relative z-10 flex flex-1 items-center justify-center px-4 py-8">
        <main className="w-full max-w-md">
          <div className="glass-card rounded-3xl p-8">
            <div className="mb-6 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-orange-200 to-amber-200 text-3xl shadow-lg">
                👤
              </div>
              <h1 className="text-2xl font-bold text-gray-900">基本情報編集</h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="nickname"
                  className="mb-2 block text-sm font-semibold text-gray-700"
                >
                  ニックネーム
                  <span className="ml-1 text-orange-500">*</span>
                </label>
                <input
                  type="text"
                  id="nickname"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="呼んでほしい名前を入力"
                  className="w-full rounded-xl border border-orange-200 bg-white/80 px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-200"
                  maxLength={20}
                />
              </div>

              <div>
                <label
                  htmlFor="occupation"
                  className="mb-2 block text-sm font-semibold text-gray-700"
                >
                  職業
                </label>
                <select
                  id="occupation"
                  value={occupation}
                  onChange={(e) => setOccupation(e.target.value)}
                  className="w-full rounded-xl border border-orange-200 bg-white/80 px-4 py-3 text-gray-900 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-200"
                >
                  <option value="">選択してください</option>
                  {OCCUPATION_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              {error && (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              {success && (
                <div className="rounded-lg bg-green-50 p-3 text-sm text-green-600">
                  保存しました
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-gradient-primary w-full rounded-xl py-4 text-lg font-bold text-white shadow-lg transition-all hover:shadow-xl disabled:opacity-50"
              >
                {isSubmitting ? '保存中...' : '保存する'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => router.push('/mypage')}
                className="text-gray-500 underline decoration-orange-300 underline-offset-4 hover:text-orange-600"
              >
                マイページに戻る
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
