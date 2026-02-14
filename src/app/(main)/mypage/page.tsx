'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Cookies from 'js-cookie';
import { useAuth } from '@/contexts/AuthContext';
import { useTraits } from '@/contexts/TraitsContext';
import { TraitCard } from '@/components/interview';
import { PROFILE_FIELDS, ProfileFieldKey } from '@/types/profile';
import { InterviewerId, UserProfile } from '@/types';
import { INTERVIEWERS } from '@/lib/interviewers';
import { ArrowRight, LogOut, RotateCcw, ChevronRight, Lock } from 'lucide-react';
import { usePageHeader } from '@/contexts/PageHeaderContext';

type TabKey = 'traits' | 'profile';

export default function MyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, userProfile, userInterviewer, updateUserProfile, updateUserInterviewer, signOut } = useAuth();
  const { traits, isLoading, deleteTrait, traitCount, categoryBreakdown } = useTraits();
  usePageHeader({ title: 'じぶん' });

  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<TabKey>(tabParam === 'profile' ? 'profile' : 'traits');

  // Traits tab state
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [deletingTraitLabel, setDeletingTraitLabel] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  // Profile tab state
  const [editingField, setEditingField] = useState<ProfileFieldKey | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<ProfileFieldKey | null>(null);

  // Interviewer state
  const [showInterviewer, setShowInterviewer] = useState(false);
  const [selectedInterviewer, setSelectedInterviewer] = useState<InterviewerId | null>(null);
  const [interviewerName, setInterviewerName] = useState('');
  const [customPersonality, setCustomPersonality] = useState('');
  const [isSubmittingInterviewer, setIsSubmittingInterviewer] = useState(false);
  const [interviewerSuccess, setInterviewerSuccess] = useState(false);
  const [error, setError] = useState('');

  const isGuest = user?.isAnonymous ?? false;
  const displayName = userProfile?.nickname || user?.displayName || (isGuest ? 'ゲスト' : user?.email?.split('@')[0]);

  // URL searchParams と activeTab を同期
  useEffect(() => {
    const newTab = searchParams.get('tab');
    if (newTab === 'profile') setActiveTab('profile');
  }, [searchParams]);

  // Interviewer設定の初期化
  useEffect(() => {
    const cookieInterviewer = Cookies.get('selected_interviewer') as InterviewerId;
    const cookieName = Cookies.get('interviewer_name');
    if (userInterviewer) {
      setSelectedInterviewer(userInterviewer.id);
      setInterviewerName(userInterviewer.customName);
      setCustomPersonality(userInterviewer.customPersonality || '');
    } else if (cookieInterviewer) {
      setSelectedInterviewer(cookieInterviewer);
      setInterviewerName(cookieName || '');
      setCustomPersonality(Cookies.get('interviewer_customization') || '');
    }
  }, [userInterviewer]);

  const handleTabChange = (tab: TabKey) => {
    setActiveTab(tab);
    const url = tab === 'profile' ? '/mypage?tab=profile' : '/mypage';
    router.replace(url, { scroll: false });
  };

  // --- Traits tab handlers ---
  const filteredTraits =
    selectedCategory === 'all'
      ? traits
      : traits.filter((t) => t.category === selectedCategory);

  const handleDeleteTrait = async (traitLabel: string) => {
    setDeletingTraitLabel(traitLabel);
    try {
      await deleteTrait(traitLabel);
      setShowDeleteConfirm(null);
    } catch {
      alert('特徴の削除に失敗しました。もう一度お試しください。');
    } finally {
      setDeletingTraitLabel(null);
    }
  };

  // --- Profile tab handlers ---
  const getFieldValue = (key: ProfileFieldKey): string => {
    if (!userProfile) return '';
    const val = userProfile[key as keyof UserProfile];
    if (val === undefined || val === null) return '';
    return String(val);
  };

  const handleStartEdit = (key: ProfileFieldKey) => {
    setEditingField(key);
    setEditValue(getFieldValue(key));
  };

  const handleSaveField = async (key: ProfileFieldKey) => {
    setIsSaving(true);
    try {
      const value = key === 'birthYear' ? (editValue ? Number(editValue) : undefined) : editValue || undefined;
      await updateUserProfile({ [key]: value } as Partial<UserProfile>);
      setEditingField(null);
      setSaveSuccess(key);
      setTimeout(() => setSaveSuccess(null), 2000);
    } catch {
      setError('保存に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingField(null);
    setEditValue('');
  };

  // --- Interviewer handlers ---
  const handleSaveInterviewer = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!selectedInterviewer || !interviewerName.trim()) { setError('インタビュワーと名前を設定してください'); return; }
    setIsSubmittingInterviewer(true);
    try {
      Cookies.set('selected_interviewer', selectedInterviewer, { expires: 365, path: '/' });
      Cookies.set('interviewer_name', interviewerName.trim(), { expires: 365, path: '/' });
      if (customPersonality.trim()) {
        Cookies.set('interviewer_customization', customPersonality.trim(), { expires: 365, path: '/' });
      } else {
        Cookies.remove('interviewer_customization');
      }
      if (user && !user.isAnonymous) {
        await updateUserInterviewer({
          id: selectedInterviewer,
          customName: interviewerName.trim(),
          customPersonality: customPersonality.trim() || undefined,
        });
      }
      setInterviewerSuccess(true);
      setTimeout(() => setInterviewerSuccess(false), 3000);
    } catch { setError('保存に失敗しました。'); }
    finally { setIsSubmittingInterviewer(false); }
  };

  const handleSignOut = async () => {
    if (!confirm('ログアウトしますか？')) return;
    try {
      await signOut();
      router.push('/');
    } catch {
      alert('ログアウトに失敗しました。');
    }
  };

  const handleGuestReset = async () => {
    if (!confirm('すべてのデータを削除して、最初からやり直しますか？')) return;
    try {
      await signOut();
      localStorage.clear();
      sessionStorage.clear();
      const allCookies = Cookies.get();
      Object.keys(allCookies).forEach((name) => Cookies.remove(name, { path: '/' }));
      router.push('/');
    } catch {
      alert('リセットに失敗しました。');
    }
  };

  const selectedInterviewerData = selectedInterviewer
    ? INTERVIEWERS.find((i) => i.id === selectedInterviewer) : null;

  const publicFields = PROFILE_FIELDS.filter(f => !f.isPrivate);
  const privateFields = PROFILE_FIELDS.filter(f => f.isPrivate);

  return (
    <>
      <div className="px-4 py-6">
        <div className="mx-auto max-w-4xl">
          {/* Profile summary - タブの外、常に表示 */}
          <div className="glass-card mb-6 p-4">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-emerald-200 to-teal-200 text-2xl shadow-md">
                {userProfile?.nickname ? '😊' : '👤'}
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-stone-800">
                  {displayName}さん
                </h2>
                {userProfile?.occupation && (
                  <p className="text-sm text-stone-500">{userProfile.occupation}</p>
                )}
              </div>
              <span className="text-sm font-medium text-emerald-600">{traitCount}個の特徴</span>
            </div>
          </div>

          {/* Pill型タブ切替 */}
          <div className="mb-6 flex gap-2">
            <button
              onClick={() => handleTabChange('traits')}
              className={`flex-1 rounded-full px-4 py-2.5 text-sm font-medium transition-all ${
                activeTab === 'traits'
                  ? 'bg-emerald-500 text-white'
                  : 'bg-white/50 text-stone-700 hover:bg-white/80'
              }`}
            >
              💎 特徴
            </button>
            <button
              onClick={() => handleTabChange('profile')}
              className={`flex-1 rounded-full px-4 py-2.5 text-sm font-medium transition-all ${
                activeTab === 'profile'
                  ? 'bg-emerald-500 text-white'
                  : 'bg-white/50 text-stone-700 hover:bg-white/80'
              }`}
            >
              👤 プロフィール
            </button>
          </div>

          {/* ===== 特徴タブ ===== */}
          {activeTab === 'traits' && (
            <>
              {/* Craft CTA */}
              {traitCount > 0 && (
                <button
                  onClick={() => router.push('/craft')}
                  className="mb-4 flex w-full items-center justify-between rounded-xl border border-dashed border-emerald-300 bg-emerald-50/50 px-4 py-3 transition-all hover:bg-emerald-50"
                >
                  <span className="text-sm text-emerald-700">この特徴を使って表現しよう</span>
                  <span className="flex items-center gap-1 text-sm font-semibold text-emerald-600">
                    つくる <ArrowRight size={14} />
                  </span>
                </button>
              )}

              {/* Trait stats */}
              <div className="glass-card mb-4 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-stone-700">
                    集めた特徴: <span className="font-bold text-emerald-600">{traitCount}個</span>
                  </span>
                  <button
                    onClick={() => router.push('/dig')}
                    className="text-sm text-emerald-600 underline"
                  >
                    もっとほる
                  </button>
                </div>
              </div>

              {isLoading ? (
                <div className="glass-card p-8 text-center">
                  <div className="flex items-center justify-center gap-3">
                    <div className="h-6 w-6 animate-spin rounded-full border-4 spinner-warm"></div>
                    <p className="text-stone-500">読み込み中...</p>
                  </div>
                </div>
              ) : traits.length === 0 ? (
                <div className="glass-card p-8 text-center">
                  <div className="mb-4 text-5xl">🏷️</div>
                  <h3 className="mb-2 text-lg font-semibold text-stone-800">
                    まだ特徴がありません
                  </h3>
                  <p className="mb-4 text-sm text-stone-500">
                    スワイプ診断やインタビューで、あなたの特徴を発見しましょう
                  </p>
                  <button
                    onClick={() => router.push('/dig')}
                    className="btn-gradient-primary rounded-xl px-6 py-2 font-semibold text-white"
                  >
                    特徴をほりにいく
                  </button>
                </div>
              ) : (
                <>
                  {/* Category filter */}
                  <div className="mb-4 flex flex-wrap gap-2">
                    <button
                      onClick={() => setSelectedCategory('all')}
                      className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                        selectedCategory === 'all'
                          ? 'bg-emerald-500 text-white'
                          : 'bg-white/50 text-stone-700 hover:bg-white/80'
                      }`}
                    >
                      すべて ({traitCount})
                    </button>
                    {categoryBreakdown
                      .filter((cat) => cat.count > 0)
                      .map((cat) => (
                        <button
                          key={cat.key}
                          onClick={() => setSelectedCategory(cat.key)}
                          className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                            selectedCategory === cat.key
                              ? 'bg-emerald-500 text-white'
                              : 'bg-white/50 text-stone-700 hover:bg-white/80'
                          }`}
                        >
                          {cat.label} ({cat.count})
                        </button>
                      ))}
                  </div>

                  {/* Trait cards */}
                  <div className="grid gap-4 md:grid-cols-2">
                    {filteredTraits.map((trait) => (
                      <div key={trait.id} className="flex flex-col">
                        <button
                          onClick={() => router.push(`/mypage/${trait.id}`)}
                          className="text-left"
                        >
                          <TraitCard trait={trait} size="full" />
                        </button>
                        <div className="flex justify-end mt-1 px-1">
                          <button
                            onClick={() => setShowDeleteConfirm(trait.label)}
                            disabled={deletingTraitLabel === trait.label}
                            className="text-xs text-stone-400 hover:text-red-500 transition-colors disabled:opacity-50 flex items-center gap-1"
                          >
                            削除
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* ゲスト向けログイン訴求（特徴カード下部に控えめ表示） */}
                  {isGuest && (
                    <button
                      onClick={() => router.push('/login?mode=signup')}
                      className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-stone-300 py-3 text-sm text-stone-500 transition-all hover:border-emerald-300 hover:text-emerald-600"
                    >
                      ログインして特徴を保存する
                      <ArrowRight size={14} />
                    </button>
                  )}
                </>
              )}
            </>
          )}

          {/* ===== プロフィールタブ ===== */}
          {activeTab === 'profile' && (
            <div className="space-y-4">
              {/* 基本情報 */}
              <div className="glass-card p-4">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-stone-700">
                  📋 基本情報
                </h3>
                <div className="space-y-1">
                  {publicFields.map((field) => (
                    <ProfileFieldRow
                      key={field.key}
                      field={field}
                      value={getFieldValue(field.key)}
                      isEditing={editingField === field.key}
                      editValue={editValue}
                      isSaving={isSaving}
                      saveSuccess={saveSuccess === field.key}
                      isGuest={isGuest}
                      onStartEdit={() => handleStartEdit(field.key)}
                      onChangeEdit={setEditValue}
                      onSave={() => handleSaveField(field.key)}
                      onCancel={handleCancelEdit}
                    />
                  ))}
                </div>
              </div>

              {/* プライベート情報 */}
              <div className="glass-card p-4">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-stone-700">
                  <Lock size={14} className="text-stone-400" />
                  プライベート情報
                </h3>
                <div className="space-y-1">
                  {privateFields.map((field) => (
                    <ProfileFieldRow
                      key={field.key}
                      field={field}
                      value={getFieldValue(field.key)}
                      isEditing={editingField === field.key}
                      editValue={editValue}
                      isSaving={isSaving}
                      saveSuccess={saveSuccess === field.key}
                      isGuest={isGuest}
                      onStartEdit={() => handleStartEdit(field.key)}
                      onChangeEdit={setEditValue}
                      onSave={() => handleSaveField(field.key)}
                      onCancel={handleCancelEdit}
                    />
                  ))}
                </div>
                <p className="mt-3 text-xs text-stone-400">
                  クラフト機能でのみ使用。外部に公開されません
                </p>
              </div>

              {/* インタビュワー設定 */}
              <div className="glass-card p-4">
                <button
                  onClick={() => setShowInterviewer(!showInterviewer)}
                  className="flex w-full items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">🎙️</span>
                    <div className="text-left">
                      <div className="font-semibold text-stone-800">インタビュワー設定</div>
                      <div className="text-xs text-stone-500">
                        {interviewerName ? `${interviewerName}` : 'AIインタビュワーの名前を変更'}
                      </div>
                    </div>
                  </div>
                  <ChevronRight size={20} className={`text-stone-400 transition-transform ${showInterviewer ? 'rotate-90' : ''}`} />
                </button>

                {showInterviewer && (
                  <form onSubmit={handleSaveInterviewer} className="mt-4 space-y-4 border-t border-stone-100 pt-4">
                    <div className="grid gap-3 grid-cols-2">
                      {INTERVIEWERS.map((interviewer) => (
                        <button
                          key={interviewer.id}
                          type="button"
                          onClick={() => setSelectedInterviewer(interviewer.id)}
                          className={`relative overflow-hidden rounded-2xl transition-all ${
                            selectedInterviewer === interviewer.id
                              ? 'ring-4 ring-emerald-400 shadow-lg' : 'hover:shadow-md'
                          }`}
                        >
                          <div className="relative aspect-[2/3]">
                            <Image
                              src={interviewer.gender === '女性' ? '/image/lady-interviewer2.png' : '/image/man-interviewer2.png'}
                              alt={`${interviewer.gender}のインタビュワー`}
                              fill
                              className="object-cover"
                            />
                          </div>
                        </button>
                      ))}
                    </div>

                    {selectedInterviewer && (
                      <>
                        <div className="flex items-center gap-3">
                          <div className="relative h-12 w-12 overflow-hidden rounded-full ring-2 ring-emerald-200">
                            <Image
                              src={selectedInterviewerData?.gender === '女性' ? '/image/icon_lady-interviewer.png' : '/image/icon_man-interviewer.png'}
                              alt="インタビュワー"
                              fill
                              className="object-cover"
                            />
                          </div>
                          <input
                            type="text"
                            value={interviewerName}
                            onChange={(e) => setInterviewerName(e.target.value)}
                            placeholder="名前を入力"
                            className="flex-1 rounded-xl border border-emerald-200 bg-white/80 px-4 py-2 text-stone-800 focus:border-emerald-400 focus:outline-none"
                            maxLength={20}
                          />
                        </div>
                        <textarea
                          value={customPersonality}
                          onChange={(e) => setCustomPersonality(e.target.value)}
                          placeholder="性格のカスタマイズ（任意）：明るくて元気、など"
                          className="w-full rounded-xl border border-emerald-200 bg-white/80 px-4 py-3 text-sm text-stone-800 focus:border-emerald-400 focus:outline-none"
                          rows={3}
                          maxLength={200}
                        />
                      </>
                    )}
                    {interviewerSuccess && <p className="text-sm text-green-600">保存しました</p>}
                    <button
                      type="submit"
                      disabled={isSubmittingInterviewer || !selectedInterviewer}
                      className="btn-gradient-primary w-full rounded-xl py-3 font-semibold text-white disabled:opacity-50"
                    >
                      {isSubmittingInterviewer ? '保存中...' : '保存する'}
                    </button>
                  </form>
                )}
              </div>

              {/* ヘルプ */}
              <div className="glass-card p-4">
                <div className="space-y-3">
                  <a href="https://www.laiv.jp/terms" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between text-sm text-stone-700 hover:text-emerald-600">
                    <span>利用規約</span>
                    <ChevronRight size={16} className="text-stone-400" />
                  </a>
                  <a href="https://www.laiv.jp/privacy" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between text-sm text-stone-700 hover:text-emerald-600">
                    <span>プライバシーポリシー</span>
                    <ChevronRight size={16} className="text-stone-400" />
                  </a>
                  <a href="https://www.laiv.jp/contact/service" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between text-sm text-stone-700 hover:text-emerald-600">
                    <span>お問い合わせ</span>
                    <ChevronRight size={16} className="text-stone-400" />
                  </a>
                </div>
              </div>

              {error && (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
              )}

              {/* Logout / Guest Reset */}
              {isGuest ? (
                <button
                  onClick={handleGuestReset}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white/80 px-4 py-3 font-semibold text-stone-500 transition-all hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                >
                  <RotateCcw size={18} />
                  新しく作りなおす
                </button>
              ) : (
                <button
                  onClick={handleSignOut}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white/80 px-4 py-3 font-semibold text-stone-500 transition-all hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                >
                  <LogOut size={18} />
                  ログアウト
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="glass-modal w-full max-w-md rounded-3xl p-6">
            <h2 className="mb-4 text-center text-xl font-bold text-stone-800">
              特徴を削除しますか？
            </h2>
            <p className="mb-2 text-center text-sm text-stone-500">
              「{showDeleteConfirm}」を削除します。
            </p>
            <p className="mb-6 text-center text-xs text-stone-500">
              この操作は取り消せません。
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                disabled={deletingTraitLabel !== null}
                className="flex-1 rounded-xl border border-emerald-200 bg-white/80 px-4 py-3 font-semibold text-stone-700 transition-all hover:bg-emerald-50 disabled:opacity-50"
              >
                キャンセル
              </button>
              <button
                onClick={() => handleDeleteTrait(showDeleteConfirm)}
                disabled={deletingTraitLabel !== null}
                className="flex-1 rounded-xl bg-red-500 px-4 py-3 font-semibold text-white shadow-md hover:bg-red-600 disabled:opacity-50"
              >
                {deletingTraitLabel ? '削除中...' : '削除する'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// --- プロフィールフィールド行コンポーネント ---
interface ProfileFieldRowProps {
  field: typeof PROFILE_FIELDS[number];
  value: string;
  isEditing: boolean;
  editValue: string;
  isSaving: boolean;
  saveSuccess: boolean;
  isGuest: boolean;
  onStartEdit: () => void;
  onChangeEdit: (val: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

function ProfileFieldRow({
  field,
  value,
  isEditing,
  editValue,
  isSaving,
  saveSuccess,
  isGuest,
  onStartEdit,
  onChangeEdit,
  onSave,
  onCancel,
}: ProfileFieldRowProps) {
  if (isEditing) {
    return (
      <div className="rounded-xl bg-white/60 p-3">
        <label className="mb-1 block text-xs font-semibold text-stone-500">{field.label}</label>
        {field.inputType === 'select' ? (
          <select
            value={editValue}
            onChange={(e) => onChangeEdit(e.target.value)}
            className="w-full rounded-lg border border-emerald-200 bg-white/80 px-3 py-2 text-sm text-stone-800 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200"
            autoFocus
          >
            <option value="">選択してください</option>
            {field.options?.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        ) : (
          <input
            type={field.inputType === 'number' ? 'number' : 'text'}
            value={editValue}
            onChange={(e) => onChangeEdit(e.target.value)}
            placeholder={field.placeholder}
            className="w-full rounded-lg border border-emerald-200 bg-white/80 px-3 py-2 text-sm text-stone-800 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200"
            maxLength={field.inputType === 'text' ? 20 : undefined}
            autoFocus
          />
        )}
        <div className="mt-2 flex gap-2">
          <button
            onClick={onCancel}
            disabled={isSaving}
            className="flex-1 rounded-lg border border-stone-200 px-3 py-1.5 text-xs font-medium text-stone-600 transition-all hover:bg-stone-50 disabled:opacity-50"
          >
            キャンセル
          </button>
          <button
            onClick={onSave}
            disabled={isSaving}
            className="flex-1 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-medium text-white transition-all hover:bg-emerald-600 disabled:opacity-50"
          >
            {isSaving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={isGuest ? undefined : onStartEdit}
      disabled={isGuest}
      className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-left transition-all hover:bg-white/40 disabled:opacity-60 disabled:cursor-not-allowed"
    >
      <span className="text-sm text-stone-500">{field.label}</span>
      <div className="flex items-center gap-2">
        {saveSuccess ? (
          <span className="text-xs text-green-600">保存しました</span>
        ) : value ? (
          <span className="text-sm font-medium text-stone-800">
            {field.key === 'birthYear' ? `${value}年` : value}
          </span>
        ) : (
          <span className="text-sm text-stone-400">未設定</span>
        )}
        {!isGuest && <span className="text-stone-300">✏️</span>}
      </div>
    </button>
  );
}
