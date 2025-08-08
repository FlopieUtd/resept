export const Unit = {
  GRAM: "GRAM",
  KILOGRAM: "KILOGRAM",
  MILLILITER: "MILLILITER",
  LITER: "LITER",
  PIECE: "PIECE",
  TABLESPOON: "TABLESPOON",
  TEASPOON: "TEASPOON",
  CLOVE: "CLOVE",
  SPRIG: "SPRIG",
  CAN: "CAN",
  CUP: "CUP",
  PINCH: "PINCH",
  TO_TASTE: "TO_TASTE",
} as const;

export const IngredientType = {
  VEGETARIAN: "VEGETARIAN",
  VEGAN: "VEGAN",
  MEAT: "MEAT",
  FISH: "FISH",
} as const;

export type Unit = (typeof Unit)[keyof typeof Unit];
export type IngredientType =
  (typeof IngredientType)[keyof typeof IngredientType];

export interface IngredientLine {
  raw: string;
  name?: string;
  amount?: number;
  amountMax?: number;
  unit?: Unit;
  qualifier?: string;
  note?: string;
  ingredientType?: IngredientType;
}
