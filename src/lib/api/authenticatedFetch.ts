import { auth } from '@/lib/firebase/config';

/**
 * Firebase認証トークン付きでAPIを呼び出すヘルパー
 */
export async function authenticatedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const user = auth.currentUser;

  if (!user) {
    throw new Error('Not authenticated');
  }

  // IDトークンを取得
  const token = await user.getIdToken();

  // ヘッダーにトークンを追加
  const headers = new Headers(options.headers);
  headers.set('Authorization', `Bearer ${token}`);
  headers.set('Content-Type', 'application/json');

  return fetch(url, {
    ...options,
    headers,
  });
}

/**
 * 認証トークンを取得（匿名ユーザーも含む）
 */
export async function getAuthToken(): Promise<string | null> {
  const user = auth.currentUser;

  if (!user) {
    return null;
  }

  try {
    return await user.getIdToken();
  } catch (error) {
    console.error('Failed to get auth token:', error);
    return null;
  }
}
