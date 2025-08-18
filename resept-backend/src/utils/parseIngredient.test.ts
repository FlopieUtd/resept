import { parseIngredient } from "./parseIngredient";

describe("parseIngredient", () => {
  describe("amount parsing", () => {
    it("should parse whole numbers", () => {
      const result = parseIngredient("2 cups flour");
      expect(result.amount).toBe(2);
    });

    it("should parse fractions", () => {
      const result = parseIngredient("1/2 cup sugar");
      expect(result.amount).toBe(0.5);
    });

    it("should parse mixed numbers", () => {
      const result = parseIngredient("1 1/2 cups milk");
      expect(result.amount).toBe(1.5);
    });

    it("should parse decimals", () => {
      const result = parseIngredient("0.25 teaspoon salt");
      expect(result.amount).toBe(0.25);
    });

    it("should parse written numbers", () => {
      const result = parseIngredient("two eggs");
      expect(result.amount).toBe(2);
    });

    it("should parse Dutch written numbers", () => {
      const result = parseIngredient("drie eetlepels olie");
      expect(result.amount).toBe(3);
    });
  });

  describe("edge cases", () => {
    it("should handle empty string", () => {
      const result = parseIngredient("");
      expect(result.amount).toBe(1);
    });

    it("should handle whitespace", () => {
      const result = parseIngredient("  2  cups  flour  ");
      expect(result.amount).toBe(2);
    });

    it("should handle complex ingredient names", () => {
      const result = parseIngredient("1/2 cup extra virgin olive oil");
      expect(result.amount).toBe(0.5);
    });
  });
});
