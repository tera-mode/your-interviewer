/**
 * グローバル商品検索キャッシュ
 * 楽天・TMDbへのAPIアクセスを最小化するため、キーワード×カテゴリ単位でFirestoreにキャッシュ。
 * ユーザーをまたいで共有される（24時間TTL）。
 */

import { adminDb } from '@/lib/firebase/admin';
import { RecommendedItem } from '@/types/encounter';

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24時間

/** ユーザー固有フィールドを除いた商品データ */
export interface CachedProduct {
  id: string;
  source: string;
  name: string;
  price: number | null;
  imageUrl: string;
  affiliateUrl: string;
  originalUrl: string;
  rating: number | null;
}

function makeCacheKey(keyword: string, category: string): string {
  // キーは lowercase・スペース→アンダースコア・80文字以内で正規化
  const normalized = keyword.toLowerCase().trim().replace(/[\s　]+/g, '_').slice(0, 80);
  return `${category}_${normalized}`;
}

/**
 * グローバルキャッシュから商品を取得。
 * キャッシュミスまたは期限切れの場合は null を返す。
 */
export async function getCachedProductSearch(
  keyword: string,
  category: string,
): Promise<CachedProduct[] | null> {
  try {
    const key = makeCacheKey(keyword, category);
    const doc = await adminDb.collection('productSearchCache').doc(key).get();
    if (!doc.exists) return null;

    const data = doc.data()!;
    const expiresAt = data.expiresAt?.toDate?.() as Date | undefined;
    if (!expiresAt || expiresAt < new Date()) return null;

    const products = data.products as CachedProduct[];

    // 画像URLが1件も入っていない古いキャッシュは破棄してAPIを叩き直す
    const hasAnyImage = products.some(p => !!p.imageUrl);
    if (!hasAnyImage) {
      console.warn('[productCache] 画像なしキャッシュを破棄:', key);
      return null;
    }

    return products;
  } catch {
    // キャッシュ失敗はサイレントに無視してAPIコールにフォールバック
    return null;
  }
}

/**
 * 商品検索結果をグローバルキャッシュに保存。
 * ユーザー固有のフィールド（reason, matchedTraits, score）は保存しない。
 */
export async function cacheProductSearch(
  keyword: string,
  category: string,
  items: RecommendedItem[],
): Promise<void> {
  // 画像が1件も取得できていない場合はキャッシュしない（API障害時の空データ汚染を防ぐ）
  const hasAnyImage = items.some(i => !!i.imageUrl);
  if (items.length === 0 || !hasAnyImage) {
    console.warn('[productCache] 画像なしのためキャッシュをスキップ');
    return;
  }
  try {
    const key = makeCacheKey(keyword, category);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + CACHE_TTL_MS);

    const products: CachedProduct[] = items.map(item => ({
      id: item.id,
      source: item.source,
      name: item.name,
      price: item.price,
      imageUrl: item.imageUrl,
      affiliateUrl: item.affiliateUrl,
      originalUrl: item.originalUrl,
      rating: item.rating,
    }));

    await adminDb.collection('productSearchCache').doc(key).set({
      keyword,
      category,
      products,
      cachedAt: now,
      expiresAt,
    });
  } catch (e) {
    console.error('productCache: Failed to save cache:', e);
  }
}
