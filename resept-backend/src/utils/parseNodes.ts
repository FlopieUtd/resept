import { TextNode } from "./extractTextNodes.js";
import { COOKING_IMPERATIVES, UNIT_KEYWORDS } from "./constants.js";
import { parseIngredient, type ParsedIngredient } from "./parseIngredient.js";

interface IngredientGroup {
  ingredientProbability: number;
  instructionsProbability: number;
  nodes: TextNode[];
}

interface ParsedResult {
  ingredients: { raw: string; parsed: ParsedIngredient }[];
  instructions: { text: string }[];
  maxIngredientProbability: number;
  maxInstructionsProbability: number;
}

const containsUnitKeyword = (text: string): boolean => {
  const normalizedText = text.toLowerCase().trim();

  // Get all unit keywords from both Dutch and English, removing duplicates
  const allUnitKeywords = [
    ...new Set(
      Object.values(UNIT_KEYWORDS).flatMap((unitGroup) => {
        const dutchUnits = Array.isArray(unitGroup.dutch)
          ? unitGroup.dutch
          : [unitGroup.dutch];
        const englishUnits = Array.isArray(unitGroup.english)
          ? unitGroup.english
          : [unitGroup.english];
        return [...dutchUnits, ...englishUnits];
      })
    ),
  ];

  // Check if any unit keyword is found as a whole word (surrounded by word boundaries)
  return allUnitKeywords.some((keyword) => {
    const regex = new RegExp(
      `\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
      "i"
    );
    return regex.test(normalizedText);
  });
};

export const parseNodes = (textNodes: TextNode[]): ParsedResult => {
  if (textNodes.length === 0) {
    return {
      ingredients: [],
      instructions: [],
      maxIngredientProbability: 0,
      maxInstructionsProbability: 0,
    };
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
          // Add to current group (don't start new group yet)
          currentGroup.push(node);
        } else if (node.elementType === interruptingElementType) {
          // Same interrupting element type, increment count
          consecutiveInterruptions++;
          // Add to current group
          currentGroup.push(node);
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
            const nodesWithUnitKeywords = currentGroup.filter((node) =>
              containsUnitKeyword(node.text)
            ).length;

            const factor1 = nodesStartingWithNumber / currentGroup.length;
            const factor2 =
              nodesWithLessThan10WordsAndMoreThan1Word / currentGroup.length;
            const factor3 = nodesWithUnitKeywords / currentGroup.length;
            const oldFactors = (factor1 + factor2) / 2; // Average of first two factors (0-1)
            const probability = oldFactors * 0.5 + factor3 * 0.5; // True 50/50 split

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
        const nodesWithUnitKeywords = currentGroup.filter((node) =>
          containsUnitKeyword(node.text)
        ).length;

        const factor1 = nodesStartingWithNumber / currentGroup.length;
        const factor2 =
          nodesWithLessThan10WordsAndMoreThan1Word / currentGroup.length;
        const factor3 = nodesWithUnitKeywords / currentGroup.length;
        const oldFactors = (factor1 + factor2) / 2; // Average of first two factors (0-1)
        const probability = oldFactors * 0.5 + factor3 * 0.5; // True 50/50 split

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
    const nodesWithUnitKeywords = currentGroup.filter((node) =>
      containsUnitKeyword(node.text)
    ).length;

    const factor1 = nodesStartingWithNumber / currentGroup.length;
    const factor2 =
      nodesWithLessThan10WordsAndMoreThan1Word / currentGroup.length;
    const factor3 = nodesWithUnitKeywords / currentGroup.length;
    const oldFactors = (factor1 + factor2) / 2; // Average of first two factors (0-1)
    const probability = oldFactors * 0.5 + factor3 * 0.5; // True 50/50 split

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

  console.log("Filtered result: ", JSON.stringify(filteredResult, null, 2));

  const ingredients: { raw: string; parsed: ParsedIngredient }[] = [];
  const instructions: { text: string }[] = [];

  if (filteredResult.length > 0) {
    const maxIngredientGroup = filteredResult.reduce((max, group) =>
      group.ingredientProbability > max.ingredientProbability ? group : max
    );

    const maxInstructionsGroup = filteredResult.reduce((max, group) =>
      group.instructionsProbability > max.instructionsProbability ? group : max
    );

    ingredients.push(
      ...maxIngredientGroup.nodes.map((node) => {
        const raw = node.text;
        const parsed = parseIngredient(raw);
        return { raw, parsed };
      })
    );
    instructions.push(
      ...maxInstructionsGroup.nodes.map((node) => ({ text: node.text }))
    );

    return {
      ingredients,
      instructions,
      maxIngredientProbability: maxIngredientGroup.ingredientProbability,
      maxInstructionsProbability: maxInstructionsGroup.instructionsProbability,
    };
  }

  return {
    ingredients,
    instructions,
    maxIngredientProbability: 0,
    maxInstructionsProbability: 0,
  };
};
