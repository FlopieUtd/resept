import { extractIngredientsFromRecipe } from "./extractIngredientsFromRecipe";
import { TextNode } from "../utils/extractTextNodes";

// Mock fetch globally
global.fetch = jest.fn();

describe("extractIngredientsFromRecipe", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should extract ingredients successfully from HTML content", async () => {
    const mockResponse = {
      response:
        "2 cups all-purpose flour\n1 cup sugar\n3 large eggs\n1 tsp vanilla extract",
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const textNodes: TextNode[] = [
      { depth: 0, text: "Ingredients" },
      { depth: 1, text: "2 cups all-purpose flour" },
      { depth: 1, text: "1 cup sugar" },
      { depth: 1, text: "3 large eggs" },
      { depth: 1, text: "1 tsp vanilla extract" },
    ];

    const result = await extractIngredientsFromRecipe(textNodes);

    expect(result.success).toBe(true);
    expect(result.error).toBeNull();
    expect(result.ingredients).toEqual([
      "2 cups all-purpose flour",
      "1 cup sugar",
      "3 large eggs",
      "1 tsp vanilla extract",
    ]);
  });

  it("should handle no ingredients found", async () => {
    const mockResponse = {
      response: "NO_INGREDIENTS_FOUND",
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const textNodes: TextNode[] = [{ depth: 0, text: "This is not a recipe" }];

    const result = await extractIngredientsFromRecipe(textNodes);

    expect(result.success).toBe(false);
    expect(result.error).toBe("No ingredients found in the HTML content");
    expect(result.ingredients).toEqual([]);
  });

  it("should handle empty response", async () => {
    const mockResponse = {
      response: "",
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const textNodes: TextNode[] = [{ depth: 0, text: "Some content" }];

    const result = await extractIngredientsFromRecipe(textNodes);

    expect(result.success).toBe(false);
    expect(result.error).toBe("No valid ingredients extracted");
    expect(result.ingredients).toEqual([]);
  });

  it("should handle API error", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    const textNodes: TextNode[] = [{ depth: 0, text: "Some content" }];

    const result = await extractIngredientsFromRecipe(textNodes);

    expect(result.success).toBe(false);
    expect(result.error).toBe("HTTP error! status: 500");
    expect(result.ingredients).toEqual([]);
  });

  it("should handle Ollama not running", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 404,
    });

    const textNodes: TextNode[] = [{ depth: 0, text: "Some content" }];

    const result = await extractIngredientsFromRecipe(textNodes);

    expect(result.success).toBe(false);
    expect(result.error).toBe(
      "Ollama API not found. Please ensure Ollama is running on localhost:11434"
    );
    expect(result.ingredients).toEqual([]);
  });
});
