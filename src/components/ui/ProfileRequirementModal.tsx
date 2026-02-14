'use client';

import { useState } from 'react';
import { ProfileFieldKey, PROFILE_FIELDS } from '@/types/profile';
import { UserProfile } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { Lock } from 'lucide-react';

interface ProfileRequirementModalProps {
  missingKeys: ProfileFieldKey[];
  onComplete: () => void;
  onCancel: () => void;
}

export default function ProfileRequirementModal({
  missingKeys,
  onComplete,
  onCancel,
}: ProfileRequirementModalProps) {
  const { updateUserProfile } = useAuth();
  const [values, setValues] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const missingFields = PROFILE_FIELDS.filter(f => missingKeys.includes(f.key));

  const handleSave = async () => {
    // バリデーション
    for (const field of missingFields) {
      if (!values[field.key]) {
        setError(`${field.label}を入力してください`);
        return;
      }
    }

    setIsSaving(true);
    setError('');

    try {
      const profileUpdate: Partial<UserProfile> = {};
      for (const field of missingFields) {
        const val = values[field.key];
        if (field.key === 'birthYear') {
          (profileUpdate as Record<string, unknown>)[field.key] = Number(val);
        } else {
          (profileUpdate as Record<string, unknown>)[field.key] = val;
        }
      }
      await updateUserProfile(profileUpdate);
      onComplete();
    } catch {
      setError('保存に失敗しました。もう一度お試しください。');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm sm:items-center">
      <div className="w-full max-w-md rounded-t-3xl bg-white p-6 shadow-xl sm:rounded-3xl">
        <h3 className="mb-2 text-center text-lg font-bold text-stone-800">
          この機能を使うには
        </h3>
        <p className="mb-5 text-center text-sm text-stone-500">
          プロフィールの追加設定が必要です
        </p>

        <div className="space-y-4">
          {missingFields.map((field) => (
            <div key={field.key}>
              <label className="mb-1 block text-sm font-semibold text-stone-700">
                {field.label}
              </label>
              {field.inputType === 'select' ? (
                <select
                  value={values[field.key] || ''}
                  onChange={(e) => setValues({ ...values, [field.key]: e.target.value })}
                  className="w-full rounded-xl border border-emerald-200 bg-white px-4 py-3 text-stone-800 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                >
                  <option value="">選択してください</option>
                  {field.options?.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              ) : (
                <input
                  type={field.inputType === 'number' ? 'number' : 'text'}
                  value={values[field.key] || ''}
                  onChange={(e) => setValues({ ...values, [field.key]: e.target.value })}
                  placeholder={field.placeholder}
                  className="w-full rounded-xl border border-emerald-200 bg-white px-4 py-3 text-stone-800 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                />
              )}
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-center gap-2 text-xs text-stone-400">
          <Lock size={12} />
          <span>この情報は外部に公開されません</span>
        </div>

        {error && (
          <p className="mt-3 text-center text-sm text-red-600">{error}</p>
        )}

        <div className="mt-5 space-y-2">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="btn-gradient-primary w-full rounded-xl py-3 font-semibold text-white disabled:opacity-50"
          >
            {isSaving ? '保存中...' : '設定して実行する'}
          </button>
          <button
            onClick={onCancel}
            disabled={isSaving}
            className="w-full rounded-xl py-3 text-sm font-medium text-stone-500 transition-colors hover:text-stone-700 disabled:opacity-50"
          >
            キャンセル
          </button>
        </div>
      </div>
    </div>
  );
}
