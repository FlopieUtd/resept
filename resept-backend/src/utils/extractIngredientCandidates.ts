import { THRESHOLDS } from "./parseNodes.thresholds";
import type { TextNode } from "./extractTextNodes";
import { parseIngredient } from "./parseIngredient";
import type { IngredientLine } from "../../types";
import type {
  GroupWithMetadata,
  InternalIngredientGroup,
} from "./parseNodes.types";

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
      return { title: titleText, remainingNodes: group.nodes.slice(1) };
    }
  }
  return { title: undefined, remainingNodes: group.nodes };
};

const isTitleGroup = (group: InternalIngredientGroup): boolean => {
  if (group.nodes.length === 0) return false;
  const allText = group.nodes.map((n) => n.text.trim()).join(" ");
  const wordCount = allText.split(/\s+/).length;
  if (wordCount > THRESHOLDS.TITLE_MAX_WORDS) return false;
  const hasNumbers = /\d/.test(allText);
  const endsWithColon = /[:：]$/.test(allText.trim());
  const isShortPhrase = wordCount <= THRESHOLDS.TITLE_SHORT_PHRASE_WORDS;
  return endsWithColon || (isShortPhrase && !hasNumbers);
};

const findPrecedingTitleGroup = (
  currentGroup: InternalIngredientGroup,
  allGroups: InternalIngredientGroup[],
  currentIndex: number
): string | undefined => {
  const currentGroupDepth = currentGroup.nodes[0]?.depth ?? 0;
  for (
    let i = currentIndex - 1;
    i >= Math.max(0, currentIndex - THRESHOLDS.TITLE_SEARCH_RANGE);
    i--
  ) {
    const candidateGroup = allGroups[i];
    if (!candidateGroup || candidateGroup.nodes.length === 0) continue;
    const hasTitleElementType = candidateGroup.nodes.some((node) =>
      isTitleElementType(node.elementType)
    );
    if (!hasTitleElementType) continue;
    const candidateDepth = candidateGroup.nodes[0]?.depth ?? 0;
    const depthDiff = Math.abs(currentGroupDepth - candidateDepth);
    if (depthDiff > THRESHOLDS.TITLE_DEPTH_DIFF) continue;
    const titleText = candidateGroup.nodes
      .map((n) => n.text.trim())
      .join(" ")
      .replace(/[:：]$/, "")
      .trim();
    if (titleText) return titleText;
  }
  return undefined;
};

const meetsIngredientThreshold = (
  probability: number,
  maxProbability: number
): boolean => {
  const absolute = probability >= THRESHOLDS.INGREDIENT_ABSOLUTE;
  const relative =
    maxProbability > 0
      ? probability >= maxProbability * THRESHOLDS.INGREDIENT_RELATIVE
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

export const extractIngredientCandidates = (
  filteredResult: InternalIngredientGroup[],
  allGroups: InternalIngredientGroup[],
  maxIngredientProbability: number
): GroupWithMetadata[] => {
  const ingredientCandidateGroups: GroupWithMetadata[] = [];
  let currentTitle: string | undefined = undefined;

  for (let i = 0; i < filteredResult.length; i++) {
    const group = filteredResult[i];
    const originalIndex = findGroupIndexInResult(group, allGroups);
    if (isTitleGroup(group)) {
      const titleText = group.nodes
        .map((n) => n.text.trim())
        .join(" ")
        .replace(/[:：]$/, "")
        .trim();
      if (titleText) currentTitle = titleText;
    } else if (
      meetsIngredientThreshold(
        group.ingredientProbability,
        maxIngredientProbability
      )
    ) {
      const { title: withinGroupTitle, remainingNodes } =
        extractTitleFromGroup(group);
      const precedingGroupTitle = findPrecedingTitleGroup(
        group,
        allGroups,
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
        ingredientCandidateGroups.push({
          group,
          originalIndex,
          title: titleToUse,
          ingredientLines,
        });
        currentTitle = undefined;
      }
    }
  }

  if (ingredientCandidateGroups.length > 0) {
    const toLog = ingredientCandidateGroups.map((g) => ({
      title: g.title,
      lines: g.ingredientLines.map((l) => l.raw),
    }));
    console.log("Ingredient candidates:", toLog);
  } else {
    console.log("Ingredient candidates: []");
  }

  return ingredientCandidateGroups;
};
