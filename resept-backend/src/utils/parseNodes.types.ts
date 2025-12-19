import type { TextNode } from "./extractTextNodes";

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
