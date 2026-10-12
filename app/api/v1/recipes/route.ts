import { NextResponse } from 'next/server';
import { recipeRepository } from '@/infrastructure/repositories/recipe.repository';

export async function GET() {
  try {
    const recipes = recipeRepository.getRecipes();
    return NextResponse.json({
      success: true,
      data: recipes
    });
  } catch (error) {
    console.error('Failed to fetch recipes:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
