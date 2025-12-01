import type { InternalIngredientGroup } from "./parseNodes.types";
import type { InstructionGroup } from "../../types";

export const extractInstructions = (
  allGroups: InternalIngredientGroup[]
): InstructionGroup[] => {
  if (allGroups.length === 0) {
    return [];
  }

  const bestInstructionGroup = allGroups.reduce((max, group) => {
    const maxProbability = max.instructionsProbability || 0;
    const groupProbability = group.instructionsProbability || 0;
    return groupProbability > maxProbability ? group : max;
  });

  const allInstructionGroups = (() => {
    const matchingGroups = allGroups.filter((group) => {
      if (group.nodes.length === 0) {
        return false;
      }
      const { depth, elementType } = bestInstructionGroup.nodes[0];
      return group.nodes.every(
        (node) => node.depth === depth && node.elementType === elementType
      );
    });

    if (matchingGroups.length <= 1) {
      return matchingGroups;
    }
    const targetIndex = bestInstructionGroup.originalIndex;
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

  const INSTRUCTION_PROBABILITY_THRESHOLD = 0.2;

  const filteredInstructionGroups = allInstructionGroups.filter(
    (group) =>
      (group.instructionsProbability || 0) >= INSTRUCTION_PROBABILITY_THRESHOLD
  );

  const titlesByIndex =
    filteredInstructionGroups.length > 1
      ? (() => {
          const instructionGroupIndices = new Set(
            filteredInstructionGroups.map((group) => group.originalIndex)
          );
          const map = new Map<number, string>();
          const normalizeTitle = (text: string) =>
            text
              .trim()
              .replace(/[:：]$/, "")
              .trim();
          filteredInstructionGroups.forEach((group) => {
            let cursor = group.originalIndex - 1;
            while (cursor >= 0 && !instructionGroupIndices.has(cursor)) {
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

  const result = filteredInstructionGroups.map((group) => ({
    title: titlesByIndex.get(group.originalIndex),
    instructions: group.nodes.map((node) => ({ text: node.text })),
  }));

  return result;
};
