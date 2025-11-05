import { TextNode } from "./extractTextNodes";
import { COOKING_IMPERATIVES, UNIT_KEYWORDS } from "./constants";
import { parseIngredient, type ParsedIngredient } from "./parseIngredient";
import type { IngredientGroup, IngredientLine } from "../../types";

interface InternalIngredientGroup {
  ingredientProbability: number;
  instructionsProbability: number;
  nodes: TextNode[];
  originalIndex: number;
}

interface ParsedResult {
  ingredients: IngredientGroup[];
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

const isTitleGroup = (group: InternalIngredientGroup): boolean => {
  if (group.nodes.length === 0) return false;

  const allText = group.nodes.map((n) => n.text.trim()).join(" ");
  const wordCount = allText.split(/\s+/).length;

  if (wordCount > 8) return false;

  const hasNumbers = /\d/.test(allText);
  const hasUnits = containsUnitKeyword(allText);

  if (hasNumbers || hasUnits) return false;

  const endsWithColon = /[:：]$/.test(allText.trim());
  const isShortPhrase = wordCount <= 6;

  return endsWithColon || (isShortPhrase && !hasNumbers && !hasUnits);
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

  const result: InternalIngredientGroup[] = [];
  let currentGroup: TextNode[] = [];
  let currentDepth = textNodes[0].depth;
  let currentElementType = textNodes[0].elementType;
  let interruptingElementType: string | null = null;
  let consecutiveInterruptions = 0;

  const computeIngredientProbability = (nodes: TextNode[]): number => {
    const nodesStartingWithNumber = nodes.filter((node) =>
      /^\d/.test(node.text.trim())
    ).length;
    const nodesWithLessThan10WordsAndMoreThan1Word = nodes.filter((node) => {
      const wordCount = node.text.trim().split(/\s+/).length;
      return wordCount < 10 && wordCount > 1;
    }).length;
    const nodesWithUnitKeywords = nodes.filter((node) =>
      containsUnitKeyword(node.text)
    ).length;

    const factor1 = nodesStartingWithNumber / nodes.length;
    const factor2 = nodesWithLessThan10WordsAndMoreThan1Word / nodes.length;
    const factor3 = nodesWithUnitKeywords / nodes.length;
    const oldFactors = (factor1 + factor2) / 2;
    const probability = oldFactors * 0.5 + factor3 * 0.5;
    return probability;
  };

  const finalizeGroupHomogeneous = () => {
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
            finalizeGroupHomogeneous();
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
        finalizeGroupHomogeneous();
      }
      currentGroup = [node];
      currentDepth = node.depth;
      currentElementType = node.elementType;
      interruptingElementType = null;
      consecutiveInterruptions = 0;
    }
  }

  if (currentGroup.length > 0) {
    finalizeGroupHomogeneous();
  }

  const calculateInstructionProbability = (
    group: InternalIngredientGroup,
    allGroups: InternalIngredientGroup[],
    maxIngredientIndex: number,
    groupIndex: number
  ): number => {
    let baseScore = 0;

    if (groupIndex > maxIngredientIndex) {
      baseScore = 0.2;
    }

    const nodesWithMoreThan10Words = group.nodes.filter(
      (node) => node.text.trim().split(/\s+/).length > 10
    ).length;

    const wordBonus = (nodesWithMoreThan10Words / group.nodes.length) * 0.2;

    const nodesStartingWithVerb = group.nodes.filter((node) => {
      const text = node.text.trim();
      if (!text) return false;

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

      const hasVerb = firstWords.some((firstWord) =>
        allVerbs.includes(firstWord)
      );

      return hasVerb;
    }).length;

    const verbBonus = (nodesStartingWithVerb / group.nodes.length) * 0.6;

    return Math.min(baseScore + wordBonus + verbBonus, 1.0);
  };

  const filteredResult = result.filter((group) => group.nodes.length >= 2);

  let maxIngredientIndex = -1;
  if (filteredResult.length > 0) {
    maxIngredientIndex = filteredResult.reduce(
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
          maxIngredientIndex,
          i
        );
    }
  }

  const maxIngredientIndexAll =
    result.length > 0
      ? result.reduce(
          (maxIndex, group, index) =>
            group.ingredientProbability > result[maxIndex].ingredientProbability
              ? index
              : maxIndex,
          0
        )
      : -1;

  for (let i = 0; i < result.length; i++) {
    if (!result[i].instructionsProbability) {
      result[i].instructionsProbability = calculateInstructionProbability(
        result[i],
        result,
        maxIngredientIndexAll,
        i
      );
    }
  }

  console.log(
    "All text node groups with probabilities:",
    result.map((group) =>
      JSON.stringify(
        {
          ingredientProbability: group.ingredientProbability,
          instructionsProbability: group.instructionsProbability,
          nodeCount: group.nodes.length,
          nodes: group.nodes.map((n) => ({
            text: n.text,
            elementType: n.elementType,
            depth: n.depth,
          })),
        },
        null,
        2
      )
    )
  );

  const INSTRUCTIONS_THRESHOLD = 0.3;
  const maxInstructionsProbability =
    result.length > 0
      ? Math.max(...result.map((g) => g.instructionsProbability || 0))
      : 0;
  const RELATIVE_INSTRUCTIONS_THRESHOLD = 0.5;

  interface InstructionNode {
    node: TextNode;
    depth: number;
    originalIndex: number;
    probability: number;
  }

  const hasCookingImperatives = (group: InternalIngredientGroup): boolean => {
    const nodesStartingWithVerb = group.nodes.filter((node) => {
      const text = node.text.trim();
      if (!text) return false;

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

      return firstWords.some((firstWord) => allVerbs.includes(firstWord));
    });

    return nodesStartingWithVerb.length > 0;
  };

  const singleNodeInstructionCandidates: InstructionNode[] = [];
  for (let i = 0; i < result.length; i++) {
    const group = result[i];
    if (group.nodes.length === 1) {
      if (!hasCookingImperatives(group)) continue;

      const prob = group.instructionsProbability || 0;
      const absoluteThreshold = prob >= INSTRUCTIONS_THRESHOLD;
      const relativeThreshold =
        maxInstructionsProbability > 0
          ? prob >= maxInstructionsProbability * RELATIVE_INSTRUCTIONS_THRESHOLD
          : false;

      if (absoluteThreshold || relativeThreshold) {
        singleNodeInstructionCandidates.push({
          node: group.nodes[0],
          depth: group.nodes[0].depth,
          originalIndex: i,
          probability: prob,
        });
      }
    }
  }

  const multiNodeInstructionGroups = filteredResult.filter((group) => {
    if (!hasCookingImperatives(group)) return false;

    const prob = group.instructionsProbability || 0;
    const absoluteThreshold = prob >= INSTRUCTIONS_THRESHOLD;
    const relativeThreshold =
      maxInstructionsProbability > 0
        ? prob >= maxInstructionsProbability * RELATIVE_INSTRUCTIONS_THRESHOLD
        : false;
    return absoluteThreshold || relativeThreshold;
  });

  const findGroupOriginalIndex = (
    targetGroup: InternalIngredientGroup
  ): number => {
    return result.findIndex(
      (g) =>
        g.nodes.length === targetGroup.nodes.length &&
        g.nodes.every(
          (node, idx) =>
            node.text === targetGroup.nodes[idx].text &&
            node.depth === targetGroup.nodes[idx].depth
        )
    );
  };

  const allInstructionNodes: InstructionNode[] = [
    ...singleNodeInstructionCandidates,
    ...multiNodeInstructionGroups.flatMap((group) => {
      const originalIndex = findGroupOriginalIndex(group);
      return group.nodes.map((node) => ({
        node,
        depth: node.depth,
        originalIndex,
        probability: group.instructionsProbability || 0,
      }));
    }),
  ];

  const calculateCookingImperativeRatio = (
    nodes: InstructionNode[]
  ): number => {
    if (nodes.length === 0) return 0;

    let nodesWithVerbs = 0;
    for (const instructionNode of nodes) {
      const text = instructionNode.node.text.trim();
      if (!text) continue;

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

      const hasVerb = firstWords.some((firstWord) =>
        allVerbs.includes(firstWord)
      );

      if (hasVerb) {
        nodesWithVerbs++;
      }
    }

    return nodesWithVerbs / nodes.length;
  };

  const calculateNodeComplexity = (nodes: InstructionNode[]): number => {
    if (nodes.length === 0) return 0;

    let totalWords = 0;
    let totalSentences = 0;
    let nodesWithMultipleSentences = 0;

    for (const instructionNode of nodes) {
      const text = instructionNode.node.text.trim();
      if (!text) continue;

      const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
      const wordCount = text.split(/\s+/).filter((w) => w.length > 0).length;

      totalWords += wordCount;
      totalSentences += sentences.length;

      if (sentences.length > 1) {
        nodesWithMultipleSentences++;
      }
    }

    const avgWordsPerNode = totalWords / nodes.length;
    const avgSentencesPerNode = totalSentences / nodes.length;
    const multipleSentencesRatio = nodesWithMultipleSentences / nodes.length;

    const normalizedWords = Math.min(avgWordsPerNode / 50, 1.0);
    const normalizedSentences = Math.min(avgSentencesPerNode / 3, 1.0);

    return (
      normalizedWords * 0.5 +
      normalizedSentences * 0.3 +
      multipleSentencesRatio * 0.2
    );
  };

  const calculateClusterScore = (nodes: InstructionNode[]): number => {
    if (nodes.length === 0) return 0;

    const imperativeRatio = calculateCookingImperativeRatio(nodes);
    const complexity = calculateNodeComplexity(nodes);

    const HIGH_IMPERATIVE_THRESHOLD = 0.5;
    const isHighImperative = imperativeRatio >= HIGH_IMPERATIVE_THRESHOLD;

    if (isHighImperative) {
      return imperativeRatio * 0.4 + complexity * 0.6;
    }

    return imperativeRatio * 0.7 + complexity * 0.3;
  };

  const clusterInstructionsByDepthAndProximity = (
    nodes: InstructionNode[]
  ): InstructionNode[] => {
    if (nodes.length === 0) return [];

    const depthElementGroups = new Map<string, InstructionNode[]>();
    for (const instructionNode of nodes) {
      const depth = instructionNode.depth;
      const elementType = instructionNode.node.elementType;
      const key = `${depth}:${elementType}`;
      if (!depthElementGroups.has(key)) {
        depthElementGroups.set(key, []);
      }
      depthElementGroups.get(key)!.push(instructionNode);
    }

    const allClusters: InstructionNode[][] = [];

    for (const depthElementGroup of depthElementGroups.values()) {
      const sorted = [...depthElementGroup].sort(
        (a, b) => a.originalIndex - b.originalIndex
      );

      let currentCluster: InstructionNode[] = [sorted[0]];

      for (let i = 1; i < sorted.length; i++) {
        const distance = sorted[i].originalIndex - sorted[i - 1].originalIndex;
        if (distance <= 5) {
          currentCluster.push(sorted[i]);
        } else {
          allClusters.push(currentCluster);
          currentCluster = [sorted[i]];
        }
      }

      if (currentCluster.length > 0) {
        allClusters.push(currentCluster);
      }
    }

    if (allClusters.length === 0) return [];

    const clusterWithHighestScore = allClusters.reduce((max, cluster) => {
      const maxScore = calculateClusterScore(max);
      const clusterScore = calculateClusterScore(cluster);
      return clusterScore > maxScore ? cluster : max;
    });

    return clusterWithHighestScore;
  };

  const clusteredInstructions =
    clusterInstructionsByDepthAndProximity(allInstructionNodes);

  const instructions: { text: string }[] = clusteredInstructions.map(
    ({ node }) => ({ text: node.text })
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

  const INGREDIENT_THRESHOLD = 0.3;
  const RELATIVE_THRESHOLD = 0.5;

  const isHighProbabilityIngredient = (
    group: InternalIngredientGroup
  ): boolean => {
    const absoluteThreshold =
      group.ingredientProbability >= INGREDIENT_THRESHOLD;
    const relativeThreshold =
      maxIngredientProbability > 0
        ? group.ingredientProbability >=
          maxIngredientProbability * RELATIVE_THRESHOLD
        : false;
    return absoluteThreshold || relativeThreshold;
  };

  const isTitleElementType = (elementType: string): boolean => {
    const titleTypes = ["h1", "h2", "h3", "h4", "h5", "h6", "b", "strong"];
    return titleTypes.includes(elementType.toLowerCase());
  };

  const isTitleNode = (node: TextNode): boolean => {
    return isTitleElementType(node.elementType);
  };

  const extractTitleFromGroup = (
    group: InternalIngredientGroup
  ): { title: string | undefined; remainingNodes: TextNode[] } => {
    if (group.nodes.length < 2) {
      return { title: undefined, remainingNodes: group.nodes };
    }

    const firstNode = group.nodes[0];
    if (isTitleNode(firstNode)) {
      const titleText = firstNode.text
        .trim()
        .replace(/[:：]$/, "")
        .trim();
      if (titleText) {
        return {
          title: titleText,
          remainingNodes: group.nodes.slice(1),
        };
      }
    }

    return { title: undefined, remainingNodes: group.nodes };
  };

  const findPrecedingTitleGroup = (
    currentGroup: InternalIngredientGroup,
    allGroups: InternalIngredientGroup[],
    currentIndex: number
  ): string | undefined => {
    const currentGroupDepth = currentGroup.nodes[0]?.depth ?? 0;

    for (let i = currentIndex - 1; i >= Math.max(0, currentIndex - 3); i--) {
      const candidateGroup = allGroups[i];

      if (!candidateGroup || candidateGroup.nodes.length === 0) {
        continue;
      }

      const hasTitleElementType = candidateGroup.nodes.some((node) =>
        isTitleElementType(node.elementType)
      );

      if (!hasTitleElementType) {
        continue;
      }

      const candidateDepth = candidateGroup.nodes[0]?.depth ?? 0;
      const depthDiff = Math.abs(currentGroupDepth - candidateDepth);

      if (depthDiff > 2) {
        continue;
      }

      const titleText = candidateGroup.nodes
        .map((n) => n.text.trim())
        .join(" ")
        .replace(/[:：]$/, "")
        .trim();

      if (titleText) {
        return titleText;
      }
    }

    return undefined;
  };

  interface GroupWithMetadata {
    group: InternalIngredientGroup;
    originalIndex: number;
    title: string | undefined;
    ingredientLines: IngredientLine[];
  }

  const candidateGroups: GroupWithMetadata[] = [];
  let currentTitle: string | undefined = undefined;

  const findOriginalIndex = (
    filteredGroup: InternalIngredientGroup
  ): number => {
    return result.findIndex(
      (g) =>
        g.nodes.length === filteredGroup.nodes.length &&
        g.nodes.every(
          (node, idx) =>
            node.text === filteredGroup.nodes[idx].text &&
            node.depth === filteredGroup.nodes[idx].depth
        )
    );
  };

  for (let i = 0; i < filteredResult.length; i++) {
    const group = filteredResult[i];
    const originalIndex = findOriginalIndex(group);

    if (isTitleGroup(group)) {
      const titleText = group.nodes
        .map((n) => n.text.trim())
        .join(" ")
        .replace(/[:：]$/, "")
        .trim();
      if (titleText) {
        currentTitle = titleText;
      }
    } else if (isHighProbabilityIngredient(group)) {
      const { title: withinGroupTitle, remainingNodes } =
        extractTitleFromGroup(group);

      const precedingGroupTitle = findPrecedingTitleGroup(
        group,
        result,
        originalIndex
      );

      const titleToUse =
        withinGroupTitle || precedingGroupTitle || currentTitle;

      const ingredientLines: IngredientLine[] = remainingNodes.map((node) => {
        const raw = node.text;
        const parsed = parseIngredient(raw);
        return { raw, parsed };
      });

      if (ingredientLines.length > 0) {
        candidateGroups.push({
          group,
          originalIndex,
          title: titleToUse,
          ingredientLines,
        });
        currentTitle = undefined;
      }
    }
  }

  const calculatePairwiseDistance = (
    a: GroupWithMetadata,
    b: GroupWithMetadata
  ): number => {
    const sequenceDistance = Math.abs(a.originalIndex - b.originalIndex);

    const avgDepthA =
      a.group.nodes.reduce((sum, n) => sum + n.depth, 0) / a.group.nodes.length;
    const avgDepthB =
      b.group.nodes.reduce((sum, n) => sum + n.depth, 0) / b.group.nodes.length;
    const depthDistance = Math.abs(avgDepthA - avgDepthB);

    const sizeDistance = Math.abs(a.group.nodes.length - b.group.nodes.length);

    const titlePatternA = a.title
      ?.toLowerCase()
      .match(/^voor\s+(de|het|een)?\s*\w+$/i)
      ? 1
      : 0;
    const titlePatternB = b.title
      ?.toLowerCase()
      .match(/^voor\s+(de|het|een)?\s*\w+$/i)
      ? 1
      : 0;
    const patternDistance = titlePatternA !== titlePatternB ? 1 : 0;

    const normalizedSequence =
      sequenceDistance / Math.max(candidateGroups.length, 1);
    const normalizedDepth = depthDistance / 10;
    const normalizedSize =
      sizeDistance / Math.max(a.group.nodes.length, b.group.nodes.length, 1);

    return (
      normalizedSequence * 0.3 +
      normalizedDepth * 0.3 +
      normalizedSize * 0.2 +
      patternDistance * 0.2
    );
  };

  const findMainCluster = (
    groups: GroupWithMetadata[]
  ): GroupWithMetadata[] => {
    if (groups.length <= 1) {
      return groups;
    }

    const distances: number[][] = [];
    for (let i = 0; i < groups.length; i++) {
      distances[i] = [];
      for (let j = 0; j < groups.length; j++) {
        if (i === j) {
          distances[i][j] = 0;
        } else {
          distances[i][j] = calculatePairwiseDistance(groups[i], groups[j]);
        }
      }
    }

    const threshold = 0.5;
    const clusters: number[][] = [];
    const visited = new Set<number>();

    for (let i = 0; i < groups.length; i++) {
      if (visited.has(i)) continue;

      const cluster: number[] = [i];
      visited.add(i);

      for (let j = i + 1; j < groups.length; j++) {
        if (visited.has(j)) continue;

        let minDistanceToCluster = Infinity;
        for (const memberIdx of cluster) {
          minDistanceToCluster = Math.min(
            minDistanceToCluster,
            distances[memberIdx][j]
          );
        }

        if (minDistanceToCluster <= threshold) {
          cluster.push(j);
          visited.add(j);
        }
      }

      clusters.push(cluster);
    }

    const scoreCluster = (cluster: number[]): number =>
      cluster.reduce(
        (sum, idx) =>
          sum + (candidateGroups[idx].group.ingredientProbability || 0),
        0
      );

    const mainCluster = clusters.reduce((best, cluster) => {
      const bestScore = scoreCluster(best);
      const currScore = scoreCluster(cluster);
      if (currScore !== bestScore) {
        return currScore > bestScore ? cluster : best;
      }
      return cluster.length > best.length ? cluster : best;
    });

    return mainCluster.map((idx) => groups[idx]);
  };

  const clusteredGroups = findMainCluster(candidateGroups);

  const ingredientGroups: IngredientGroup[] = clusteredGroups.map(
    (candidate) => ({
      title: clusteredGroups.length === 1 ? undefined : candidate.title,
      ingredients: candidate.ingredientLines,
    })
  );

  console.log(
    "candidateGroups groups:",
    JSON.stringify(candidateGroups, null, 2)
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
