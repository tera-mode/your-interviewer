import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/verifyAuth';
import { adminDb } from '@/lib/firebase/admin';
import { EncounterCategory, ProductSource } from '@/types/encounter';

interface ClickRequest {
  productId: string;
  productSource: ProductSource;
  affiliateUrl: string;
  category: EncounterCategory;
  position: number;
}

export async function POST(request: NextRequest) {
  const authResult = await verifyAuth(request);
  const { productId, productSource, affiliateUrl, category, position } =
    await request.json() as ClickRequest;

  // 非同期でクリックログ記録（レスポンスをブロックしない）
  adminDb.collection('clickLogs').add({
    userId: authResult.uid || 'anonymous',
    productId,
    productSource,
    category,
    position,
    affiliateUrl,
    timestamp: new Date(),
    converted: false,
  }).catch(console.error);

  return NextResponse.json({ redirectUrl: affiliateUrl });
}
