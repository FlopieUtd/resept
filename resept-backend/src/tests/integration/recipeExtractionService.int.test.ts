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
  // {
  //   name: "cinnamonRolls",
  //   expectedSuccess: true,
  // },
  // {
  //   name: "boeufStroganoff",
  //   expectedSuccess: true,
  // },
  // {
  //   name: "roti",
  //   expectedSuccess: true,
  // },
  // {
  //   name: "aubergineParmigiana",
  //   expectedSuccess: true,
  // },
  // {
  //   name: "notARecipe",
  //   expectedSuccess: false,
  // },
  // {
  //   name: "turkishPide",
  //   expectedSuccess: true,
  // },
  {
    name: "samosas",
    expectedSuccess: true,
  },
];

describe("recipeExtractionService integration", () => {
  it.each(testCases)("$name", async ({ name, expectedSuccess }) => {
    const { html, expected } = readFixture(name);
    const result = await extractRecipeFromHtml(
      html,
      "https://example.com/case"
    );

    expect(result.success).toBe(expectedSuccess);

    console.log(JSON.stringify(result.data, null, 2));

    if (!expectedSuccess) {
      expect(result.data).toEqual(null);
    } else {
      expect(result.data).toEqual(expected);
    }
  });
});
