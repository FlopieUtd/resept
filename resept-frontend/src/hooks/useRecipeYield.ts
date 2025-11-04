import { useState, useEffect } from "react";
import { type IngredientLine, type IngredientGroup } from "../types";

interface UseRecipeYieldProps {
  originalYield?: number;
  ingredients: IngredientGroup[];
}

interface ScaledIngredient extends IngredientLine {
  scaledAmount?: number;
  scaledAmountMax?: number;
}

interface ScaledIngredientGroup {
  title?: string;
  ingredients: ScaledIngredient[];
}

export const useRecipeYield = ({
  originalYield,
  ingredients,
}: UseRecipeYieldProps) => {
  const [recipeYield, setRecipeYield] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (originalYield) {
      setRecipeYield(originalYield);
    }
  }, [originalYield]);

  const incrementRecipeYield = () => {
    if (recipeYield !== undefined) {
      setRecipeYield(recipeYield + 1);
    }
  };

  const decrementRecipeYield = () => {
    if (recipeYield !== undefined && recipeYield > 1) {
      setRecipeYield(recipeYield - 1);
    }
  };

  const scaledGroups: ScaledIngredientGroup[] = ingredients.map((group) => {
    const scaledLines: ScaledIngredient[] = group.ingredients.map(
      (ingredient) => {
        if (
          !recipeYield ||
          !originalYield ||
          ingredient.parsed?.amount === undefined
        ) {
          return ingredient as ScaledIngredient;
        }

        const scaleFactor = recipeYield / originalYield;
        const scaledAmount = ingredient.parsed.amount * scaleFactor;
        const scaledAmountMax = ingredient.parsed.amountMax
          ? ingredient.parsed.amountMax * scaleFactor
          : undefined;

        return {
          ...ingredient,
          scaledAmount,
          scaledAmountMax,
        } as ScaledIngredient;
      }
    );
    return { title: group.title, ingredients: scaledLines };
  });

  return {
    recipeYield,
    incrementRecipeYield,
    decrementRecipeYield,
    scaledGroups,
  };
};
