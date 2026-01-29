import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { verifyAuth } from '@/lib/auth/verifyAuth';
import { UserTrait, TraitsSummary, TraitCategory } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request);

    if (!authResult.authenticated || !authResult.uid) {
      return NextResponse.json(
        { success: false, error: authResult.error || 'Unauthorized' },
        { status: 401 }
      );
    }

    const { traitId, traitLabel } = await request.json();

    if (!traitId && !traitLabel) {
      return NextResponse.json(
        { success: false, error: 'Trait ID or label is required' },
        { status: 400 }
      );
    }

    // ユーザーのインタビューを取得
    const interviewsRef = adminDb
      .collection('interviews')
      .where('userId', '==', authResult.uid);
    const interviewsSnapshot = await interviewsRef.get();

    if (interviewsSnapshot.empty) {
      return NextResponse.json(
        { success: false, error: 'No interviews found' },
        { status: 404 }
      );
    }

    // 各インタビューから該当の特徴を削除
    const batch = adminDb.batch();
    let deletedCount = 0;

    for (const doc of interviewsSnapshot.docs) {
      const interview = doc.data();
      const traits: UserTrait[] = interview.traits || [];

      const filteredTraits = traits.filter((trait) => {
        if (traitId && trait.id === traitId) return false;
        if (traitLabel && trait.label === traitLabel) return false;
        return true;
      });

      if (filteredTraits.length < traits.length) {
        deletedCount += traits.length - filteredTraits.length;

        // サマリーを再生成
        const summary = generateTraitsSummary(filteredTraits);

        batch.update(doc.ref, {
          traits: filteredTraits,
          traitsSummary: summary,
          updatedAt: new Date(),
        });
      }
    }

    await batch.commit();

    return NextResponse.json({
      success: true,
      deletedCount,
    });
  } catch (error) {
    console.error('Error deleting trait:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete trait' },
      { status: 500 }
    );
  }
}

function generateTraitsSummary(traits: UserTrait[]): TraitsSummary {
  const categoryBreakdown: Partial<Record<TraitCategory, number>> = {};

  traits.forEach((trait) => {
    categoryBreakdown[trait.category] =
      (categoryBreakdown[trait.category] || 0) + 1;
  });

  const sortedTraits = [...traits].sort((a, b) => b.confidence - a.confidence);
  const topTraits = sortedTraits.slice(0, 3).map((t) => t.label);

  return {
    totalCount: traits.length,
    categoryBreakdown,
    topTraits,
  };
}
