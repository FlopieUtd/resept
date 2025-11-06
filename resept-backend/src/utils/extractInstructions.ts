import { THRESHOLDS } from "./parseNodes.thresholds";
import { startsWithCookingVerb } from "./parseNodes.lexicon";
import type {
  InternalIngredientGroup,
  InstructionNode,
} from "./parseNodes.types";

const hasCookingImperatives = (group: InternalIngredientGroup): boolean => {
  return group.nodes.some((node) => startsWithCookingVerb(node.text));
};

const meetsInstructionThreshold = (
  probability: number,
  maxProbability: number
): boolean => {
  const absolute = probability >= THRESHOLDS.INSTRUCTIONS_ABSOLUTE;
  const relative =
    maxProbability > 0
      ? probability >= maxProbability * THRESHOLDS.INSTRUCTIONS_RELATIVE
      : false;
  return absolute || relative;
};

const findGroupIndexInResult = (
  targetGroup: InternalIngredientGroup,
  searchArray: InternalIngredientGroup[]
): number => {
  return searchArray.findIndex(
    (g) =>
      g.nodes.length === targetGroup.nodes.length &&
      g.nodes.every(
        (node, idx) =>
          node.text === targetGroup.nodes[idx].text &&
          node.depth === targetGroup.nodes[idx].depth
      )
  );
};

const calculateCookingImperativeRatio = (nodes: InstructionNode[]): number => {
  if (nodes.length === 0) return 0;
  const nodesWithVerbs = nodes.filter((instructionNode) =>
    startsWithCookingVerb(instructionNode.node.text)
  ).length;
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
  const normalizedWords = Math.min(
    avgWordsPerNode / THRESHOLDS.COMPLEXITY_WORDS_NORMALIZER,
    1.0
  );
  const normalizedSentences = Math.min(
    avgSentencesPerNode / THRESHOLDS.COMPLEXITY_SENTENCES_NORMALIZER,
    1.0
  );
  return (
    normalizedWords * THRESHOLDS.COMPLEXITY_WORDS_WEIGHT +
    normalizedSentences * THRESHOLDS.COMPLEXITY_SENTENCES_WEIGHT +
    multipleSentencesRatio * THRESHOLDS.COMPLEXITY_MULTIPLE_SENTENCES_WEIGHT
  );
};

const calculateClusterScore = (nodes: InstructionNode[]): number => {
  if (nodes.length === 0) return 0;
  const imperativeRatio = calculateCookingImperativeRatio(nodes);
  const complexity = calculateNodeComplexity(nodes);
  const isHighImperative = imperativeRatio >= THRESHOLDS.HIGH_IMPERATIVE;
  if (isHighImperative) {
    return (
      imperativeRatio * THRESHOLDS.CLUSTER_IMPERATIVE_WEIGHT_HIGH +
      complexity * THRESHOLDS.CLUSTER_COMPLEXITY_WEIGHT_HIGH
    );
  }
  return (
    imperativeRatio * THRESHOLDS.CLUSTER_IMPERATIVE_WEIGHT_LOW +
    complexity * THRESHOLDS.CLUSTER_COMPLEXITY_WEIGHT_LOW
  );
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
      if (distance <= THRESHOLDS.CLUSTER_DISTANCE) {
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

export const extractInstructions = (
  allGroups: InternalIngredientGroup[],
  filteredResult: InternalIngredientGroup[],
  maxInstructionsProbability: number
): { text: string }[] => {
  const singleNodeInstructionCandidates: InstructionNode[] = [];
  for (let i = 0; i < allGroups.length; i++) {
    const group = allGroups[i];
    if (group.nodes.length === 1) {
      if (!hasCookingImperatives(group)) continue;
      const probability = group.instructionsProbability || 0;
      if (meetsInstructionThreshold(probability, maxInstructionsProbability)) {
        singleNodeInstructionCandidates.push({
          node: group.nodes[0],
          depth: group.nodes[0].depth,
          originalIndex: i,
          probability,
        });
      }
    }
  }

  const multiNodeInstructionGroups = filteredResult.filter((group) => {
    if (!hasCookingImperatives(group)) return false;
    const probability = group.instructionsProbability || 0;
    return meetsInstructionThreshold(probability, maxInstructionsProbability);
  });

  const allInstructionNodes: InstructionNode[] = [
    ...singleNodeInstructionCandidates,
    ...multiNodeInstructionGroups.flatMap((group) => {
      const originalIndex = findGroupIndexInResult(group, allGroups);
      return group.nodes.map((node) => ({
        node,
        depth: node.depth,
        originalIndex,
        probability: group.instructionsProbability || 0,
      }));
    }),
  ];

  const clusteredInstructions =
    clusterInstructionsByDepthAndProximity(allInstructionNodes);
  return clusteredInstructions.map(({ node }) => ({ text: node.text }));
};
