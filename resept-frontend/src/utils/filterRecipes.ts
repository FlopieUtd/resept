import {
  type InstructionGroup,
  type IngredientGroup,
  type IngredientLine,
} from "../types";

type RecipeListItem = {
  id: string;
  title?: string;
  created_at: string;
  ingredients: IngredientGroup[];
  total_time?: string;
  instructions?: InstructionGroup[];
};

const instructionTexts = (items: InstructionGroup[]): string => {
  return items
    .map((group) => {
      if (!group) return "";
      const titleText = group.title || "";
      const instructionTexts = (group.instructions || [])
        .map((instruction) => instruction?.text || "")
        .join(" ");
      return `${titleText} ${instructionTexts}`;
    })
    .join(" ");
};

export const getMatchPriority = (
  recipe: RecipeListItem,
  query: string
): number => {
  const q = query.trim().toLowerCase();
  if (q === "") return 0;

  const title = (recipe.title || "").toLowerCase();
  const ingredientsText = (recipe.ingredients || [])
    .flatMap((g: IngredientGroup) =>
      (g?.ingredients || []).map((i: IngredientLine) => i.raw || "")
    )
    .join(" ")
    .toLowerCase();
  const instructionsText = instructionTexts(
    recipe.instructions || []
  ).toLowerCase();

  const hasCompleteMatchInTitle = title.includes(q);
  const hasCompleteMatchElsewhere =
    ingredientsText.includes(q) || instructionsText.includes(q);

  if (hasCompleteMatchInTitle) {
    return 3;
  }

  if (hasCompleteMatchElsewhere) {
    return 2;
  }

  if (title.includes(q)) {
    return 1;
  }

  return 0;
};

export const filterRecipes = (
  recipes: RecipeListItem[],
  query: string
): RecipeListItem[] => {
  if (!recipes) return [];
  const q = query.trim().toLowerCase();

  if (q === "") {
    return recipes;
  }

  const words = q.split(/\s+/).filter(Boolean);

  return recipes.filter((recipe) => {
    const title = recipe.title || "";
    const ingredientsText = (recipe.ingredients || [])
      .flatMap((g: IngredientGroup) =>
        (g?.ingredients || []).map((i: IngredientLine) => i.raw || "")
      )
      .join(" ");
    const instructionsText = instructionTexts(recipe.instructions || []);
    const haystack =
      `${title} ${ingredientsText} ${instructionsText}`.toLowerCase();
    return words.every((w) => haystack.includes(w));
  });
};
