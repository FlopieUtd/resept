import { THRESHOLDS } from "./parseNodes.thresholds";
import type { IngredientGroup } from "../../types";
import type { GroupWithMetadata } from "./parseNodes.types";

const calculatePairwiseDistance = (
  a: GroupWithMetadata,
  b: GroupWithMetadata,
  totalGroups: number
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
  const normalizedSequence = sequenceDistance / Math.max(totalGroups, 1);
  const normalizedDepth = depthDistance / THRESHOLDS.DEPTH_NORMALIZER;
  const normalizedSize =
    sizeDistance / Math.max(a.group.nodes.length, b.group.nodes.length, 1);
  return (
    normalizedSequence * THRESHOLDS.DISTANCE_SEQUENCE_WEIGHT +
    normalizedDepth * THRESHOLDS.DISTANCE_DEPTH_WEIGHT +
    normalizedSize * THRESHOLDS.DISTANCE_SIZE_WEIGHT +
    patternDistance * THRESHOLDS.DISTANCE_PATTERN_WEIGHT
  );
};

const findMainCluster = (groups: GroupWithMetadata[]): GroupWithMetadata[] => {
  if (groups.length <= 1) return groups;
  const distances: number[][] = [];
  for (let i = 0; i < groups.length; i++) {
    distances[i] = [];
    for (let j = 0; j < groups.length; j++) {
      if (i === j) {
        distances[i][j] = 0;
      } else {
        distances[i][j] = calculatePairwiseDistance(
          groups[i],
          groups[j],
          groups.length
        );
      }
    }
  }
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
      if (minDistanceToCluster <= THRESHOLDS.CLUSTER_THRESHOLD) {
        cluster.push(j);
        visited.add(j);
      }
    }
    clusters.push(cluster);
  }
  const scoreCluster = (cluster: number[]): number =>
    cluster.reduce(
      (sum, idx) => sum + (groups[idx].group.ingredientProbability || 0),
      0
    );
  const mainCluster = clusters.reduce((best, cluster) => {
    const bestScore = scoreCluster(best);
    const currScore = scoreCluster(cluster);
    if (currScore !== bestScore) return currScore > bestScore ? cluster : best;
    return cluster.length > best.length ? cluster : best;
  });
  return mainCluster.map((idx) => groups[idx]);
};

export const clusterIngredientGroups = (
  candidateGroups: GroupWithMetadata[]
): IngredientGroup[] => {
  const clusteredGroups = findMainCluster(candidateGroups);
  const ingredientGroups: IngredientGroup[] = clusteredGroups.map(
    (candidate) => ({
      title: clusteredGroups.length === 1 ? undefined : candidate.title,
      ingredients: candidate.ingredientLines,
    })
  );
  return ingredientGroups;
};
