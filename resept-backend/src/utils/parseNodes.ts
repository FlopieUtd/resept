import { TextNode } from "./extractTextNodes";
import { parseIngredient } from "./parseIngredient";
import type { IngredientGroup, IngredientLine } from "../../types";
import type { InternalIngredientGroup } from "./parseNodes.types";
import { groupNodesByDepthAndType } from "./groupNodesByDepthAndType";
import { calculateProbabilities } from "./calculateProbabilities";
import { extractInstructions } from "./extractInstructions";
import type { InstructionGroup } from "../../types";

interface ParsedResult {
  ingredients: IngredientGroup[];
  instructions: InstructionGroup[];
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
  const instructions = extractInstructions(allGroups);

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

  const bestIngredientGroup = filteredResult.reduce((max, group) =>
    group.ingredientProbability > max.ingredientProbability ? group : max
  );

  console.log(JSON.stringify(bestIngredientGroup, null, 2));

  const allIngredientGroups = (() => {
    const matchingGroups = allGroups.filter((group) => {
      if (group.nodes.length === 0) {
        return false;
      }
      const { depth, elementType } = bestIngredientGroup.nodes[0];
      return group.nodes.every(
        (node) => node.depth === depth && node.elementType === elementType
      );
    });
    if (matchingGroups.length <= 1) {
      return matchingGroups;
    }
    const targetIndex = bestIngredientGroup.originalIndex;
    const indexToGroup = new Map(
      matchingGroups.map((group) => [group.originalIndex, group])
    );
    const targetGroup = indexToGroup.get(targetIndex);
    if (!targetGroup) {
      return matchingGroups;
    }
    const sortedIndices = [...indexToGroup.keys()].sort((a, b) => a - b);
    const differences = Array.from(
      new Set(
        sortedIndices
          .filter((index) => index !== targetIndex)
          .map((index) => Math.abs(index - targetIndex))
      )
    ).sort((a, b) => a - b);
    if (differences.length === 0) {
      return [targetGroup];
    }
    let bestSequence: InternalIngredientGroup[] = [targetGroup];
    let bestDifference = Number.POSITIVE_INFINITY;
    differences.forEach((difference) => {
      if (difference === 0) {
        return;
      }
      let startIndex = targetIndex;
      while (indexToGroup.has(startIndex - difference)) {
        startIndex -= difference;
      }
      const sequence: InternalIngredientGroup[] = [];
      let cursor = startIndex;
      while (indexToGroup.has(cursor)) {
        sequence.push(indexToGroup.get(cursor)!);
        cursor += difference;
      }
      if (
        sequence.length > bestSequence.length ||
        (sequence.length === bestSequence.length && difference < bestDifference)
      ) {
        bestSequence = sequence;
        bestDifference = difference;
      }
    });
    return bestSequence;
  })();

  const titlesByIndex =
    allIngredientGroups.length > 1
      ? (() => {
          const ingredientGroupIndices = new Set(
            allIngredientGroups.map((group) => group.originalIndex)
          );
          const map = new Map<number, string>();
          const normalizeTitle = (text: string) =>
            text
              .trim()
              .replace(/[:：]$/, "")
              .trim();
          allIngredientGroups.forEach((group) => {
            let cursor = group.originalIndex - 1;
            while (cursor >= 0 && !ingredientGroupIndices.has(cursor)) {
              const candidate = allGroups[cursor];
              if (!candidate) {
                break;
              }
              if (candidate.nodes.length === 1) {
                const candidateText = normalizeTitle(candidate.nodes[0].text);
                if (candidateText.length > 0) {
                  map.set(group.originalIndex, candidateText);
                }
                break;
              }
              break;
            }
          });
          return map;
        })()
      : new Map<number, string>();

  const ingredientGroups = allIngredientGroups.reduce<IngredientGroup[]>(
    (acc, group) => {
      const ingredients: IngredientLine[] = group.nodes
        .map((node) => {
          const raw = node.text;
          const parsed = parseIngredient(raw);
          return { raw, parsed };
        })
        .filter((line) => line.raw.trim().length > 0);
      const title = titlesByIndex.get(group.originalIndex);
      if (ingredients.length > 0) {
        acc.push(title ? { title, ingredients } : { ingredients });
      }
      return acc;
    },
    []
  );

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
