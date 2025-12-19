import { TextNode } from "./extractTextNodes";
import { parseIngredient } from "./parseIngredient";
import type { IngredientGroup, IngredientLine } from "../../types";
import type { InternalIngredientGroup } from "./parseNodes.types";
import { groupNodesByDepthAndType } from "./groupNodesByDepthAndType";
import { calculateProbabilities } from "./calculateProbabilities";
import { extractInstructions } from "./extractInstructions";
import type { InstructionGroup } from "../../types";
import { THRESHOLDS } from "./parseNodes.thresholds";

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

  const meetsIngredientThreshold = (
    probability: number,
    maxProbability: number,
    useLenientThreshold: boolean
  ): boolean => {
    const absolute = probability >= THRESHOLDS.INGREDIENT_ABSOLUTE;
    if (maxProbability <= 0) {
      return absolute;
    }
    if (useLenientThreshold) {
      const relative =
        probability >=
        maxProbability * THRESHOLDS.INGREDIENT_RELATIVE_IN_SEQUENCE;
      return absolute || relative;
    } else {
      const relative =
        probability >= maxProbability * THRESHOLDS.INGREDIENT_RELATIVE;
      return absolute || relative;
    }
  };

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

  const sequenceIndices = new Set(
    allIngredientGroups.map((group) => group.originalIndex)
  );

  const bestGroupIndex = bestIngredientGroup.originalIndex;
  const CLOSE_DISTANCE_THRESHOLD = 10;

  const filteredIngredientGroups = allIngredientGroups.filter((group) => {
    const isInSequence = sequenceIndices.has(group.originalIndex);
    const indexDistance = Math.abs(group.originalIndex - bestGroupIndex);
    const isVeryCloseToBest = indexDistance <= CLOSE_DISTANCE_THRESHOLD;
    const probabilityRatio =
      maxIngredientProbability > 0
        ? group.ingredientProbability / maxIngredientProbability
        : 0;
    const useLenientThreshold =
      isInSequence &&
      ((isVeryCloseToBest && group.ingredientProbability >= 0.25) ||
        (probabilityRatio >= 0.5 && group.ingredientProbability >= 0.3));

    return meetsIngredientThreshold(
      group.ingredientProbability,
      maxIngredientProbability,
      useLenientThreshold
    );
  });

  const titlesByIndex =
    filteredIngredientGroups.length > 1
      ? (() => {
          const ingredientGroupIndices = new Set(
            filteredIngredientGroups.map((group) => group.originalIndex)
          );
          const map = new Map<number, string>();
          const normalizeTitle = (text: string) =>
            text
              .trim()
              .replace(/[:：]$/, "")
              .trim();
          filteredIngredientGroups.forEach((group) => {
            const groupDepth = group.nodes[0]?.depth ?? 0;
            let cursor = group.originalIndex - 1;
            while (cursor >= 0 && !ingredientGroupIndices.has(cursor)) {
              const candidate = allGroups[cursor];
              if (!candidate) {
                break;
              }
              if (candidate.nodes.length === 1) {
                const candidateDepth = candidate.nodes[0]?.depth ?? 0;
                if (candidateDepth > groupDepth) {
                  break;
                }
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

  const ingredientGroups = filteredIngredientGroups.reduce<IngredientGroup[]>(
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
