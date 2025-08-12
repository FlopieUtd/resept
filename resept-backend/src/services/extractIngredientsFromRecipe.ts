import { TextNode } from "../utils/cleanHTML";

interface IngredientsResult {
  success: boolean;
  error: string | null;
  ingredients: string[];
}

export const extractRecipeComponents = async (
  textNodes: TextNode[]
): Promise<{
  success: boolean;
  error: string | null;
  ingredients: string[];
  instructions: string[];
}> => {
  try {
    const structuredContent = textNodes
      .map((node) => `${"  ".repeat(node.depth)}${node.text}`)
      .join("\n");

    const ingredientsPrompt = `You are a recipe ingredient extractor. Extract ONLY the ingredient lines from this recipe text.

Text content:
${structuredContent}

Rules for identifying ingredients:
- Ingredients are typically food items, measurements, or cooking instructions
- They often start with numbers, fractions, or measurement words (1 cup, 2 tbsp, 1/2 tsp)
- Common ingredient words: flour, sugar, salt, eggs, milk, butter, oil, spices, herbs
- Only identify, dont translate, paraphrase, or change the text in any way.

Return ONLY the ingredient lines, one per line, with no additional text:`;

    const instructionsPrompt = `You are a recipe instruction extractor. Your task is to COPY ALL instruction text nodes exactly as they appear.

IMPORTANT: You must extract EVERY SINGLE instruction step. Missing even one step will cause failure.

Text content:
${structuredContent}

CRITICAL REQUIREMENTS:
- COPY ALL instruction text nodes EXACTLY as they appear in the input
- Do NOT add, remove, or change ANY characters
- Do NOT break up text into sentences
- Do NOT rephrase or summarize
- Each output line must be a 100% exact copy of an input text node
- You MUST extract ALL instruction steps, not just one or a few

Instructions are cooking steps that:
- Usually start with action verbs (mix, heat, combine, bake, cook, stir)
- May contain multiple sentences
- Include cooking times, temperatures, and techniques

Return format:
[EXACT_COPY_1]
[EXACT_COPY_2]
[EXACT_COPY_3]
... (continue for ALL instruction steps)

Remember: This is a COPY operation, not a rewrite operation. Extract EVERY instruction step.

WARNING: If you miss even ONE instruction step, the extraction will FAIL. You must find and copy ALL instruction text nodes from the input.

CRITICAL: Pay special attention to the FINAL step of the recipe. Do not stop until you have copied the very last instruction.`;

    const [ingredientsResponse, instructionsResponse] = await Promise.all([
      fetch("http://localhost:11434/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "llama3.2:3b",
          prompt: ingredientsPrompt,
          stream: false,
          options: { temperature: 0, num_predict: 600 },
        }),
      }),
      fetch("http://localhost:11434/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "llama3.2:3b",
          prompt: instructionsPrompt,
          stream: false,
          options: { temperature: 0, num_predict: 600 },
        }),
      }),
    ]);

    if (!ingredientsResponse.ok || !instructionsResponse.ok) {
      throw new Error("One or both LLM API calls failed");
    }

    const [ingredientsData, instructionsData] = await Promise.all([
      ingredientsResponse.json(),
      instructionsResponse.json(),
    ]);

    const ingredientsText = ingredientsData.response?.trim();
    const instructionsText = instructionsData.response?.trim();

    if (!ingredientsText || !instructionsText) {
      return {
        success: false,
        error: "Failed to extract recipe components",
        ingredients: [],
        instructions: [],
      };
    }

    const ingredients = ingredientsText
      .split("\n")
      .map((line: string) => line.trim())
      .filter((line: string) => line.length > 0);

    const instructions = instructionsText
      .split("\n")
      .map((line: string) => line.trim())
      .filter((line: string) => line.length > 0);

    // Validate that instructions are exact copies from input
    const inputTexts = textNodes.map((node) => node.text);
    const validatedInstructions = instructions.filter((instruction: string) => {
      const isExactCopy = inputTexts.some(
        (inputText) => inputText.trim() === instruction
      );
      if (!isExactCopy) {
        console.warn("LLM modified instruction text:", instruction);
        console.warn("Expected one of:", inputTexts);
      }
      return isExactCopy;
    });

    if (validatedInstructions.length === 0) {
      console.error("LLM failed to preserve any instruction text exactly");
      return {
        success: false,
        error: "LLM modified instruction text instead of copying exactly",
        ingredients,
        instructions: [],
      };
    }

    return {
      success: true,
      error: null,
      ingredients,
      instructions: validatedInstructions,
    };
  } catch (error: any) {
    console.error("Error in extractRecipeComponents:", error);
    return {
      success: false,
      error: error.message || "Failed to extract recipe components",
      ingredients: [],
      instructions: [],
    };
  }
};
