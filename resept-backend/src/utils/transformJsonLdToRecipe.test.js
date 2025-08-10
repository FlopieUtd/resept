import { transformJsonLdToRecipe } from "./transformJsonLdToRecipe.js";

describe("transformJsonLdToRecipe", () => {
  describe("basic functionality", () => {
    it("should return null for null input", () => {
      const result = transformJsonLdToRecipe(null);
      expect(result).toBeNull();
    });

    it("should return null for undefined input", () => {
      const result = transformJsonLdToRecipe(undefined);
      expect(result).toBeNull();
    });

    it("should transform basic recipe data", () => {
      const jsonLdRecipe = {
        "@type": "Recipe",
        name: "Chocolate Chip Cookies",
        description: "Delicious homemade cookies",
        recipeYield: "24 cookies",
        recipeCategory: "Dessert",
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
        name: "Chocolate Chip Cookies",
        recipeYield: 24,
        recipeCategory: "Dessert",
        description: "Delicious homemade cookies",
        prepTime: "15m",
        cookTime: "12m",
        totalTime: "27m",
        recipeIngredients: [{ raw: "2 cups flour" }, { raw: "1 cup sugar" }],
        recipeInstructions: [
          { text: "Mix ingredients" },
          { text: "Bake at 350F" },
        ],
        sourceUrl: "https://example.com/recipe",
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

      const result = transformJsonLdToRecipe(jsonLdRecipe);

      expect(result.name).toBe("Pasta Carbonara");
      expect(result.description).toBe("Italian pasta dish");
    });

    it("should use first recipe if multiple recipes in @graph", () => {
      const jsonLdRecipe = {
        "@graph": [
          { "@type": "Recipe", name: "First Recipe" },
          { "@type": "Recipe", name: "Second Recipe" },
        ],
      };

      const result = transformJsonLdToRecipe(jsonLdRecipe);

      expect(result.name).toBe("First Recipe");
    });

    it("should fall back to root object if no recipe in @graph", () => {
      const jsonLdRecipe = {
        "@graph": [{ "@type": "WebPage", name: "Recipe Page" }],
        "@type": "Recipe",
        name: "Fallback Recipe",
      };

      const result = transformJsonLdToRecipe(jsonLdRecipe);

      expect(result.name).toBe("Fallback Recipe");
    });
  });

  describe("recipeYield handling", () => {
    it("should handle string yield with number", () => {
      const jsonLdRecipe = {
        "@type": "Recipe",
        name: "Test Recipe",
        recipeYield: "6 servings",
      };

      const result = transformJsonLdToRecipe(jsonLdRecipe);

      expect(result.recipeYield).toBe(6);
    });

    it("should handle array yield with string", () => {
      const jsonLdRecipe = {
        "@type": "Recipe",
        name: "Test Recipe",
        recipeYield: ["4 portions", "8 servings"],
      };

      const result = transformJsonLdToRecipe(jsonLdRecipe);

      expect(result.recipeYield).toBe(4);
    });

    it("should handle numeric yield", () => {
      const jsonLdRecipe = {
        "@type": "Recipe",
        name: "Test Recipe",
        recipeYield: 10,
      };

      const result = transformJsonLdToRecipe(jsonLdRecipe);

      expect(result.recipeYield).toBe(10);
    });

    it("should handle array yield with number", () => {
      const jsonLdRecipe = {
        "@type": "Recipe",
        name: "Test Recipe",
        recipeYield: [12, 24],
      };

      const result = transformJsonLdToRecipe(jsonLdRecipe);

      expect(result.recipeYield).toBe(12);
    });

    it("should default to 1 if no yield or invalid yield", () => {
      const jsonLdRecipe = {
        "@type": "Recipe",
        name: "Test Recipe",
      };

      const result = transformJsonLdToRecipe(jsonLdRecipe);

      expect(result.recipeYield).toBe(1);
    });

    it("should default to 1 for yield without numbers", () => {
      const jsonLdRecipe = {
        "@type": "Recipe",
        name: "Test Recipe",
        recipeYield: "servings",
      };

      const result = transformJsonLdToRecipe(jsonLdRecipe);

      expect(result.recipeYield).toBe(1);
    });
  });

  describe("recipeCategory handling", () => {
    it("should handle string category", () => {
      const jsonLdRecipe = {
        "@type": "Recipe",
        name: "Test Recipe",
        recipeCategory: "Main Course",
      };

      const result = transformJsonLdToRecipe(jsonLdRecipe);

      expect(result.recipeCategory).toBe("Main Course");
    });

    it("should handle array category", () => {
      const jsonLdRecipe = {
        "@type": "Recipe",
        name: "Test Recipe",
        recipeCategory: ["Dessert", "Sweet"],
      };

      const result = transformJsonLdToRecipe(jsonLdRecipe);

      expect(result.recipeCategory).toBe("Dessert");
    });

    it("should default to 'Recepten' if no category", () => {
      const jsonLdRecipe = {
        "@type": "Recipe",
        name: "Test Recipe",
      };

      const result = transformJsonLdToRecipe(jsonLdRecipe);

      expect(result.recipeCategory).toBe("Recepten");
    });

    it("should default to 'Recepten' for empty array category", () => {
      const jsonLdRecipe = {
        "@type": "Recipe",
        name: "Test Recipe",
        recipeCategory: [],
      };

      const result = transformJsonLdToRecipe(jsonLdRecipe);

      expect(result.recipeCategory).toBe("Recepten");
    });
  });

  describe("duration formatting", () => {
    it("should format minutes correctly", () => {
      const jsonLdRecipe = {
        "@type": "Recipe",
        name: "Test Recipe",
        prepTime: "PT30M",
      };

      const result = transformJsonLdToRecipe(jsonLdRecipe);

      expect(result.prepTime).toBe("30m");
    });

    it("should format hours correctly", () => {
      const jsonLdRecipe = {
        "@type": "Recipe",
        name: "Test Recipe",
        cookTime: "PT2H",
      };

      const result = transformJsonLdToRecipe(jsonLdRecipe);

      expect(result.cookTime).toBe("2u");
    });

    it("should format hours and minutes correctly", () => {
      const jsonLdRecipe = {
        "@type": "Recipe",
        name: "Test Recipe",
        totalTime: "PT1H30M",
      };

      const result = transformJsonLdToRecipe(jsonLdRecipe);

      expect(result.totalTime).toBe("1u 30m");
    });

    it("should format seconds correctly", () => {
      const jsonLdRecipe = {
        "@type": "Recipe",
        name: "Test Recipe",
        prepTime: "PT45S",
      };

      const result = transformJsonLdToRecipe(jsonLdRecipe);

      expect(result.prepTime).toBe("45s");
    });

    it("should handle complex duration", () => {
      const jsonLdRecipe = {
        "@type": "Recipe",
        name: "Test Recipe",
        totalTime: "PT2H15M30S",
      };

      const result = transformJsonLdToRecipe(jsonLdRecipe);

      expect(result.totalTime).toBe("2u 15m");
    });

    it("should return original string for invalid duration", () => {
      const jsonLdRecipe = {
        "@type": "Recipe",
        name: "Test Recipe",
        prepTime: "invalid",
      };

      const result = transformJsonLdToRecipe(jsonLdRecipe);

      expect(result.prepTime).toBe("invalid");
    });

    it("should return empty string for null duration", () => {
      const jsonLdRecipe = {
        "@type": "Recipe",
        name: "Test Recipe",
        prepTime: null,
      };

      const result = transformJsonLdToRecipe(jsonLdRecipe);

      expect(result.prepTime).toBe("");
    });
  });

  describe("ingredients handling", () => {
    it("should handle string ingredients", () => {
      const jsonLdRecipe = {
        "@type": "Recipe",
        name: "Test Recipe",
        recipeIngredient: ["2 eggs", "1 cup milk"],
      };

      const result = transformJsonLdToRecipe(jsonLdRecipe);

      expect(result.recipeIngredients).toEqual([
        { raw: "2 eggs" },
        { raw: "1 cup milk" },
      ]);
    });

    it("should handle empty ingredients array", () => {
      const jsonLdRecipe = {
        "@type": "Recipe",
        name: "Test Recipe",
        recipeIngredient: [],
      };

      const result = transformJsonLdToRecipe(jsonLdRecipe);

      expect(result.recipeIngredients).toEqual([]);
    });

    it("should handle missing ingredients", () => {
      const jsonLdRecipe = {
        "@type": "Recipe",
        name: "Test Recipe",
      };

      const result = transformJsonLdToRecipe(jsonLdRecipe);

      expect(result.recipeIngredients).toEqual([]);
    });
  });

  describe("instructions handling", () => {
    it("should handle text instructions", () => {
      const jsonLdRecipe = {
        "@type": "Recipe",
        name: "Test Recipe",
        recipeInstructions: [
          { text: "Step 1: Mix ingredients" },
          { text: "Step 2: Bake" },
        ],
      };

      const result = transformJsonLdToRecipe(jsonLdRecipe);

      expect(result.recipeInstructions).toEqual([
        { text: "Step 1: Mix ingredients" },
        { text: "Step 2: Bake" },
      ]);
    });

    it("should handle string instructions", () => {
      const jsonLdRecipe = {
        "@type": "Recipe",
        name: "Test Recipe",
        recipeInstructions: ["Mix", "Bake", "Serve"],
      };

      const result = transformJsonLdToRecipe(jsonLdRecipe);

      expect(result.recipeInstructions).toEqual([
        { text: "Mix" },
        { text: "Bake" },
        { text: "Serve" },
      ]);
    });

    it("should handle empty instructions array", () => {
      const jsonLdRecipe = {
        "@type": "Recipe",
        name: "Test Recipe",
        recipeInstructions: [],
      };

      const result = transformJsonLdToRecipe(jsonLdRecipe);

      expect(result.recipeInstructions).toEqual([]);
    });

    it("should handle missing instructions", () => {
      const jsonLdRecipe = {
        "@type": "Recipe",
        name: "Test Recipe",
      };

      const result = transformJsonLdToRecipe(jsonLdRecipe);

      expect(result.recipeInstructions).toEqual([]);
    });
  });

  describe("sourceUrl handling", () => {
    it("should use provided sourceUrl", () => {
      const jsonLdRecipe = {
        "@type": "Recipe",
        name: "Test Recipe",
      };

      const result = transformJsonLdToRecipe(
        jsonLdRecipe,
        "https://example.com/recipe"
      );

      expect(result.sourceUrl).toBe("https://example.com/recipe");
    });

    it("should default to empty string if no sourceUrl", () => {
      const jsonLdRecipe = {
        "@type": "Recipe",
        name: "Test Recipe",
      };

      const result = transformJsonLdToRecipe(jsonLdRecipe);

      expect(result.sourceUrl).toBe("");
    });

    it("should handle null sourceUrl", () => {
      const jsonLdRecipe = {
        "@type": "Recipe",
        name: "Test Recipe",
      };

      const result = transformJsonLdToRecipe(jsonLdRecipe, null);

      expect(result.sourceUrl).toBe("");
    });
  });

  describe("default values", () => {
    it("should provide sensible defaults for missing fields", () => {
      const jsonLdRecipe = {
        "@type": "Recipe",
      };

      const result = transformJsonLdToRecipe(jsonLdRecipe);

      expect(result).toEqual({
        name: "Untitled Recipe",
        recipeYield: 1,
        recipeCategory: "Recepten",
        description: "",
        prepTime: "",
        cookTime: "",
        totalTime: "",
        recipeIngredients: [],
        recipeInstructions: [],
        sourceUrl: "",
      });
    });
  });
});
