import { TextNode } from "./extractTextNodes";

interface IngredientGroup {
  ingredientProbability: number;
  instructionsProbability: number;
  nodes: TextNode[];
}

interface ParsedResult {
  ingredients: { raw: string }[];
  instructions: { text: string }[];
}

export const preparseIngredientNodes = (
  textNodes: TextNode[]
): ParsedResult => {
  if (textNodes.length === 0) {
    return { ingredients: [], instructions: [] };
  }

  const result: IngredientGroup[] = [];
  let currentGroup: TextNode[] = [];
  let currentDepth = textNodes[0].depth;

  for (let i = 0; i < textNodes.length; i++) {
    const node = textNodes[i];

    if (node.depth === currentDepth) {
      currentGroup.push(node);
    } else {
      if (currentGroup.length > 0) {
        const nodesStartingWithNumber = currentGroup.filter((node) =>
          /^\d/.test(node.text.trim())
        ).length;
        const nodesWithLessThan10Words = currentGroup.filter(
          (node) => node.text.trim().split(/\s+/).length < 10
        ).length;

        const factor1 = nodesStartingWithNumber / currentGroup.length;
        const factor2 = nodesWithLessThan10Words / currentGroup.length;
        const probability = (factor1 + factor2) / 2;

        result.push({
          ingredientProbability: probability,
          instructionsProbability: 0,
          nodes: [...currentGroup],
        });
      }
      currentGroup = [node];
      currentDepth = node.depth;
    }
  }

  if (currentGroup.length > 0) {
    const nodesStartingWithNumber = currentGroup.filter((node) =>
      /^\d/.test(node.text.trim())
    ).length;
    const nodesWithLessThan10Words = currentGroup.filter(
      (node) => node.text.trim().split(/\s+/).length < 10
    ).length;

    const factor1 = nodesStartingWithNumber / currentGroup.length;
    const factor2 = nodesWithLessThan10Words / currentGroup.length;
    const probability = (factor1 + factor2) / 2;

    result.push({
      ingredientProbability: probability,
      instructionsProbability: 0,
      nodes: [...currentGroup],
    });
  }

  const filteredResult = result.filter((group) => group.nodes.length >= 2);

  if (filteredResult.length > 0) {
    const maxIngredientIndex = filteredResult.reduce(
      (maxIndex, group, index) =>
        group.ingredientProbability >
        filteredResult[maxIndex].ingredientProbability
          ? index
          : maxIndex,
      0
    );

    for (let i = 0; i < filteredResult.length; i++) {
      let baseScore = 0;

      if (i === maxIngredientIndex + 1) {
        baseScore = 0.5;
      } else if (i > maxIngredientIndex + 1) {
        baseScore = 0.25;
      }

      const nodesWithMoreThan10Words = filteredResult[i].nodes.filter(
        (node) => node.text.trim().split(/\s+/).length > 10
      ).length;

      const wordBonus =
        nodesWithMoreThan10Words / filteredResult[i].nodes.length / 2;

      filteredResult[i].instructionsProbability = Math.min(
        baseScore + wordBonus,
        1.0
      );
    }
  }

  const ingredients: { raw: string }[] = [];
  const instructions: { text: string }[] = [];

  if (filteredResult.length > 0) {
    const maxIngredientGroup = filteredResult.reduce((max, group) =>
      group.ingredientProbability > max.ingredientProbability ? group : max
    );

    const maxInstructionsGroup = filteredResult.reduce((max, group) =>
      group.instructionsProbability > max.instructionsProbability ? group : max
    );

    ingredients.push(
      ...maxIngredientGroup.nodes.map((node) => ({ raw: node.text }))
    );
    instructions.push(
      ...maxInstructionsGroup.nodes.map((node) => ({ text: node.text }))
    );
  }

  return { ingredients, instructions };
};
