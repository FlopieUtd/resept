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

describe("recipeExtractionService integration", () => {
  it("cinnamonRolls", async () => {
    const { html, expected } = readFixture("cinnamonRolls");
    const result = await extractRecipeFromHtml(
      html,
      "https://example.com/case"
    );

    expect(result.success).toBe(true);
    expect(result.data).toEqual(expected);
  });

  it("boeufStroganoff", async () => {
    const { html, expected } = readFixture("boeufStroganoff");
    const result = await extractRecipeFromHtml(
      html,
      "https://example.com/case"
    );

    expect(result.success).toBe(true);
    expect(result.data).toEqual(expected);
  });

  it("roti", async () => {
    const { html, expected } = readFixture("roti");
    const result = await extractRecipeFromHtml(
      html,
      "https://example.com/case"
    );

    expect(result.success).toBe(true);
    expect(result.data).toEqual(expected);
  });
});
