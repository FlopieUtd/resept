import { detectRecipeJsonLd } from "./detectRecipeJsonLd";

describe("recipeDetector", () => {
  beforeEach(() => {
    console.log = jest.fn(); // Mock console.log
  });

  describe("detectRecipeJsonLd", () => {
    it("should detect single recipe JSON-LD", () => {
      const html = `
        <html>
          <head>
            <script type="application/ld+json">
              {
                "@type": "Recipe",
                "name": "Chocolate Cake",
                "ingredients": ["flour", "sugar", "cocoa"]
              }
            </script>
          </head>
          <body>Content</body>
        </html>
      `;

      const result = detectRecipeJsonLd(html);

      expect(result).toHaveLength(1);
      expect(result![0]).toEqual({
        "@type": "Recipe",
        name: "Chocolate Cake",
        ingredients: ["flour", "sugar", "cocoa"],
      });
      expect(console.log).toHaveBeenCalledWith(
        "Step 2: Detecting recipe JSON-LD..."
      );
      expect(console.log).toHaveBeenCalledWith(
        "Recipe JSON-LD found in script 1"
      );
      expect(console.log).toHaveBeenCalledWith("Found 1 recipe(s) in JSON-LD");
    });

    it("should detect multiple recipe JSON-LD scripts", () => {
      const html = `
        <html>
          <head>
            <script type="application/ld+json">
              {
                "@type": "Recipe",
                "name": "Recipe 1"
              }
            </script>
            <script type="application/ld+json">
              {
                "@type": "Recipe",
                "name": "Recipe 2"
              }
            </script>
          </head>
          <body>Content</body>
        </html>
      `;

      const result = detectRecipeJsonLd(html);

      expect(result).toHaveLength(2);
      expect(result![0].name).toBe("Recipe 1");
      expect(result![1].name).toBe("Recipe 2");
      expect(console.log).toHaveBeenCalledWith("Found 2 recipe(s) in JSON-LD");
    });

    it("should detect recipe in @graph structure", () => {
      const html = `
        <html>
          <head>
            <script type="application/ld+json">
              {
                "@graph": [
                  {
                    "@type": "WebPage",
                    "name": "Page"
                  },
                  {
                    "@type": "Recipe",
                    "name": "Hidden Recipe"
                  }
                ]
              }
            </script>
          </head>
          <body>Content</body>
        </html>
      `;

      const result = detectRecipeJsonLd(html);

      expect(result).toHaveLength(1);
      expect((result![0]["@graph"] as any)[1].name).toBe("Hidden Recipe");
      expect(console.log).toHaveBeenCalledWith("Found 1 recipe(s) in JSON-LD");
    });

    it("should handle array @type", () => {
      const html = `
        <html>
          <head>
            <script type="application/ld+json">
              {
                "@type": ["Thing", "Recipe"],
                "name": "Array Type Recipe"
              }
            </script>
          </head>
          <body>Content</body>
        </html>
      `;

      const result = detectRecipeJsonLd(html);

      expect(result).toHaveLength(1);
      expect(result![0].name).toBe("Array Type Recipe");
    });

    it("should return null when no JSON-LD scripts found", () => {
      const html = `
        <html>
          <head>
            <script>console.log("Not JSON-LD");</script>
          </head>
          <body>Content</body>
        </html>
      `;

      const result = detectRecipeJsonLd(html);

      expect(result).toBeNull();
      expect(console.log).toHaveBeenCalledWith("No JSON-LD scripts found");
    });

    it("should return null when no recipe JSON-LD found", () => {
      const html = `
        <html>
          <head>
            <script type="application/ld+json">
              {
                "@type": "WebPage",
                "name": "Not a Recipe"
              }
            </script>
          </head>
          <body>Content</body>
        </html>
      `;

      const result = detectRecipeJsonLd(html);

      expect(result).toBeNull();
      expect(console.log).toHaveBeenCalledWith("No recipe JSON-LD found");
    });

    it("should handle malformed JSON gracefully", () => {
      const html = `
        <html>
          <head>
            <script type="application/ld+json">
              {
                "@type": "Recipe",
                "name": "Valid Recipe"
              }
            </script>
            <script type="application/ld+json">
              {
                "@type": "Recipe",
                "name": "Invalid JSON
              }
            </script>
          </head>
          <body>Content</body>
        </html>
      `;

      const result = detectRecipeJsonLd(html);

      expect(result).toHaveLength(1);
      expect(result![0].name).toBe("Valid Recipe");
      expect(console.log).toHaveBeenCalledWith(
        "Failed to parse JSON-LD script 2:",
        expect.stringContaining("Bad control character")
      );
    });

    it("should handle empty JSON-LD scripts", () => {
      const html = `
        <html>
          <head>
            <script type="application/ld+json"></script>
            <script type="application/ld+json">
              {
                "@type": "Recipe",
                "name": "Valid Recipe"
              }
            </script>
          </head>
          <body>Content</body>
        </html>
      `;

      const result = detectRecipeJsonLd(html);

      expect(result).toHaveLength(1);
      expect(result![0].name).toBe("Valid Recipe");
    });
  });
});
