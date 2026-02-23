/**
 * キャッシュ確認・クリア用デバッグエンドポイント
 * GET  /api/encounter/debug-cache           → 全カテゴリのキャッシュ状態
 * POST /api/encounter/debug-cache?clear=all → 全カテゴリのキャッシュをクリア
 * POST /api/encounter/debug-cache?clear=books → 特定カテゴリのキャッシュをクリア
 *
 * ⚠️ 開発・デバッグ専用
 */
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/verifyAuth';
import { adminDb } from '@/lib/firebase/admin';
import { EncounterCategory, RecommendedItem } from '@/types/encounter';

const CATEGORIES: EncounterCategory[] = ['books', 'movies', 'goods', 'skills'];

async function getCacheStatus(uid: string) {
  const results = await Promise.all(
    CATEGORIES.map(async (cat) => {
      const doc = await adminDb
        .collection('users').doc(uid)
        .collection('recommendations').doc(cat)
        .get();

      if (!doc.exists) return { category: cat, exists: false };

      const data = doc.data()!;
      const items = (data.items as RecommendedItem[]) ?? [];
      const withImage = items.filter(i => !!i.imageUrl);
      const generatedAt = data.generatedAt?.toDate?.()?.toISOString() ?? null;

      return {
        category: cat,
        exists: true,
        itemCount: items.length,
        withImageCount: withImage.length,
        hasAllImages: withImage.length === items.length && items.length > 0,
        generatedAt,
        sampleImages: withImage.slice(0, 3).map(i => ({ name: i.name.slice(0, 30), imageUrl: i.imageUrl })),
      };
    }),
  );
  return results;
}

export async function GET(request: NextRequest) {
  const authResult = await verifyAuth(request);
  if (!authResult.authenticated || !authResult.uid) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }

  const cacheStatus = await getCacheStatus(authResult.uid);
  return NextResponse.json({ uid: authResult.uid, cacheStatus });
}

export async function POST(request: NextRequest) {
  const authResult = await verifyAuth(request);
  if (!authResult.authenticated || !authResult.uid) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const clearTarget = searchParams.get('clear');

  const targets = clearTarget === 'all' ? CATEGORIES : [clearTarget as EncounterCategory];
  const validTargets = targets.filter(c => CATEGORIES.includes(c));

  if (validTargets.length === 0) {
    return NextResponse.json({ error: '不正なパラメータ' }, { status: 400 });
  }

  await Promise.all(
    validTargets.map(cat =>
      adminDb
        .collection('users').doc(authResult.uid!)
        .collection('recommendations').doc(cat)
        .delete(),
    ),
  );

  return NextResponse.json({ cleared: validTargets, message: 'キャッシュをクリアしました' });
}
