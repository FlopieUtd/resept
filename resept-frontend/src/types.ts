export interface IngredientLine {
  raw: string;
}

export interface RecipeInstruction {
  text: string;
}

export interface DatabaseRecipe {
  id: string;
  user_id: string;
  title: string;
  recipe_yield: number;
  recipe_category: string;
  description: string;
  prep_time: string;
  cook_time: string;
  total_time: string;
  ingredients: IngredientLine[];
  instructions: RecipeInstruction[];
  source_url: string;
  created_at: string;
  updated_at: string;
}

export interface CreateRecipeData {
  title: string;
  recipe_yield: number;
  recipe_category: string;
  description: string;
  prep_time: string;
  cook_time: string;
  total_time: string;
  ingredients: IngredientLine[];
  instructions: RecipeInstruction[];
  source_url: string;
}
