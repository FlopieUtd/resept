export const COOKING_IMPERATIVES: Record<
  string,
  {
    dutch: string | string[];
    english: string | string[];
  }
> = {
  heat: {
    dutch: ["verwarm", "verhit"],
    english: "heat",
  },
  stir: {
    dutch: "roer",
    english: "stir",
  },
  stirfry: {
    dutch: "roerbak",
    english: "stir-fry",
  },
  chop: {
    dutch: "snipper",
    english: "chop",
  },
  cook: {
    dutch: "kook",
    english: "cook",
  },
  bake: {
    dutch: "bak",
    english: "bake",
  },
  mix: {
    dutch: ["mix", "meng"],
    english: ["mix", "toss", "blend"],
  },
  beat: {
    dutch: "klop",
    english: "beat",
  },
  pour: {
    dutch: "giet",
    english: "pour",
  },
  add: {
    dutch: "voeg",
    english: "add",
  },
  cut: {
    dutch: ["snijd", "snij"],
    english: "cut",
  },
  peel: {
    dutch: "schil",
    english: "peel",
  },
  grate: {
    dutch: "rasp",
    english: "grate",
  },
  knead: {
    dutch: "kneed",
    english: "knead",
  },
  sprinkle: {
    dutch: "besprenkel",
    english: "sprinkle",
  },
  brush: {
    dutch: "bestrijk",
    english: "brush",
  },
  cover: {
    dutch: "bedek",
    english: "cover",
  },
  divide: {
    dutch: "verdeel",
    english: "divide",
  },
  squeeze: {
    dutch: "pers",
    english: "squeeze",
  },
  scoop: {
    dutch: "schep",
    english: "scoop",
  },
  tear: {
    dutch: "scheur",
    english: "tear",
  },
  pluck: {
    dutch: "pluk",
    english: "pluck",
  },
  wash: {
    dutch: "was",
    english: "wash",
  },
  dry: {
    dutch: "droog",
    english: ["dry", "pat"],
  },
  cool: {
    dutch: "koel",
    english: "cool",
  },
  freeze: {
    dutch: "vries",
    english: "freeze",
  },
  thaw: {
    dutch: "ontdooi",
    english: "thaw",
  },
  marinate: {
    dutch: "marineer",
    english: "marinate",
  },
  taste: {
    dutch: "proef",
    english: "taste",
  },
  serve: {
    dutch: "serveer",
    english: "serve",
  },
  garnish: {
    dutch: ["garneer", "versier"],
    english: "garnish",
  },
  simmer: {
    dutch: "laat",
    english: "simmer",
  },
  boil: {
    dutch: "kook",
    english: "boil",
  },
  fry: {
    dutch: "bak",
    english: "fry",
  },
  grill: {
    dutch: "grill",
    english: "grill",
  },
  roast: {
    dutch: ["braad", "rooster"],
    english: "roast",
  },
  steam: {
    dutch: "stoom",
    english: "steam",
  },
  whisk: {
    dutch: "klop",
    english: "whisk",
  },
  fold: {
    dutch: "vouw",
    english: "fold",
  },
  spread: {
    dutch: "smeer",
    english: "spread",
  },
  season: {
    dutch: "kruid",
    english: "season",
  },
  decorate: {
    dutch: "decoreren",
    english: "decorate",
  },
  finish: {
    dutch: "maak",
    english: "finish",
  },
  grease: {
    dutch: "vet",
    english: "grease",
  },
  put: {
    dutch: ["zet", "leg", "doe"],
    english: "put",
  },
  turn: {
    dutch: "keer",
    english: "turn",
  },
  break: {
    dutch: "breek",
    english: "break",
  },
  use: {
    dutch: "gebruik",
    english: ["use", "using"],
  },
  remove: {
    dutch: "verwijder",
    english: "remove",
  },
  bring: {
    dutch: "breng",
    english: ["bring", "transfer", "move", "place"],
  },
  rinse: {
    dutch: "spoel",
    english: "rinse",
  },
  set: {
    dutch: "zet",
    english: "set",
  },
  drain: {
    dutch: "spoel",
    english: "drain",
  },
  return: {
    english: ["return"],
    dutch: [],
  },
  to: {
    english: ["to"],
    dutch: ["om"],
  },
  start: {
    english: ["start", "begin"],
    dutch: ["begin"],
  },
  repeat: {
    english: ["repeat"],
    dutch: ["herhaal"],
  },
};

export const YIELD_KEYWORDS: Record<
  string,
  {
    dutch: string | string[];
    english: string | string[];
  }
> = {
  yield: {
    dutch: [
      "portie",
      "porties",
      "personen",
      "persoon",
      "voor",
      "stuk",
      "stuks",
    ],
    english: [
      "yield",
      "serves",
      "serving",
      "servings",
      "person",
      "people",
      "for",
    ],
  },
};

export const RECIPE_KEYWORDS: Record<
  string,
  {
    dutch: string | string[];
    english: string | string[];
  }
> = {
  recipe: {
    dutch: ["recept"],
    english: ["recipe"],
  },
};

export const UNIT_KEYWORDS: Record<
  string,
  {
    dutch: string | string[];
    english: string | string[];
  }
> = {
  gram: {
    dutch: ["g", "gr", "gram"],
    english: ["g", "gr", "gram", "grams"],
  },
  kilogram: {
    dutch: ["kg", "kilo", "kilogram"],
    english: ["kg", "kilo", "kilo gram"],
  },
  milliliter: {
    dutch: ["ml", "milliliter"],
    english: ["ml", "milliliter"],
  },
  liter: {
    dutch: ["l", "liter"],
    english: ["l", "liter", "liters"],
  },
  teaspoon: {
    dutch: ["tl", "theelepel"],
    english: ["tsp", "teaspoon", "teaspoons"],
  },
  tablespoon: {
    dutch: ["el", "eetlepel"],
    english: ["tbsp", "tablespoon", "tablespoons"],
  },
  piece: {
    dutch: ["st", "stuk", "stuks"],
    english: ["pcs", "piece", "pieces"],
  },
  clove: {
    dutch: ["teen", "teentje"],
    english: ["clove", "cloves"],
  },
  pinch: {
    dutch: ["mespunt", "mespuntje"],
    english: ["pinch", "pinches"],
  },
  ounce: {
    english: ["oz", "ounce", "ounces"],
    dutch: ["ons"],
  },
  cups: {
    dutch: [],
    english: ["cup", "cups"],
  },
};

export const NUTRITION_KEYWORDS: Record<
  string,
  {
    dutch: string | string[];
    english: string | string[];
  }
> = {
  cholesterol: {
    dutch: ["cholesterol"],
    english: ["cholesterol"],
  },
  carbohydrate: {
    dutch: ["koolhydraat", "koolhydraten"],
    english: ["carbohydrate", "carbohydrates"],
  },
  saturated: {
    dutch: ["verzadigd", "verzadigde"],
    english: ["saturated"],
  },
  unsaturated: {
    dutch: ["onverzadigd", "onverzadigde"],
    english: ["unsaturated"],
  },
  sodium: {
    dutch: ["natrium", "zout"],
    english: ["sodium", "salt"],
  },
  fiber: {
    dutch: ["vezel", "vezels"],
    english: ["fiber", "fibre", "fibers", "fibres"],
  },
};

export const WRITTEN_NUMBERS: Record<string, number> = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
  twenty: 20,
  een: 1,
  twee: 2,
  drie: 3,
  vier: 4,
  vijf: 5,
  zes: 6,
  zeven: 7,
  acht: 8,
  negen: 9,
  tien: 10,
  elf: 11,
  twaalf: 12,
  dertien: 13,
  veertien: 14,
  vijftien: 15,
  zestien: 16,
  zeventien: 17,
  achttien: 18,
  negentien: 19,
  twintig: 20,
};
