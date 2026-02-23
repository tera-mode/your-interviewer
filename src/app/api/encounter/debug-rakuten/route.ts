/**
 * 楽天API動作確認用デバッグエンドポイント
 * GET /api/encounter/debug-rakuten?keyword=プログラミング
 *
 * ⚠️ 開発・デバッグ専用。本番では不要になったら削除すること。
 */
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/verifyAuth';

const APPLICATION_ID = process.env.RAKUTEN_APPLICATION_ID ?? '';
const ACCESS_KEY = process.env.RAKUTEN_ACCESS_KEY ?? '';
const AFFILIATE_ID = process.env.RAKUTEN_AFFILIATE_ID ?? '';

export async function GET(request: NextRequest) {
  const authResult = await verifyAuth(request);
  if (!authResult.authenticated) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const keyword = searchParams.get('keyword') ?? 'プログラミング';

  const useNewApi = ACCESS_KEY.length > 0;

  const envStatus = {
    RAKUTEN_APPLICATION_ID: APPLICATION_ID ? `✅ set (${APPLICATION_ID.slice(0, 4)}...)` : '❌ missing',
    RAKUTEN_ACCESS_KEY: ACCESS_KEY ? `✅ set (${ACCESS_KEY.slice(0, 4)}...)` : '❌ missing',
    RAKUTEN_AFFILIATE_ID: AFFILIATE_ID ? `✅ set` : '⚠️ missing (optional)',
    usingApi: useNewApi ? '新API (openapi.rakuten.co.jp)' : '旧API (app.rakuten.co.jp)',
  };

  if (!APPLICATION_ID) {
    return NextResponse.json({ envStatus, error: 'RAKUTEN_APPLICATION_ID が未設定' });
  }

  const apiUrl = useNewApi
    ? 'https://openapi.rakuten.co.jp/ichibams/api/IchibaItem/Search/20220601'
    : 'https://app.rakuten.co.jp/services/api/IchibaItem/Search/20170706';

  const url = new URL(apiUrl);
  url.searchParams.set('applicationId', APPLICATION_ID);
  if (useNewApi) url.searchParams.set('accessKey', ACCESS_KEY);
  if (AFFILIATE_ID) url.searchParams.set('affiliateId', AFFILIATE_ID);
  url.searchParams.set('keyword', keyword);
  url.searchParams.set('hits', '3');
  url.searchParams.set('formatVersion', '2');

  try {
    const headers: HeadersInit = useNewApi
      ? { 'Referer': 'https://mecraft.life/', 'Origin': 'https://mecraft.life' }
      : {};

    const res = await fetch(url.toString(), { headers });
    const statusCode = res.status;
    const rawText = await res.text();

    let parsed: unknown = null;
    try { parsed = JSON.parse(rawText); } catch { /* non-JSON */ }

    // 最初の1件からimageUrl構造を抽出
    let imageAnalysis = null;
    if (parsed && typeof parsed === 'object' && Array.isArray((parsed as Record<string, unknown>).Items)) {
      const items = (parsed as Record<string, unknown>).Items as Record<string, unknown>[];
      if (items.length > 0) {
        const first = items[0];
        imageAnalysis = {
          itemName: String(first.itemName ?? '').slice(0, 50),
          mediumImageUrls: first.mediumImageUrls,
          smallImageUrls: first.smallImageUrls,
          imageUrl: first.imageUrl,
          // 全フィールド一覧
          fields: Object.keys(first),
        };
      }
    }

    return NextResponse.json({
      envStatus,
      request: { keyword, apiUrl: apiUrl.replace(ACCESS_KEY, '***').replace(APPLICATION_ID, '***') },
      response: {
        statusCode,
        ok: res.ok,
        itemCount: Array.isArray((parsed as Record<string, unknown>)?.Items)
          ? ((parsed as Record<string, unknown>).Items as unknown[]).length
          : 0,
        imageAnalysis,
        rawPreview: rawText.slice(0, 1000),
      },
    });
  } catch (e) {
    return NextResponse.json({
      envStatus,
      error: String(e),
    }, { status: 500 });
  }
}
