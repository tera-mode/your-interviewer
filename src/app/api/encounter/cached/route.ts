import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/verifyAuth';
import { adminDb } from '@/lib/firebase/admin';
import { EncounterCategory, RecommendedItem } from '@/types/encounter';
import { Timestamp } from 'firebase-admin/firestore';

export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.authenticated || !authResult.uid) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') as EncounterCategory | null;

    if (!category || !['books', 'movies', 'goods', 'skills'].includes(category)) {
      return NextResponse.json({ error: '不正なカテゴリです' }, { status: 400 });
    }

    const doc = await adminDb
      .collection('users')
      .doc(authResult.uid)
      .collection('recommendations')
      .doc(category)
      .get();

    if (!doc.exists) {
      return NextResponse.json({ success: true, cached: null });
    }

    const data = doc.data()!;
    const expiresAt = (data.expiresAt as Timestamp)?.toDate?.();
    const isExpired = !expiresAt || expiresAt < new Date();

    return NextResponse.json({
      success: true,
      cached: isExpired ? null : {
        recommendations: data.items as RecommendedItem[],
        personalityContext: data.personalityContext as string,
        traitsUsedCount: data.traitsUsedCount as number,
        generatedAt: (data.generatedAt as Timestamp)?.toDate?.()?.toISOString() || '',
      },
      isExpired,
    });
  } catch (error) {
    console.error('Error in encounter/cached:', error);
    return NextResponse.json({ error: 'Failed to fetch cache' }, { status: 500 });
  }
}
