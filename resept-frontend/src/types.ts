export interface ParsedIngredient {
  amount?: number;
  rawWithoutAmount: string;
  amountMax?: number;
}

export interface IngredientLine {
  raw: string;
  parsed?: ParsedIngredient;
}

export interface IngredientGroup {
  title?: string;
  ingredients: IngredientLine[];
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

export interface CreateRecipeData {
  title: string;
  recipe_yield: number;
  recipe_category: string;
  description: string;
  prep_time: string;
  cook_time: string;
  total_time: string;
  ingredients: IngredientGroup[];
  instructions: RecipeInstructionItem[];
  source_url: string;
}

export enum Language {
  NL = "nl",
  EN = "en",
  UNKNOWN = "unknown",
}
