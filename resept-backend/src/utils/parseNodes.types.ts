import type { TextNode } from "./extractTextNodes";
import type { IngredientLine } from "../../types";

export interface InternalIngredientGroup {
  ingredientProbability: number;
  instructionsProbability: number;
  nodes: TextNode[];
  originalIndex: number;
}

export interface InstructionNode {
  node: TextNode;
  depth: number;
  originalIndex: number;
  probability: number;
}

export interface GroupWithMetadata {
  group: InternalIngredientGroup;
  originalIndex: number;
  title: string | undefined;
  ingredientLines: IngredientLine[];
}
