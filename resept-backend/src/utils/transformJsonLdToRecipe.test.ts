import { transformJsonLdToRecipe } from "./transformJsonLdToRecipe";

describe("transformJsonLdToRecipe", () => {
  describe("basic functionality", () => {
    it("should return null for null input", () => {
      const result = transformJsonLdToRecipe(
        null as any,
        "https://example.com"
      );
      expect(result).toBeNull();
    });

    it("should return null for undefined input", () => {
      const result = transformJsonLdToRecipe(
        undefined as any,
        "https://example.com"
      );
      expect(result).toBeNull();
    });

    it("should transform basic recipe data", () => {
      const jsonLdRecipe = {
        "@type": "Recipe",
        name: "Chocolate Chip Cookies",
        description: "Delicious homemade cookies",
        recipe_yield: "24 cookies",
        recipe_category: "Dessert",
        prepTime: "PT15M",
        cookTime: "PT12M",
        totalTime: "PT27M",
        recipeIngredient: ["2 cups flour", "1 cup sugar"],
        recipeInstructions: ["Mix ingredients", "Bake at 350F"],
      };

      const result = transformJsonLdToRecipe(
        jsonLdRecipe,
        "https://example.com/recipe"
      );

      expect(result).toEqual({
        title: "Chocolate Chip Cookies",
        recipe_yield: 24,
        recipe_category: "Dessert",
        description: "Delicious homemade cookies",
        prep_time: "PT15M",
        cook_time: "PT12M",
        total_time: "PT27M",
        ingredients: [{ raw: "2 cups flour" }, { raw: "1 cup sugar" }],
        instructions: [{ text: "Mix ingredients" }, { text: "Bake at 350F" }],
        source: "https://example.com/recipe",
      });
    });
  });

  describe("@graph structure handling", () => {
    it("should extract recipe from @graph structure", () => {
      const jsonLdRecipe = {
        "@graph": [
          { "@type": "WebPage", name: "Recipe Page" },
          {
            "@type": "Recipe",
            name: "Pasta Carbonara",
            description: "Italian pasta dish",
          },
        ],
      };

      const result = transformJsonLdToRecipe(
        jsonLdRecipe,
        "https://example.com"
      );

      expect(result!.title).toBe("Pasta Carbonara");
      expect(result!.description).toBe("Italian pasta dish");
    });

    it("should use first recipe if multiple recipes in @graph", () => {
      const jsonLdRecipe = {
        "@graph": [
          { "@type": "Recipe", name: "First Recipe" },
          { "@type": "Recipe", name: "Second Recipe" },
        ],
      };

      const result = transformJsonLdToRecipe(
        jsonLdRecipe,
        "https://example.com"
      );

      expect(result!.title).toBe("First Recipe");
    });

    it("should fall back to root object if no recipe in @graph", () => {
      const jsonLdRecipe = {
        "@graph": [{ "@type": "WebPage", name: "Recipe Page" }],
        "@type": "Recipe",
        name: "Fallback Recipe",
      };

      const result = transformJsonLdToRecipe(
        jsonLdRecipe,
        "https://example.com"
      );

      expect(result!.title).toBe("Fallback Recipe");
    });
  });

  describe("recipe_yield handling", () => {
    it("should handle string yield with number", () => {
      const jsonLdRecipe = {
        "@type": "Recipe",
        name: "Test Recipe",
        recipe_yield: "6 servings",
      };

      const result = transformJsonLdToRecipe(
        jsonLdRecipe,
        "https://example.com"
      );

      expect(result!.recipe_yield).toBe(6);
    });

    it("should handle numeric yield", () => {
      const jsonLdRecipe = {
        "@type": "Recipe",
        name: "Test Recipe",
        recipe_yield: 8,
      };

      const result = transformJsonLdToRecipe(
        jsonLdRecipe,
        "https://example.com"
      );

      expect(result!.recipe_yield).toBe(8);
    });

    it("should handle array yield", () => {
      const jsonLdRecipe = {
        "@type": "Recipe",
        name: "Test Recipe",
        recipe_yield: ["4 servings", "8 servings"],
      };

      const result = transformJsonLdToRecipe(
        jsonLdRecipe,
        "https://example.com"
      );

      expect(result!.recipe_yield).toBe(4);
    });

    it("should default to 1 if no yield found", () => {
      const jsonLdRecipe = {
        "@type": "Recipe",
        name: "Test Recipe",
      };

      const result = transformJsonLdToRecipe(
        jsonLdRecipe,
        "https://example.com"
      );

      expect(result!.recipe_yield).toBe(1);
    });
  });

  describe("time handling", () => {
    it("should handle ISO 8601 duration format", () => {
      const jsonLdRecipe = {
        "@type": "Recipe",
        name: "Test Recipe",
        prepTime: "PT30M",
        cookTime: "PT1H",
        totalTime: "PT1H30M",
      };

      const result = transformJsonLdToRecipe(
        jsonLdRecipe,
        "https://example.com"
      );

      expect(result!.prep_time).toBe("PT30M");
      expect(result!.cook_time).toBe("PT1H");
      expect(result!.total_time).toBe("PT1H30M");
    });

    it("should handle natural language time format", () => {
      const jsonLdRecipe = {
        "@type": "Recipe",
        name: "Test Recipe",
        prepTime: "30 minutes",
        cookTime: "1 hour",
        totalTime: "1 hour 30 minutes",
      };

      const result = transformJsonLdToRecipe(
        jsonLdRecipe,
        "https://example.com"
      );

      expect(result!.prep_time).toBe("PT0H30M");
      expect(result!.cook_time).toBe("PT1H0M");
      expect(result!.total_time).toBe("PT1H30M");
    });

    it("should default to PT0M if no time found", () => {
      const jsonLdRecipe = {
        "@type": "Recipe",
        name: "Test Recipe",
      };

      const result = transformJsonLdToRecipe(
        jsonLdRecipe,
        "https://example.com"
      );

      expect(result!.prep_time).toBe("PT0M");
      expect(result!.cook_time).toBe("PT0M");
      expect(result!.total_time).toBe("PT0M");
    });
  });

  describe("ingredients and instructions", () => {
    it("should handle empty ingredients and instructions", () => {
      const jsonLdRecipe = {
        "@type": "Recipe",
        name: "Test Recipe",
      };

      const result = transformJsonLdToRecipe(
        jsonLdRecipe,
        "https://example.com"
      );

      expect(result!.ingredients).toEqual([]);
      expect(result!.instructions).toEqual([]);
    });

    it("should handle single ingredient and instruction", () => {
      const jsonLdRecipe = {
        "@type": "Recipe",
        name: "Test Recipe",
        recipeIngredient: ["2 cups flour"],
        recipeInstructions: ["Mix ingredients"],
      };

      const result = transformJsonLdToRecipe(
        jsonLdRecipe,
        "https://example.com"
      );

      expect(result!.ingredients).toEqual([{ raw: "2 cups flour" }]);
      expect(result!.instructions).toEqual([{ text: "Mix ingredients" }]);
    });

    it("should handle arrays of ingredients and instructions", () => {
      const jsonLdRecipe = {
        "@type": "Recipe",
        name: "Test Recipe",
        recipeIngredient: ["2 cups flour", "1 cup sugar"],
        recipeInstructions: ["Mix dry ingredients", "Add wet ingredients"],
      };

      const result = transformJsonLdToRecipe(
        jsonLdRecipe,
        "https://example.com"
      );

      expect(result!.ingredients).toEqual([
        { raw: "2 cups flour" },
        { raw: "1 cup sugar" },
      ]);
      expect(result!.instructions).toEqual([
        { text: "Mix dry ingredients" },
        { text: "Add wet ingredients" },
      ]);
    });
  });

  describe("HTML entity decoding", () => {
    it("should decode HTML entities in text", () => {
      const jsonLdRecipe = {
        "@type": "Recipe",
        name: "Chocolate &amp; Vanilla Cookies",
        description: "Cookies with &quot;amazing&quot; flavor",
      };

      const result = transformJsonLdToRecipe(
        jsonLdRecipe,
        "https://example.com"
      );

      expect(result!.title).toBe("Chocolate & Vanilla Cookies");
      expect(result!.description).toBe('Cookies with "amazing" flavor');
    });
  });

  describe("fallback title handling", () => {
    it("should use name if title not found", () => {
      const jsonLdRecipe = {
        "@type": "Recipe",
        name: "Recipe Name",
      };

      const result = transformJsonLdToRecipe(
        jsonLdRecipe,
        "https://example.com"
      );

      expect(result!.title).toBe("Recipe Name");
    });

    it("should use headline if title and name not found", () => {
      const jsonLdRecipe = {
        "@type": "Recipe",
        headline: "Recipe Headline",
      };

      const result = transformJsonLdToRecipe(
        jsonLdRecipe,
        "https://example.com"
      );

      expect(result!.title).toBe("Recipe Headline");
    });

    it("should use default title if none found", () => {
      const jsonLdRecipe = {
        "@type": "Recipe",
      };

      const result = transformJsonLdToRecipe(
        jsonLdRecipe,
        "https://example.com"
      );

      expect(result!.title).toBe("Untitled Recipe");
    });
  });
});
