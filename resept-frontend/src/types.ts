export interface IngredientLine {
  raw: string;
}

export interface RecipeInstruction {
  text: string;
}

export interface Recipe {
  name: string;
  recipeYield: number;
  recipeCategory: string;
  description: string;
  prepTime: string;
  cookTime: string;
  totalTime: string;
  recipeIngredients: IngredientLine[];
  recipeInstructions: RecipeInstruction[];
  sourceUrl: string;
}
