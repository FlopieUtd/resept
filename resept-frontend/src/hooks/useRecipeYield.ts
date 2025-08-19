import { useState, useEffect } from "react";
import { type IngredientLine } from "../types";

interface UseRecipeYieldProps {
  originalYield?: number;
  ingredients: IngredientLine[];
}

interface ScaledIngredient extends IngredientLine {
  scaledAmount?: number;
  scaledAmountMax?: number;
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

  const scaledIngredients: ScaledIngredient[] = ingredients.map(
    (ingredient) => {
      if (
        !recipeYield ||
        !originalYield ||
        ingredient.parsed?.amount === undefined
      ) {
        return ingredient;
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
      };
    }
  );

  return {
    recipeYield,
    incrementRecipeYield,
    decrementRecipeYield,
    scaledIngredients,
  };
};
