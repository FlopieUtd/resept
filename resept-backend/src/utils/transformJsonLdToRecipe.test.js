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
        recipe_yield: "24 cookies",
        recipe_category: "Dessert",
        prep_time: "PT15M",
        cook_time: "PT12M",
        total_time: "PT27M",
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
        source_url: "https://example.com/recipe",
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

      expect(result.title).toBe("Pasta Carbonara");
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

      expect(result.title).toBe("First Recipe");
    });

    it("should fall back to root object if no recipe in @graph", () => {
      const jsonLdRecipe = {
        "@graph": [{ "@type": "WebPage", name: "Recipe Page" }],
        "@type": "Recipe",
        name: "Fallback Recipe",
      };

      const result = transformJsonLdToRecipe(jsonLdRecipe);

      expect(result.title).toBe("Fallback Recipe");
    });
  });

  describe("recipe_yield handling", () => {
    it("should handle string yield with number", () => {
      const jsonLdRecipe = {
        "@type": "Recipe",
        name: "Test Recipe",
        recipe_yield: "6 servings",
      };

      const result = transformJsonLdToRecipe(jsonLdRecipe);

      expect(result.recipe_yield).toBe(6);
    });

    it("should handle array yield with string", () => {
      const jsonLdRecipe = {
        "@type": "Recipe",
        name: "Test Recipe",
        recipe_yield: ["4 portions", "8 servings"],
      };

      const result = transformJsonLdToRecipe(jsonLdRecipe);

      expect(result.recipe_yield).toBe(4);
    });

    it("should handle numeric yield", () => {
      const jsonLdRecipe = {
        "@type": "Recipe",
        name: "Test Recipe",
        recipe_yield: 10,
      };

      const result = transformJsonLdToRecipe(jsonLdRecipe);

      expect(result.recipe_yield).toBe(10);
    });

    it("should handle array yield with number", () => {
      const jsonLdRecipe = {
        "@type": "Recipe",
        name: "Test Recipe",
        recipe_yield: [12, 24],
      };

      const result = transformJsonLdToRecipe(jsonLdRecipe);

      expect(result.recipe_yield).toBe(12);
    });

    it("should handle camelCase recipeYield field", () => {
      const jsonLdRecipe = {
        "@type": "Recipe",
        name: "Test Recipe",
        recipeYield: "8 portions",
      };

      const result = transformJsonLdToRecipe(jsonLdRecipe);

      expect(result.recipe_yield).toBe(8);
    });

    it("should handle yield field", () => {
      const jsonLdRecipe = {
        "@type": "Recipe",
        name: "Test Recipe",
        yield: "12 servings",
      };

      const result = transformJsonLdToRecipe(jsonLdRecipe);

      expect(result.recipe_yield).toBe(12);
    });

    it("should handle servings field", () => {
      const jsonLdRecipe = {
        "@type": "Recipe",
        name: "Test Recipe",
        servings: "6 people",
      };

      const result = transformJsonLdToRecipe(jsonLdRecipe);

      expect(result.recipe_yield).toBe(6);
    });

    it("should handle recipeServings field", () => {
      const jsonLdRecipe = {
        "@type": "Recipe",
        name: "Test Recipe",
        recipeServings: "4 portions",
      };

      const result = transformJsonLdToRecipe(jsonLdRecipe);

      expect(result.recipe_yield).toBe(4);
    });

    it("should prioritize recipe_yield over other fields", () => {
      const jsonLdRecipe = {
        "@type": "Recipe",
        name: "Test Recipe",
        recipe_yield: "10 servings",
        recipeYield: "8 portions",
        yield: "6 people",
      };

      const result = transformJsonLdToRecipe(jsonLdRecipe);

      expect(result.recipe_yield).toBe(10);
    });

    it("should default to 1 if no yield or invalid yield", () => {
      const jsonLdRecipe = {
        "@type": "Recipe",
        name: "Test Recipe",
      };

      const result = transformJsonLdToRecipe(jsonLdRecipe);

      expect(result.recipe_yield).toBe(1);
    });

    it("should default to 1 for yield without numbers", () => {
      const jsonLdRecipe = {
        "@type": "Recipe",
        name: "Test Recipe",
        recipe_yield: "servings",
      };

      const result = transformJsonLdToRecipe(jsonLdRecipe);

      expect(result.recipe_yield).toBe(1);
    });
  });

  describe("recipe_category handling", () => {
    it("should handle string category", () => {
      const jsonLdRecipe = {
        "@type": "Recipe",
        name: "Test Recipe",
        recipe_category: "Main Course",
      };

      const result = transformJsonLdToRecipe(jsonLdRecipe);

      expect(result.recipe_category).toBe("Main Course");
    });

    it("should handle array category", () => {
      const jsonLdRecipe = {
        "@type": "Recipe",
        name: "Test Recipe",
        recipe_category: ["Dessert", "Sweet"],
      };

      const result = transformJsonLdToRecipe(jsonLdRecipe);

      expect(result.recipe_category).toBe("Dessert");
    });

    it("should default to 'Recepten' if no category", () => {
      const jsonLdRecipe = {
        "@type": "Recipe",
        name: "Test Recipe",
      };

      const result = transformJsonLdToRecipe(jsonLdRecipe);

      expect(result.recipe_category).toBe("Recepten");
    });

    it("should default to 'Recepten' for empty array category", () => {
      const jsonLdRecipe = {
        "@type": "Recipe",
        name: "Test Recipe",
        recipe_category: [],
      };

      const result = transformJsonLdToRecipe(jsonLdRecipe);

      expect(result.recipe_category).toBe("Recepten");
    });
  });

  describe("duration parsing", () => {
    it("should keep ISO 8601 format as is", () => {
      const jsonLdRecipe = {
        "@type": "Recipe",
        name: "Test Recipe",
        prep_time: "PT30M",
      };

      const result = transformJsonLdToRecipe(jsonLdRecipe);

      expect(result.prep_time).toBe("PT30M");
    });

    it("should convert human-readable hours to ISO format", () => {
      const jsonLdRecipe = {
        "@type": "Recipe",
        name: "Test Recipe",
        cook_time: "2h",
      };

      const result = transformJsonLdToRecipe(jsonLdRecipe);

      expect(result.cook_time).toBe("PT2H");
    });

    it("should convert human-readable minutes to ISO format", () => {
      const jsonLdRecipe = {
        "@type": "Recipe",
        name: "Test Recipe",
        total_time: "90m",
      };

      const result = transformJsonLdToRecipe(jsonLdRecipe);

      expect(result.total_time).toBe("PT90M");
    });

    it("should convert minutes without space to ISO format", () => {
      const jsonLdRecipe = {
        "@type": "Recipe",
        name: "Test Recipe",
        prep_time: "12m",
      };

      const result = transformJsonLdToRecipe(jsonLdRecipe);

      expect(result.prep_time).toBe("PT12M");
    });

    it("should convert human-readable seconds to ISO format", () => {
      const jsonLdRecipe = {
        "@type": "Recipe",
        name: "Test Recipe",
        prep_time: "45s",
      };

      const result = transformJsonLdToRecipe(jsonLdRecipe);

      expect(result.prep_time).toBe("PT45S");
    });

    it("should handle camelCase time fields from JSON-LD", () => {
      const jsonLdRecipe = {
        "@type": "Recipe",
        name: "Test Recipe",
        prepTime: "PT30M",
        cookTime: "PT45M",
        totalTime: "PT75M",
      };

      const result = transformJsonLdToRecipe(jsonLdRecipe);

      expect(result.prep_time).toBe("PT30M");
      expect(result.cook_time).toBe("PT45M");
      expect(result.total_time).toBe("PT75M");
    });

    it("should handle human-readable camelCase time fields", () => {
      const jsonLdRecipe = {
        "@type": "Recipe",
        name: "Test Recipe",
        prepTime: "15m",
        cookTime: "2h",
        totalTime: "2h 15m",
      };

      const result = transformJsonLdToRecipe(jsonLdRecipe);

      expect(result.prep_time).toBe("PT15M");
      expect(result.cook_time).toBe("PT2H");
      expect(result.total_time).toBe("PT2H15M");
    });

    it("should handle complex human-readable duration", () => {
      const jsonLdRecipe = {
        "@type": "Recipe",
        name: "Test Recipe",
        total_time: "2h 15m",
      };

      const result = transformJsonLdToRecipe(jsonLdRecipe);

      expect(result.total_time).toBe("PT2H15M");
    });

    it("should return PT0M for null duration", () => {
      const jsonLdRecipe = {
        "@type": "Recipe",
        name: "Test Recipe",
        prep_time: null,
      };

      const result = transformJsonLdToRecipe(jsonLdRecipe);

      expect(result.prep_time).toBe("PT0M");
    });

    it("should return PT0M for empty duration", () => {
      const jsonLdRecipe = {
        "@type": "Recipe",
        name: "Test Recipe",
        prep_time: "",
      };

      const result = transformJsonLdToRecipe(jsonLdRecipe);

      expect(result.prep_time).toBe("PT0M");
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

      expect(result.ingredients).toEqual([
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

      expect(result.ingredients).toEqual([]);
    });

    it("should handle missing ingredients", () => {
      const jsonLdRecipe = {
        "@type": "Recipe",
        name: "Test Recipe",
      };

      const result = transformJsonLdToRecipe(jsonLdRecipe);

      expect(result.ingredients).toEqual([]);
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

      expect(result.instructions).toEqual([
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

      expect(result.instructions).toEqual([
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

      expect(result.instructions).toEqual([]);
    });

    it("should handle missing instructions", () => {
      const jsonLdRecipe = {
        "@type": "Recipe",
        name: "Test Recipe",
      };

      const result = transformJsonLdToRecipe(jsonLdRecipe);

      expect(result.instructions).toEqual([]);
    });

    it("should handle nested instruction sections", () => {
      const jsonLdRecipe = {
        "@type": "Recipe",
        name: "Test Recipe",
        recipeInstructions: [
          {
            type: "section",
            name: "For the Dough",
            steps: ["Mix flour and water", "Knead for 10 minutes"],
          },
          {
            type: "section",
            name: "For the Filling",
            steps: ["Chop vegetables", "Season with salt and pepper"],
          },
        ],
      };

      const result = transformJsonLdToRecipe(jsonLdRecipe);

      expect(result.instructions).toEqual([
        {
          type: "section",
          name: "For the Dough",
          steps: [
            { text: "Mix flour and water" },
            { text: "Knead for 10 minutes" },
          ],
        },
        {
          type: "section",
          name: "For the Filling",
          steps: [
            { text: "Chop vegetables" },
            { text: "Season with salt and pepper" },
          ],
        },
      ]);
    });

    it("should handle mixed instruction types", () => {
      const jsonLdRecipe = {
        "@type": "Recipe",
        name: "Test Recipe",
        recipeInstructions: [
          { text: "Preheat oven to 350F" },
          {
            type: "section",
            name: "Prepare Ingredients",
            steps: ["Chop onions", "Dice tomatoes"],
          },
          { text: "Bake for 30 minutes" },
        ],
      };

      const result = transformJsonLdToRecipe(jsonLdRecipe);

      expect(result.instructions).toEqual([
        { text: "Preheat oven to 350F" },
        {
          type: "section",
          name: "Prepare Ingredients",
          steps: [{ text: "Chop onions" }, { text: "Dice tomatoes" }],
        },
        { text: "Bake for 30 minutes" },
      ]);
    });

    it("should handle HowToSection format (newer schema.org)", () => {
      const jsonLdRecipe = {
        "@type": "Recipe",
        name: "Test Recipe",
        recipeInstructions: [
          {
            "@type": "HowToSection",
            name: "Meat Sauce:",
            itemListElement: [
              {
                "@type": "HowToStep",
                text: "Heat oil in a large pot over high heat",
              },
              {
                "@type": "HowToStep",
                text: "Add garlic and onion, cook for 2-3 minutes",
              },
            ],
          },
          {
            "@type": "HowToSection",
            name: "Greek Béchamel:",
            itemListElement: [
              {
                "@type": "HowToStep",
                text: "Melt butter in a saucepan",
              },
            ],
          },
        ],
      };

      const result = transformJsonLdToRecipe(jsonLdRecipe);

      expect(result.instructions).toEqual([
        {
          type: "section",
          name: "Meat Sauce:",
          steps: [
            { text: "Heat oil in a large pot over high heat" },
            { text: "Add garlic and onion, cook for 2-3 minutes" },
          ],
        },
        {
          type: "section",
          name: "Greek Béchamel:",
          steps: [{ text: "Melt butter in a saucepan" }],
        },
      ]);
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

      expect(result.source_url).toBe("https://example.com/recipe");
    });

    it("should default to empty string if no sourceUrl", () => {
      const jsonLdRecipe = {
        "@type": "Recipe",
        name: "Test Recipe",
      };

      const result = transformJsonLdToRecipe(jsonLdRecipe);

      expect(result.source_url).toBe("");
    });

    it("should handle null sourceUrl", () => {
      const jsonLdRecipe = {
        "@type": "Recipe",
        name: "Test Recipe",
      };

      const result = transformJsonLdToRecipe(jsonLdRecipe, null);

      expect(result.source_url).toBe("");
    });
  });

  describe("default values", () => {
    it("should provide sensible defaults for missing fields", () => {
      const jsonLdRecipe = {
        "@type": "Recipe",
      };

      const result = transformJsonLdToRecipe(jsonLdRecipe);

      expect(result).toEqual({
        title: "Untitled Recipe",
        recipe_yield: 1,
        recipe_category: "Recepten",
        description: "",
        prep_time: "PT0M",
        cook_time: "PT0M",
        total_time: "PT0M",
        ingredients: [],
        instructions: [],
        source_url: "",
      });
    });
  });

  describe("HTML entity decoding", () => {
    it("should decode HTML entities in title", () => {
      const jsonLdRecipe = {
        "@type": "Recipe",
        name: "Pizza met courgette &amp; zongedroogde tomaat",
      };

      const result = transformJsonLdToRecipe(jsonLdRecipe);

      expect(result.title).toBe("Pizza met courgette & zongedroogde tomaat");
    });

    it("should decode HTML entities in description", () => {
      const jsonLdRecipe = {
        "@type": "Recipe",
        name: "Test Recipe",
        description:
          "Een van de lekkerste vegetarische pizza&#039;s die je kunt eten.",
      };

      const result = transformJsonLdToRecipe(jsonLdRecipe);

      expect(result.description).toBe(
        "Een van de lekkerste vegetarische pizza's die je kunt eten."
      );
    });

    it("should decode HTML entities in ingredients", () => {
      const jsonLdRecipe = {
        "@type": "Recipe",
        name: "Test Recipe",
        recipeIngredient: ["2 &amp;frac12; cups flour", "1 &lt; 2 cups sugar"],
      };

      const result = transformJsonLdToRecipe(jsonLdRecipe);

      expect(result.ingredients).toEqual([
        { raw: "2 &frac12; cups flour" },
        { raw: "1 < 2 cups sugar" },
      ]);
    });

    it("should decode HTML entities in instructions", () => {
      const jsonLdRecipe = {
        "@type": "Recipe",
        name: "Test Recipe",
        recipeInstructions: [
          { text: "Mix ingredients &amp; bake" },
          { text: "Let it cool &lt; 30 minutes" },
        ],
      };

      const result = transformJsonLdToRecipe(jsonLdRecipe);

      expect(result.instructions).toEqual([
        { text: "Mix ingredients & bake" },
        { text: "Let it cool < 30 minutes" },
      ]);
    });

    it("should handle non-string values gracefully", () => {
      const jsonLdRecipe = {
        "@type": "Recipe",
        name: null,
        description: undefined,
        recipeIngredient: [null, undefined, "valid ingredient"],
      };

      const result = transformJsonLdToRecipe(jsonLdRecipe);

      expect(result.title).toBe("Untitled Recipe");
      expect(result.description).toBe("");
      expect(result.ingredients).toEqual([{ raw: "valid ingredient" }]);
    });
  });
});
