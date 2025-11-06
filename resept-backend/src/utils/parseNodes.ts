import { TextNode } from "./extractTextNodes";
import { parseIngredient, type ParsedIngredient } from "./parseIngredient";
import type { IngredientGroup, IngredientLine } from "../../types";
import { groupNodesByDepthAndType } from "./groupNodesByDepthAndType";
import { calculateProbabilities } from "./calculateProbabilities";
import { extractInstructions } from "./extractInstructions";
import { extractIngredientCandidates } from "./extractIngredientCandidates";
import { clusterIngredientGroups } from "./clusterIngredientGroups";

interface ParsedResult {
  ingredients: IngredientGroup[];
  instructions: { text: string }[];
  maxIngredientProbability: number;
  maxInstructionsProbability: number;
}

export const parseNodes = (textNodes: TextNode[]): ParsedResult => {
  if (textNodes.length === 0) {
    return {
      ingredients: [],
      instructions: [],
      maxIngredientProbability: 0,
      maxInstructionsProbability: 0,
    };
  }

  const allGroups = groupNodesByDepthAndType(textNodes);
  const { maxInstructionsProbability, filteredResult } =
    calculateProbabilities(allGroups);
  const instructions = extractInstructions(
    allGroups,
    filteredResult,
    maxInstructionsProbability
  );

  const maxIngredientProbability =
    filteredResult.length > 0
      ? Math.max(...filteredResult.map((g) => g.ingredientProbability))
      : 0;

  if (filteredResult.length === 0) {
    return {
      ingredients: [],
      instructions,
      maxIngredientProbability: 0,
      maxInstructionsProbability,
    };
  }

  const ingredientCandidateGroups = extractIngredientCandidates(
    filteredResult,
    allGroups,
    maxIngredientProbability
  );

  const ingredientGroups = clusterIngredientGroups(ingredientCandidateGroups);

  if (ingredientGroups.length === 0) {
    const maxIngredientGroup = filteredResult.reduce((max, group) =>
      group.ingredientProbability > max.ingredientProbability ? group : max
    );
    const flatIngredients: IngredientLine[] = maxIngredientGroup.nodes.map(
      (node) => {
        const raw = node.text;
        const parsed = parseIngredient(raw);
        return { raw, parsed };
      }
    );

    return {
      ingredients: [{ ingredients: flatIngredients }],
      instructions,
      maxIngredientProbability,
      maxInstructionsProbability,
    };
  }

  return {
    ingredients: ingredientGroups,
    instructions,
    maxIngredientProbability,
    maxInstructionsProbability: maxInstructionsProbability,
  };
};
