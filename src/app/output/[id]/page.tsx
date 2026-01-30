'use client';

import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import UserHeader from '@/components/UserHeader';
import { getOutputType } from '@/lib/outputTypes';
import { Output } from '@/types';
import { authenticatedFetch } from '@/lib/api/authenticatedFetch';

export default function OutputDetailPage() {
  const router = useRouter();
  const params = useParams();
  const outputId = params.id as string;
  const { user, loading } = useAuth();

  const [output, setOutput] = useState<Output | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
      return;
    }

    if (user && outputId) {
      fetchOutput();
    }
  }, [user, loading, outputId, router]);

  const fetchOutput = async () => {
    try {
      const response = await authenticatedFetch(`/api/outputs?userId=${user?.uid}`);
      if (!response.ok) throw new Error('Failed to fetch outputs');

      const data = await response.json();
      const foundOutput = data.outputs?.find((o: Output) => o.id === outputId);

      if (foundOutput) {
        setOutput(foundOutput);
        setEditedContent(foundOutput.editedContent || foundOutput.content.body);
      } else {
        setError('アウトプットが見つかりません');
      }
    } catch (err) {
      console.error('Error fetching output:', err);
      setError('読み込みに失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!output) return;

    setIsSaving(true);
    setError('');

    try {
      const response = await authenticatedFetch('/api/outputs', {
        method: 'PUT',
        body: JSON.stringify({
          outputId: output.id,
          content: editedContent,
        }),
      });

      if (!response.ok) throw new Error('Failed to save');

      setOutput({
        ...output,
        editedContent,
        isEdited: true,
      });
      setIsEditing(false);
    } catch (err) {
      console.error('Error saving:', err);
      setError('保存に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopy = async () => {
    const textToCopy = output?.editedContent || output?.content.body || '';
    await navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = async () => {
    if (!output || !confirm('このアウトプットを削除しますか？')) return;

    try {
      const response = await authenticatedFetch(`/api/outputs?outputId=${output.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete');

      router.push('/output/history');
    } catch (err) {
      console.error('Error deleting:', err);
      setError('削除に失敗しました');
    }
  };

  if (loading || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-warm">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 spinner-warm"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error && !output) {
    return (
      <div className="flex min-h-screen flex-col bg-gradient-warm">
        <UserHeader />
        <div className="flex flex-1 items-center justify-center px-4">
          <div className="glass-card max-w-md rounded-2xl p-8 text-center">
            <p className="mb-4 text-red-600">{error}</p>
            <button
              onClick={() => router.push('/output/history')}
              className="text-orange-600 underline"
            >
              履歴に戻る
            </button>
          </div>
        </div>
      </div>
    );
  }

  const outputConfig = output ? getOutputType(output.type) : null;
  const displayContent = output?.editedContent || output?.content.body || '';

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-gradient-warm">
      <div className="gradient-orb gradient-orb-orange absolute -right-40 top-20 h-96 w-96" />
      <div className="gradient-orb gradient-orb-yellow absolute -left-40 bottom-20 h-80 w-80" />

      <UserHeader />

      <div className="relative z-10 flex flex-1 flex-col px-4 py-8">
        <main className="mx-auto w-full max-w-2xl">
          {/* ヘッダー */}
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{outputConfig?.icon}</span>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {outputConfig?.name}
                </h1>
                <p className="text-sm text-gray-500">
                  {output?.createdAt
                    ? new Date(output.createdAt).toLocaleDateString('ja-JP')
                    : ''}
                </p>
              </div>
            </div>
            {output?.isEdited && (
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs text-amber-700">
                編集済み
              </span>
            )}
          </div>

          {/* コンテンツカード */}
          <div className="glass-card mb-6 rounded-2xl p-6">
            {isEditing ? (
              <>
                <textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  className="w-full min-h-[200px] rounded-xl border border-orange-200 bg-white/80 p-4 text-gray-800 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-200"
                />
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-sm text-gray-500">
                    {editedContent.length}文字
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditedContent(displayContent);
                        setIsEditing(false);
                      }}
                      className="rounded-full border border-orange-200 bg-white/80 px-4 py-2 text-sm font-semibold text-gray-700"
                    >
                      キャンセル
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="btn-gradient-primary rounded-full px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                    >
                      {isSaving ? '保存中...' : '保存'}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <p className="whitespace-pre-wrap text-gray-800">
                  {displayContent}
                </p>
                <div className="mt-4 flex items-center justify-between border-t border-orange-100 pt-4">
                  <span className="text-sm text-gray-500">
                    {displayContent.length}文字
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={handleCopy}
                      className="rounded-full border border-orange-200 bg-white/80 px-4 py-2 text-sm font-semibold text-gray-700 transition-all hover:bg-orange-50"
                    >
                      {copied ? 'コピーしました！' : 'コピー'}
                    </button>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="rounded-full border border-orange-200 bg-white/80 px-4 py-2 text-sm font-semibold text-gray-700 transition-all hover:bg-orange-50"
                    >
                      編集
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* エラー表示 */}
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* アクションボタン */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push('/output/history')}
              className="text-gray-500 underline decoration-orange-300 underline-offset-4 hover:text-orange-600"
            >
              履歴に戻る
            </button>
            <button
              onClick={handleDelete}
              className="text-sm text-red-500 hover:text-red-700"
            >
              削除する
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
