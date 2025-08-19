export interface ParsedIngredient {
  amount?: number;
  rawWithoutAmount: string;
  amountMax?: number;
}

export interface IngredientLine {
  raw: string;
  parsed?: ParsedIngredient;
}

export interface ScaledIngredient extends IngredientLine {
  scaledAmount?: number;
  scaledAmountMax?: number;
}

export interface RecipeInstruction {
  text: string;
}

export interface RecipeInstructionSection {
  type: "section";
  name: string;
  steps: RecipeInstruction[];
}

export type RecipeInstructionItem =
  | RecipeInstruction
  | RecipeInstructionSection;

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
  instructions: RecipeInstructionItem[];
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
  instructions: RecipeInstructionItem[];
  source_url: string;
}
