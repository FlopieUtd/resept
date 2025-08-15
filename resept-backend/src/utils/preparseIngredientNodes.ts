import { TextNode } from "./extractTextNodes";
import { COOKING_IMPERATIVES } from "./constants";

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
  let currentElementType = textNodes[0].elementType;
  let interruptingElementType: string | null = null;
  let consecutiveInterruptions = 0;

  for (let i = 0; i < textNodes.length; i++) {
    const node = textNodes[i];

    if (node.depth === currentDepth) {
      if (node.elementType === currentElementType) {
        // Same element type, add to current group
        currentGroup.push(node);
        // Reset interruption tracking since we're back to main content
        consecutiveInterruptions = 0;
      } else {
        // Different element type - check if it's a consistent interruption
        if (interruptingElementType === null) {
          // First time seeing this interrupting element type
          interruptingElementType = node.elementType;
          consecutiveInterruptions = 1;
          // Continue with current group (don't start new group yet)
        } else if (node.elementType === interruptingElementType) {
          // Same interrupting element type, increment count
          consecutiveInterruptions++;
          // Continue with current group
        } else {
          // Different interrupting element type - start new group
          if (currentGroup.length > 0) {
            const nodesStartingWithNumber = currentGroup.filter((node) =>
              /^\d/.test(node.text.trim())
            ).length;
            const nodesWithLessThan10WordsAndMoreThan1Word =
              currentGroup.filter((node) => {
                const wordCount = node.text.trim().split(/\s+/).length;
                return wordCount < 10 && wordCount > 1;
              }).length;

            const factor1 = nodesStartingWithNumber / currentGroup.length;
            const factor2 =
              nodesWithLessThan10WordsAndMoreThan1Word / currentGroup.length;
            const probability = (factor1 + factor2) / 2;

            result.push({
              ingredientProbability: probability,
              instructionsProbability: 0,
              nodes: [...currentGroup],
            });
          }
          currentGroup = [node];
          currentElementType = node.elementType;
          interruptingElementType = null;
          consecutiveInterruptions = 0;
        }
      }
    } else {
      // Different depth - finalize current group and start new one
      if (currentGroup.length > 0) {
        const nodesStartingWithNumber = currentGroup.filter((node) =>
          /^\d/.test(node.text.trim())
        ).length;
        const nodesWithLessThan10WordsAndMoreThan1Word = currentGroup.filter(
          (node) => {
            const wordCount = node.text.trim().split(/\s+/).length;
            return wordCount < 10 && wordCount > 1;
          }
        ).length;

        const factor1 = nodesStartingWithNumber / currentGroup.length;
        const factor2 =
          nodesWithLessThan10WordsAndMoreThan1Word / currentGroup.length;
        const probability = (factor1 + factor2) / 2;

        result.push({
          ingredientProbability: probability,
          instructionsProbability: 0,
          nodes: [...currentGroup],
        });
      }
      currentGroup = [node];
      currentDepth = node.depth;
      currentElementType = node.elementType;
      interruptingElementType = null;
      consecutiveInterruptions = 0;
    }
  }

  if (currentGroup.length > 0) {
    const nodesStartingWithNumber = currentGroup.filter((node) =>
      /^\d/.test(node.text.trim())
    ).length;
    const nodesWithLessThan10WordsAndMoreThan1Word = currentGroup.filter(
      (node) => {
        const wordCount = node.text.trim().split(/\s+/).length;
        return wordCount < 10 && wordCount > 1;
      }
    ).length;

    const factor1 = nodesStartingWithNumber / currentGroup.length;
    const factor2 =
      nodesWithLessThan10WordsAndMoreThan1Word / currentGroup.length;
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

      if (i > maxIngredientIndex) {
        baseScore = 0.2;
      }

      const nodesWithMoreThan10Words = filteredResult[i].nodes.filter(
        (node) => node.text.trim().split(/\s+/).length > 10
      ).length;

      const wordBonus =
        (nodesWithMoreThan10Words / filteredResult[i].nodes.length) * 0.2;

      const nodesStartingWithVerb = filteredResult[i].nodes.filter((node) => {
        const text = node.text.trim();
        if (!text) return false;

        // Split into sentences and check first word of each
        const sentences = text
          .split(/[.!?]+/)
          .filter((s) => s.trim().length > 0);
        const firstWords = sentences
          .map((sentence) => sentence.trim().split(/\s+/)[0]?.toLowerCase())
          .filter((word) => word && word.length > 0);

        // Check if any of the first words are verbs
        const allVerbs = Object.values(COOKING_IMPERATIVES).flatMap(
          (verbGroup) => {
            const dutchVerbs = Array.isArray(verbGroup.dutch)
              ? verbGroup.dutch
              : [verbGroup.dutch];
            const englishVerbs = Array.isArray(verbGroup.english)
              ? verbGroup.english
              : [verbGroup.english];
            return [...dutchVerbs, ...englishVerbs];
          }
        );

        const hasVerb = firstWords.some((firstWord) =>
          allVerbs.includes(firstWord)
        );

        return hasVerb;
      }).length;

      const verbBonus =
        (nodesStartingWithVerb / filteredResult[i].nodes.length) * 0.6;

      filteredResult[i].instructionsProbability = Math.min(
        baseScore + wordBonus + verbBonus,
        1.0
      );
    }
  }

  console.log(JSON.stringify(filteredResult, null, 2));

  const ingredients: { raw: string }[] = [];
  const instructions: { text: string }[] = [];

  if (filteredResult.length > 0) {
    const maxIngredientGroup = filteredResult.reduce((max, group) =>
      group.ingredientProbability > max.ingredientProbability ? group : max
    );

    const maxInstructionsGroup = filteredResult.reduce((max, group) =>
      group.instructionsProbability > max.instructionsProbability ? group : max
    );

    // QA logging: Show all first words from instructions group and verb recognition
    console.log("\n=== QA: Instructions Group Verb Detection ===");
    console.log(
      `Instructions group probability: ${maxInstructionsGroup.instructionsProbability}`
    );
    console.log(
      `Instructions group nodes: ${maxInstructionsGroup.nodes.length}`
    );

    maxInstructionsGroup.nodes.forEach((node, index) => {
      const text = node.text.trim();
      const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);

      const firstWords = sentences
        .map((sentence) => sentence.trim().split(/\s+/)[0]?.toLowerCase())
        .filter((word) => word && word.length > 0);

      const allVerbs = Object.values(COOKING_IMPERATIVES).flatMap(
        (verbGroup) => {
          const dutchVerbs = Array.isArray(verbGroup.dutch)
            ? verbGroup.dutch
            : [verbGroup.dutch];
          const englishVerbs = Array.isArray(verbGroup.english)
            ? verbGroup.english
            : [verbGroup.english];
          return [...dutchVerbs, ...englishVerbs];
        }
      );

      const verbAnalysis = firstWords.map((word) => ({
        word,
        isVerb: allVerbs.includes(word),
      }));

      console.log(`\nNode ${index + 1}: "${text}"`);
      console.log(`  First words: ${JSON.stringify(verbAnalysis)}`);
    });
    console.log("=== End QA ===\n");

    ingredients.push(
      ...maxIngredientGroup.nodes.map((node) => ({ raw: node.text }))
    );
    instructions.push(
      ...maxInstructionsGroup.nodes.map((node) => ({ text: node.text }))
    );
  }

  return { ingredients, instructions };
};
