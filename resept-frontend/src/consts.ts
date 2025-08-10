import { Unit } from "./types";

export const UNIT_LABEL_MAP = {
  [Unit.GRAM]: "gram",
  [Unit.KILOGRAM]: "kilogram",
  [Unit.MILLILITER]: "milliliter",
  [Unit.LITER]: "liter",
  [Unit.PIECE]: "",
  [Unit.TABLESPOON]: "eetlepel",
  [Unit.TEASPOON]: "theelepel",
  [Unit.CLOVE]: "tenen",
  [Unit.SPRIG]: "takjes",
  [Unit.CAN]: "blikken",
  [Unit.CUP]: "kop",
  [Unit.PINCH]: "snufje",
  [Unit.TO_TASTE]: "naar smaak",
} as const;
