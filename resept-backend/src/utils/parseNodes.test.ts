import { parseNodes } from "./parseNodes";
import type { TextNode } from "./extractTextNodes";

describe("parseNodes", () => {
  it("template: text nodes in -> structured output out", () => {
    const nodes: TextNode[] = [
      { depth: 0, elementType: "li", text: "2 cups flour" },
      { depth: 0, elementType: "li", text: "1 tsp salt" },
      {
        depth: 0,
        elementType: "p",
        text: "Mix the dry ingredients thoroughly until evenly combined and no lumps remain.",
      },
      {
        depth: 0,
        elementType: "p",
        text: "Bake for 25 minutes, then let it cool on a rack before slicing and serving.",
      },
    ];

    const result = parseNodes(nodes);

    expect(Array.isArray(result.ingredients)).toBe(true);
    expect(Array.isArray(result.instructions)).toBe(true);
    expect(typeof result.maxIngredientProbability).toBe("number");
    expect(typeof result.maxInstructionsProbability).toBe("number");

    expect(result.ingredients.length).toBeGreaterThan(0);
    expect(result.instructions.length).toBeGreaterThan(0);

    const ingredientRaws = result.ingredients.flatMap((g) =>
      g.ingredients.map((i) => i.raw)
    );
    const instructionTexts = result.instructions.flatMap((g) =>
      g.instructions.map((i) => i.text)
    );

    expect(ingredientRaws).toEqual(["2 cups flour", "1 tsp salt"]);
    expect(instructionTexts).toEqual([
      "Mix the dry ingredients thoroughly until evenly combined and no lumps remain.",
      "Bake for 25 minutes, then let it cool on a rack before slicing and serving.",
    ]);
  });
});
