import { THRESHOLDS } from "./parseNodes.thresholds";
import { startsWithCookingVerb } from "./parseNodes.lexicon";
import type { InternalIngredientGroup } from "./parseNodes.types";

const calculateInstructionProbability = (
  group: InternalIngredientGroup,
  allGroups: InternalIngredientGroup[],
  maxIngredientIndex: number,
  groupIndex: number
): number => {
  let baseScore = 0;

  if (groupIndex > maxIngredientIndex) {
    baseScore = THRESHOLDS.INSTRUCTION_POSITION_BONUS;
  }

  const nodesWithLongInstructions = group.nodes.filter(
    (node) =>
      node.text.trim().split(/\s+/).length > THRESHOLDS.INSTRUCTION_LONG_WORDS
  ).length;

  const wordProbabilityBonus =
    (nodesWithLongInstructions / group.nodes.length) *
    THRESHOLDS.INSTRUCTION_WORD_BONUS_WEIGHT;

  const nodesStartingWithVerb = group.nodes.filter((node) =>
    startsWithCookingVerb(node.text)
  ).length;

  const verbProbabilityBonus =
    (nodesStartingWithVerb / group.nodes.length) *
    THRESHOLDS.INSTRUCTION_VERB_BONUS_WEIGHT;

  return Math.min(baseScore + wordProbabilityBonus + verbProbabilityBonus, 1.0);
};

export const calculateProbabilities = (
  groups: InternalIngredientGroup[]
): {
  maxInstructionsProbability: number;
  filteredResult: InternalIngredientGroup[];
} => {
  const filteredResult = groups.filter((group) => group.nodes.length >= 2);

  let maxFilteredIngredientIndex = -1;
  if (filteredResult.length > 0) {
    maxFilteredIngredientIndex = filteredResult.reduce(
      (maxIndex, group, index) =>
        group.ingredientProbability >
        filteredResult[maxIndex].ingredientProbability
          ? index
          : maxIndex,
      0
    );

    for (let i = 0; i < filteredResult.length; i++) {
      filteredResult[i].instructionsProbability =
        calculateInstructionProbability(
          filteredResult[i],
          filteredResult,
          maxFilteredIngredientIndex,
          i
        );
    }
  }

  const maxAllIngredientIndex =
    groups.length > 0
      ? groups.reduce(
          (maxIndex, group, index) =>
            group.ingredientProbability > groups[maxIndex].ingredientProbability
              ? index
              : maxIndex,
          0
        )
      : -1;

  for (let i = 0; i < groups.length; i++) {
    if (!groups[i].instructionsProbability) {
      groups[i].instructionsProbability = calculateInstructionProbability(
        groups[i],
        groups,
        maxAllIngredientIndex,
        i
      );
    }
  }

  const maxInstructionsProbability =
    groups.length > 0
      ? Math.max(...groups.map((g) => g.instructionsProbability || 0))
      : 0;

  return { maxInstructionsProbability, filteredResult };
};
