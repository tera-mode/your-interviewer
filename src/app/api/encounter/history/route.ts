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
    const limit = Math.min(parseInt(searchParams.get('limit') || '10', 10), 20);

    if (!category || !['books', 'movies', 'goods', 'skills'].includes(category)) {
      return NextResponse.json({ error: '不正なカテゴリです' }, { status: 400 });
    }

    // NOTE: このクエリには Firestore 複合インデックスが必要:
    // コレクション: recommendationHistory  フィールド: category(ASC) + generatedAt(DESC)
    const snapshot = await adminDb
      .collection('users')
      .doc(authResult.uid)
      .collection('recommendationHistory')
      .where('category', '==', category)
      .orderBy('generatedAt', 'desc')
      .limit(limit)
      .get();

    const history = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        category: data.category as EncounterCategory,
        items: data.items as RecommendedItem[],
        personalityContext: data.personalityContext as string,
        traitsUsedCount: data.traitsUsedCount as number,
        generatedAt: (data.generatedAt as Timestamp)?.toDate?.()?.toISOString() ?? '',
      };
    });

    return NextResponse.json({ success: true, history });
  } catch (error) {
    console.error('Error fetching encounter history:', error);
    return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
  }
}
