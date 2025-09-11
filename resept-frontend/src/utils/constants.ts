import { Language } from '../types';

export const API_URL = import.meta.env.VITE_API_URL || "https://resept-rb0j.onrender.com";

export const LABELS = {
  [Language.NL]: {
    ingredients: "Ingrediënten",
    instructions: "Instructies",
    prep: "Bereiding",
    cook: "Kooktijd",
    total: "Totaal",
    source: "Bron",
    personSingular: "persoon",
    personPlural: "personen",
    editRecipe: "Bewerk recept",
  },
  [Language.EN]: {
    ingredients: "Ingredients",
    instructions: "Instructions",
    prep: "Prep",
    cook: "Cook",
    total: "Total",
    source: "Source",
    personSingular: "person",
    personPlural: "people",
    editRecipe: "Edit recipe",
  },
  [Language.UNKNOWN]: {
    ingredients: "Ingredients",
    instructions: "Instructions",
    prep: "Prep",
    cook: "Cook",
    total: "Total",
    source: "Source",
    personSingular: "person",
    personPlural: "people",
    editRecipe: "Edit recipe",
  },
} as const;