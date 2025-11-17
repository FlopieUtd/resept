import {
  type RecipeInstructionItem,
  type RecipeInstruction,
  type RecipeInstructionSection,
  type IngredientGroup,
  type IngredientLine,
} from "../types";

type RecipeListItem = {
  id: string;
  title?: string;
  created_at: string;
  ingredients: IngredientGroup[];
  total_time?: string;
  instructions?: RecipeInstructionItem[];
};

const isSection = (
  item: RecipeInstructionItem
): item is RecipeInstructionSection => {
  return (item as RecipeInstructionSection).type === "section";
};

const instructionTexts = (items: RecipeInstructionItem[]): string => {
  return items
    .map((item) => {
      if (!item) return "";
      if (isSection(item)) {
        return [
          item.name || "",
          ...item.steps.map((s: RecipeInstruction) => s?.text || ""),
        ].join(" ");
      }
      return (item as RecipeInstruction).text || "";
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
