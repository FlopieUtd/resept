import { readFileSync } from "fs";
import { resolve } from "path";
import { extractRecipeFromHtml } from "../../services/recipeExtractionService";

const readFixture = (name: string) => {
  const base = resolve(__dirname, "../fixtures");
  const html = readFileSync(resolve(base, `${name}.html`), "utf8");
  const expected = JSON.parse(
    readFileSync(resolve(base, `${name}.expected.json`), "utf8")
  );
  return { html, expected } as const;
};

const testCases = [
  {
    name: "cinnamonRolls",
    expectedSuccess: true,
    compareFull: true,
  },
  {
    name: "boeufStroganoff",
    expectedSuccess: true,
    compareFull: true,
  },
  {
    name: "roti",
    expectedSuccess: true,
    compareFull: true,
  },
  {
    name: "aubergineParmigiana",
    expectedSuccess: true,
    compareFull: true,
  },
  {
    name: "notARecipe",
    expectedSuccess: false,
    compareFull: false,
  },
  {
    name: "turkishPide",
    expectedSuccess: true,
    compareFull: true,
  },
  {
    name: "samosas",
    expectedSuccess: true,
    compareFull: false,
    compareIngredients: true,
  },
];

describe("recipeExtractionService integration", () => {
  it.each(testCases)(
    "$name",
    async ({ name, expectedSuccess, compareFull, compareIngredients }) => {
      const { html, expected } = readFixture(name);
      const result = await extractRecipeFromHtml(
        html,
        "https://example.com/case"
      );

      expect(result.success).toBe(expectedSuccess);

      if (!expectedSuccess) {
        expect(result.data).toEqual(null);
      } else if (compareIngredients) {
        expect(result.data?.ingredients).toEqual(expected.ingredients);
      } else if (compareFull) {
        expect(result.data).toEqual(expected);
      }
    }
  );
});
