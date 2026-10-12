import { NextResponse } from 'next/server';
import { recipeRepository } from '@/infrastructure/repositories/recipe.repository';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const recipe = recipeRepository.getRecipeById(id);

    if (!recipe) {
      return NextResponse.json(
        { success: false, error: 'Recipe not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: recipe
    });
  } catch (error) {
    console.error('Failed to fetch recipe by id:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
