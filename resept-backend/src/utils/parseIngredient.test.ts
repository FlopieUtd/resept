import { parseIngredient } from "./parseIngredient.js";

describe("parseIngredient", () => {
  describe("amount parsing", () => {
    it("should parse whole numbers", () => {
      const result = parseIngredient("2 cups flour");
      expect(result.amount).toBe(2);
      expect(result.rawWithoutAmount).toBe("cups flour");
    });

    it("should parse fractions", () => {
      const result = parseIngredient("1/2 cup sugar");
      expect(result.amount).toBe(0.5);
      expect(result.rawWithoutAmount).toBe("cup sugar");
    });

    it("should parse mixed numbers", () => {
      const result = parseIngredient("1 1/2 cups milk");
      expect(result.amount).toBe(1.5);
      expect(result.rawWithoutAmount).toBe("cups milk");
    });

    it("should parse decimals", () => {
      const result = parseIngredient("0.25 teaspoon salt");
      expect(result.amount).toBe(0.25);
      expect(result.rawWithoutAmount).toBe("teaspoon salt");
    });

    it("should parse European decimals", () => {
      const result = parseIngredient("0,5 cup sugar");
      expect(result.amount).toBe(0.5);
      expect(result.rawWithoutAmount).toBe("cup sugar");
    });

    it("should parse larger European decimals", () => {
      const result = parseIngredient("1,25 cups flour");
      expect(result.amount).toBe(1.25);
      expect(result.rawWithoutAmount).toBe("cups flour");
    });

    it("should parse written numbers", () => {
      const result = parseIngredient("two eggs");
      expect(result.amount).toBe(2);
      expect(result.rawWithoutAmount).toBe("eggs");
    });

    it("should parse Dutch written numbers", () => {
      const result = parseIngredient("drie eetlepels olie");
      expect(result.amount).toBe(3);
      expect(result.rawWithoutAmount).toBe("eetlepels olie");
    });

    it("should parse ranges", () => {
      const result = parseIngredient("1-2 chili peppers");
      expect(result.amount).toBe(1);
      expect(result.rawWithoutAmount).toBe("chili peppers");
      expect(result.amountMax).toBe(2);
    });

    it("should parse larger ranges", () => {
      const result = parseIngredient("3-4 cups flour");
      expect(result.amount).toBe(3);
      expect(result.rawWithoutAmount).toBe("cups flour");
      expect(result.amountMax).toBe(4);
    });

    it("should parse the specific example: 1-2 chili peppers", () => {
      const result = parseIngredient("1-2 chili peppers");
      expect(result.amount).toBe(1);
      expect(result.rawWithoutAmount).toBe("chili peppers");
      expect(result.amountMax).toBe(2);
    });

    it("should parse Dutch ranges", () => {
      const result = parseIngredient("3 a 4 bananen");
      expect(result.amount).toBe(3);
      expect(result.rawWithoutAmount).toBe("bananen");
      expect(result.amountMax).toBe(4);
    });

    it("should parse Dutch ranges with larger numbers", () => {
      const result = parseIngredient("1 a 2 eetlepels olie");
      expect(result.amount).toBe(1);
      expect(result.rawWithoutAmount).toBe("eetlepels olie");
      expect(result.amountMax).toBe(2);
    });

    it("should parse Dutch ranges with accent", () => {
      const result = parseIngredient("3 à 4 bananen");
      expect(result.amount).toBe(3);
      expect(result.rawWithoutAmount).toBe("bananen");
      expect(result.amountMax).toBe(4);
    });

    it("should parse Dutch ranges with accent and larger numbers", () => {
      const result = parseIngredient("2 à 3 theelepels zout");
      expect(result.amount).toBe(2);
      expect(result.rawWithoutAmount).toBe("theelepels zout");
      expect(result.amountMax).toBe(3);
    });

    it("should parse Unicode fractions", () => {
      const result = parseIngredient("¼ cup sugar");
      expect(result.amount).toBe(0.25);
      expect(result.rawWithoutAmount).toBe("cup sugar");
    });

    it("should parse mixed numbers with Unicode fractions", () => {
      const result = parseIngredient("12 ¼ oz flour");
      expect(result.amount).toBe(12.25);
      expect(result.rawWithoutAmount).toBe("oz flour");
    });

    it("should parse mixed numbers with half Unicode fraction", () => {
      const result = parseIngredient("1 ½ cups milk");
      expect(result.amount).toBe(1.5);
      expect(result.rawWithoutAmount).toBe("cups milk");
    });

    it("should parse mixed numbers with three-quarters Unicode fraction", () => {
      const result = parseIngredient("2 ¾ teaspoons salt");
      expect(result.amount).toBe(2.75);
      expect(result.rawWithoutAmount).toBe("teaspoons salt");
    });

    it("should parse standalone Unicode fractions", () => {
      const result = parseIngredient("½ teaspoon vanilla");
      expect(result.amount).toBe(0.5);
      expect(result.rawWithoutAmount).toBe("teaspoon vanilla");
    });

    it("should parse ranges with encoded hyphens", () => {
      const result = parseIngredient("1 &#8211; 2 chili peppers");
      expect(result.amount).toBe(1);
      expect(result.rawWithoutAmount).toBe("chili peppers");
      expect(result.amountMax).toBe(2);
    });

    it("should parse ranges with other encoded characters", () => {
      const result = parseIngredient("1 &#8208; 2 chili peppers");
      expect(result.amount).toBe(1);
      expect(result.rawWithoutAmount).toBe("chili peppers");
      expect(result.amountMax).toBe(2);
    });

    it("should decode HTML entities in ingredient names", () => {
      const result = parseIngredient("1 cup Annie Chun&#8217;s noodles");
      expect(result.amount).toBe(1);
      expect(result.rawWithoutAmount).toBe("cup Annie Chun's noodles");
    });
  });

  describe("edge cases", () => {
    it("should handle empty string", () => {
      const result = parseIngredient("");
      expect(result.amount).toBeUndefined();
      expect(result.rawWithoutAmount).toBe("");
    });

    it("should handle whitespace", () => {
      const result = parseIngredient("  2  cups  flour  ");
      expect(result.amount).toBe(2);
      expect(result.rawWithoutAmount).toBe("cups  flour");
    });

    it("should handle complex ingredient names", () => {
      const result = parseIngredient("1/2 cup extra virgin olive oil");
      expect(result.amount).toBe(0.5);
      expect(result.rawWithoutAmount).toBe("cup extra virgin olive oil");
    });

    it("should handle ingredients without amounts", () => {
      const result = parseIngredient("salt to taste");
      expect(result.amount).toBeUndefined();
      expect(result.rawWithoutAmount).toBe("salt to taste");
    });

    it("should handle ingredients like 'salt and pepper'", () => {
      const result = parseIngredient("salt and pepper");
      expect(result.amount).toBeUndefined();
      expect(result.rawWithoutAmount).toBe("salt and pepper");
    });
  });
});
