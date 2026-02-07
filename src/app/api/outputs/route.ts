import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { Output, OutputType, OutputStatus, UserTrait } from '@/types';
import { verifyAuth } from '@/lib/auth/verifyAuth';

// GET - ユーザーのアウトプット一覧を取得
export async function GET(request: NextRequest) {
  try {
    // 認証検証
    const authResult = await verifyAuth(request);
    if (!authResult.authenticated || !authResult.uid) {
      return NextResponse.json(
        { error: authResult.error || 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    // リクエストのuserIdと認証されたuidが一致するか検証
    if (userId !== authResult.uid) {
      return NextResponse.json(
        { error: 'User ID mismatch' },
        { status: 403 }
      );
    }

    const outputsRef = adminDb.collection('outputs');
    let snapshot;
    try {
      snapshot = await outputsRef
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .get();
    } catch (indexError: unknown) {
      // Composite index が未作成の場合、orderBy なしで取得してクライアント側ソート
      console.warn('Firestore composite index not available, falling back to client-side sort:', (indexError as Error).message);
      snapshot = await outputsRef
        .where('userId', '==', userId)
        .get();
    }

    const outputs = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
        sourceData: {
          ...data.sourceData,
          generatedAt: data.sourceData?.generatedAt?.toDate?.()?.toISOString() || data.sourceData?.generatedAt,
        },
      };
    });

    // クライアント側ソート（フォールバック用）
    outputs.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });

    return NextResponse.json({
      success: true,
      outputs,
    });
  } catch (error) {
    console.error('Error fetching outputs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch outputs' },
      { status: 500 }
    );
  }
}

// POST - 新規アウトプットを作成
export async function POST(request: NextRequest) {
  try {
    // 認証検証
    const authResult = await verifyAuth(request);
    if (!authResult.authenticated || !authResult.uid) {
      return NextResponse.json(
        { error: authResult.error || 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { userId, type, content, traits, interviewIds } = body as {
      userId: string;
      type: OutputType;
      content: string;
      traits: UserTrait[];
      interviewIds: string[];
    };

    // リクエストのuserIdと認証されたuidが一致するか検証
    if (userId !== authResult.uid) {
      return NextResponse.json(
        { error: 'User ID mismatch' },
        { status: 403 }
      );
    }

    if (!type || !content) {
      return NextResponse.json(
        { error: 'type and content are required' },
        { status: 400 }
      );
    }

    const now = new Date();

    const outputData: Omit<Output, 'id'> = {
      userId,
      type,
      sourceData: {
        traits: traits || [],
        interviewIds: interviewIds || [],
        generatedAt: now,
      },
      content: {
        body: content,
      },
      isEdited: false,
      status: 'draft',
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await adminDb.collection('outputs').add(outputData);

    return NextResponse.json({
      success: true,
      outputId: docRef.id,
    });
  } catch (error) {
    console.error('Error creating output:', error);
    return NextResponse.json(
      { error: 'Failed to create output' },
      { status: 500 }
    );
  }
}

// PUT - アウトプットを更新
export async function PUT(request: NextRequest) {
  try {
    // 認証検証
    const authResult = await verifyAuth(request);
    if (!authResult.authenticated || !authResult.uid) {
      return NextResponse.json(
        { error: authResult.error || 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { outputId, content, status, title } = body as {
      outputId: string;
      content?: string;
      status?: OutputStatus;
      title?: string;
    };

    if (!outputId) {
      return NextResponse.json(
        { error: 'outputId is required' },
        { status: 400 }
      );
    }

    const outputRef = adminDb.collection('outputs').doc(outputId);
    const outputDoc = await outputRef.get();

    if (!outputDoc.exists) {
      return NextResponse.json(
        { error: 'Output not found' },
        { status: 404 }
      );
    }

    // アウトプットの所有者か検証
    const outputData = outputDoc.data();
    if (outputData?.userId !== authResult.uid) {
      return NextResponse.json(
        { error: 'Forbidden: Not the owner of this output' },
        { status: 403 }
      );
    }

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (content !== undefined) {
      updateData.editedContent = content;
      updateData.isEdited = true;
    }

    if (status !== undefined) {
      updateData.status = status;
    }

    if (title !== undefined) {
      updateData['content.title'] = title;
    }

    await outputRef.update(updateData);

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('Error updating output:', error);
    return NextResponse.json(
      { error: 'Failed to update output' },
      { status: 500 }
    );
  }
}

// DELETE - アウトプットを削除（アーカイブ）
export async function DELETE(request: NextRequest) {
  try {
    // 認証検証
    const authResult = await verifyAuth(request);
    if (!authResult.authenticated || !authResult.uid) {
      return NextResponse.json(
        { error: authResult.error || 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const outputId = searchParams.get('outputId');

    if (!outputId) {
      return NextResponse.json(
        { error: 'outputId is required' },
        { status: 400 }
      );
    }

    const outputRef = adminDb.collection('outputs').doc(outputId);
    const outputDoc = await outputRef.get();

    if (!outputDoc.exists) {
      return NextResponse.json(
        { error: 'Output not found' },
        { status: 404 }
      );
    }

    // アウトプットの所有者か検証
    const outputData = outputDoc.data();
    if (outputData?.userId !== authResult.uid) {
      return NextResponse.json(
        { error: 'Forbidden: Not the owner of this output' },
        { status: 403 }
      );
    }

    await outputRef.update({
      status: 'archived',
      updatedAt: new Date(),
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('Error deleting output:', error);
    return NextResponse.json(
      { error: 'Failed to delete output' },
      { status: 500 }
    );
  }
}
