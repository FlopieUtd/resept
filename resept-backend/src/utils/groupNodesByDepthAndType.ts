import type { TextNode } from "./extractTextNodes";
import { THRESHOLDS } from "./parseNodes.thresholds";
import { containsUnitKeyword } from "./parseNodes.lexicon";
import type { InternalIngredientGroup } from "./parseNodes.types";

const computeIngredientProbability = (nodes: TextNode[]): number => {
  const nodesStartingWithNumber = nodes.filter((node) =>
    /^\d/.test(node.text.trim())
  ).length;
  const nodesWithValidIngredientLength = nodes.filter((node) => {
    const wordCount = node.text.trim().split(/\s+/).length;
    return (
      wordCount >= THRESHOLDS.INGREDIENT_MIN_WORDS &&
      wordCount < THRESHOLDS.INGREDIENT_MAX_WORDS
    );
  }).length;
  const nodesWithUnitKeywords = nodes.filter((node) =>
    containsUnitKeyword(node.text)
  ).length;

  const numericFactor = nodesStartingWithNumber / nodes.length;
  const lengthFactor = nodesWithValidIngredientLength / nodes.length;
  const unitFactor = nodesWithUnitKeywords / nodes.length;

  const baseProbability = (numericFactor + lengthFactor) / 2;
  const probability =
    baseProbability * THRESHOLDS.INGREDIENT_NUMERIC_LENGTH_WEIGHT +
    unitFactor * THRESHOLDS.INGREDIENT_UNIT_WEIGHT;
  return probability;
};

export const groupNodesByDepthAndType = (
  textNodes: TextNode[]
): InternalIngredientGroup[] => {
  const result: InternalIngredientGroup[] = [];
  let currentGroup: TextNode[] = [];
  let currentDepth = textNodes[0].depth;
  let currentElementType = textNodes[0].elementType;
  let alternatingElementType: string | null = null;
  let consecutiveInterruptions = 0;

  const splitGroupByElementType = () => {
    if (currentGroup.length === 0) return;
    let startIndex = 0;
    while (startIndex < currentGroup.length) {
      const startType = currentGroup[startIndex].elementType;
      let endIndex = startIndex + 1;
      while (
        endIndex < currentGroup.length &&
        currentGroup[endIndex].elementType === startType
      ) {
        endIndex++;
      }
      const subGroup = currentGroup.slice(startIndex, endIndex);
      const probability = computeIngredientProbability(subGroup);
      result.push({
        ingredientProbability: probability,
        instructionsProbability: 0,
        nodes: [...subGroup],
        originalIndex: result.length,
      });
      startIndex = endIndex;
    }
  };

  for (let i = 0; i < textNodes.length; i++) {
    const node = textNodes[i];

    if (node.depth === currentDepth) {
      if (node.elementType === currentElementType) {
        currentGroup.push(node);
        consecutiveInterruptions = 0;
      } else {
        if (alternatingElementType === null) {
          alternatingElementType = node.elementType;
          consecutiveInterruptions = 1;
          currentGroup.push(node);
        } else if (node.elementType === alternatingElementType) {
          consecutiveInterruptions++;
          currentGroup.push(node);
        } else {
          if (currentGroup.length > 0) {
            splitGroupByElementType();
          }
          currentGroup = [node];
          currentElementType = node.elementType;
          alternatingElementType = null;
          consecutiveInterruptions = 0;
        }
      }
    } else {
      if (currentGroup.length > 0) {
        splitGroupByElementType();
      }
      currentGroup = [node];
      currentDepth = node.depth;
      currentElementType = node.elementType;
      alternatingElementType = null;
      consecutiveInterruptions = 0;
    }
  }

  if (currentGroup.length > 0) {
    splitGroupByElementType();
  }

  return result;
};
