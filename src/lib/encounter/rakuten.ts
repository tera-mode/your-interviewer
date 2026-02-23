/**
 * 楽天ウェブサービス 商品検索
 *
 * 認証キーの有無で自動的にAPIエンドポイントを切り替える:
 *   RAKUTEN_ACCESS_KEY あり → 新API (openapi.rakuten.co.jp) ※2026年5月以降必須
 *   RAKUTEN_ACCESS_KEY なし → 旧API (app.rakuten.co.jp) ※2026年5月まで利用可能
 */

import { RakutenItem } from '@/types/encounter';
import { rateLimiter } from './rateLimiter';

const APP_REFERER = 'https://mecraft.life/';

const APPLICATION_ID = process.env.RAKUTEN_APPLICATION_ID ?? '';
const ACCESS_KEY = process.env.RAKUTEN_ACCESS_KEY ?? '';
const AFFILIATE_ID = process.env.RAKUTEN_AFFILIATE_ID ?? '';

interface RakutenSearchParams {
  keyword: string;
  genreId?: string;
  page?: number;
  hits?: number;
  sort?: string;
  minPrice?: number;
  maxPrice?: number;
}

/** アイテムレスポンスから画像URLを安全に取得
 *  旧API: mediumImageUrls = [{ imageUrl: "https://..." }]  (オブジェクト配列)
 *  新API: mediumImageUrls = ["https://..."]               (文字列配列)
 *  両方に対応する。
 */
function extractImageUrl(item: Record<string, unknown>): string {
  const pickFirst = (arr: unknown): string => {
    if (!Array.isArray(arr) || arr.length === 0) return '';
    const first = arr[0];
    if (typeof first === 'string') return first;
    if (first && typeof first === 'object') {
      const url = (first as Record<string, unknown>).imageUrl;
      if (typeof url === 'string') return url;
    }
    return '';
  };

  return pickFirst(item.mediumImageUrls) || pickFirst(item.smallImageUrls);
}

export async function searchRakutenItems(params: RakutenSearchParams): Promise<RakutenItem[]> {
  if (!APPLICATION_ID) {
    console.warn('[Rakuten] RAKUTEN_APPLICATION_ID が未設定です');
    return [];
  }

  // ACCESS_KEY の有無で API エンドポイントを切り替え
  const useNewApi = ACCESS_KEY.length > 0;

  const apiUrl = useNewApi
    ? 'https://openapi.rakuten.co.jp/ichibams/api/IchibaItem/Search/20220601'
    : 'https://app.rakuten.co.jp/services/api/IchibaItem/Search/20170706';

  const url = new URL(apiUrl);
  url.searchParams.set('applicationId', APPLICATION_ID);
  if (useNewApi) url.searchParams.set('accessKey', ACCESS_KEY);
  if (AFFILIATE_ID) url.searchParams.set('affiliateId', AFFILIATE_ID);
  url.searchParams.set('keyword', params.keyword);
  url.searchParams.set('hits', String(params.hits ?? 10));
  url.searchParams.set('sort', params.sort ?? '-reviewAverage');
  url.searchParams.set('formatVersion', '2');

  if (params.genreId) {
    const n = parseInt(params.genreId, 10);
    if (!isNaN(n) && n > 0 && n <= 999999) {
      url.searchParams.set('genreId', String(n));
    }
  }
  if (params.minPrice) url.searchParams.set('minPrice', String(params.minPrice));
  if (params.maxPrice) url.searchParams.set('maxPrice', String(params.maxPrice));

  await rateLimiter.wait('rakuten');

  // 新APIは Origin/Referer ヘッダーが必要
  const headers: HeadersInit = useNewApi
    ? { 'Referer': APP_REFERER, 'Origin': 'https://mecraft.life' }
    : {};

  const fetchWithRetry = async () => {
    console.log(`[Rakuten] ${useNewApi ? '新API' : '旧API'} 検索: "${params.keyword}"`);
    const res = await fetch(url.toString(), { headers });
    if (res.status === 429) {
      console.warn('[Rakuten] 429 Rate limit, 3秒後にリトライ...');
      await new Promise(r => setTimeout(r, 3000));
      return fetch(url.toString(), { headers });
    }
    return res;
  };

  try {
    const response = await fetchWithRetry();

    if (!response.ok) {
      const errText = await response.text().catch(() => '(no body)');
      console.error(`[Rakuten] HTTPエラー ${response.status}: ${errText.slice(0, 300)}`);
      return [];
    }

    const data = await response.json() as Record<string, unknown>;

    if (!Array.isArray(data.Items)) {
      console.warn('[Rakuten] Items が配列ではありません:', JSON.stringify(data).slice(0, 300));
      return [];
    }

    const items = data.Items as Record<string, unknown>[];
    console.log(`[Rakuten] "${params.keyword}" → ${items.length}件取得`);

    return items.map(item => {
      const imageUrl = extractImageUrl(item);
      if (!imageUrl) {
        console.warn(`[Rakuten] 画像なし: "${String(item.itemName ?? '').slice(0, 30)}"`);
      }
      return {
        itemName: String(item.itemName ?? ''),
        itemPrice: Number(item.itemPrice ?? 0),
        itemUrl: String(item.itemUrl ?? ''),
        affiliateUrl: String(item.affiliateUrl ?? item.itemUrl ?? ''),
        imageUrl,
        shopName: String(item.shopName ?? ''),
        reviewAverage: Number(item.reviewAverage ?? 0),
        reviewCount: Number(item.reviewCount ?? 0),
        itemCaption: String(item.itemCaption ?? ''),
        genreId: String(item.genreId ?? ''),
      };
    });
  } catch (error) {
    console.error('[Rakuten] 予外エラー:', error);
    return [];
  }
}
