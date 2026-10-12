import { NextResponse } from 'next/server';
import { recipeRepository } from '@/infrastructure/repositories/recipe.repository';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    recipeRepository.recordCompletion({
      recipeId: id,
      servingsCooked: Number(body.servingsCooked) || 1,
      totalDurationSeconds: body.totalDurationSeconds ? Number(body.totalDurationSeconds) : undefined,
      completedAt: body.completedAt || new Date().toISOString(),
      userAgent: request.headers.get('user-agent') || undefined
    });

    return NextResponse.json(
      { success: true, message: 'Completion telemetry recorded' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Failed to log completion:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
