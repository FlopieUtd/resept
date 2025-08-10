import express from "express";
import fetch from "node-fetch";
import { extractRecipeData, parseIngredientsWithLlm } from "./llmService.js";

const router = express.Router();

router.post("/extract", async (req, res) => {
  const startTime = Date.now();
  try {
    const { url } = req.body || {};
    if (!url) return res.status(400).json({ error: "Missing URL" });

    console.log(`🚀 Starting HTML extraction for: ${url}`);

    const fetchStart = Date.now();
    const html = await (
      await fetch(url, {
        redirect: "follow",
        headers: { "User-Agent": "Mozilla/5.0", Accept: "text/html" },
      })
    ).text();
    const fetchTime = Date.now() - fetchStart;
    console.log(`📥 HTML fetched in ${fetchTime}ms`);

    const extractStart = Date.now();
    const result = await extractRecipeData(html, url, true); // Enable ingredient parsing
    const extractTime = Date.now() - extractStart;
    console.log(`🔍 Recipe extraction completed in ${extractTime}ms`);

    const totalTime = Date.now() - startTime;
    console.log(`✅ Total time: ${totalTime}ms`);

    if (result.recipe) {
      // Direct recipe parsing successful
      return res.json({
        method: result.method,
        recipe: result.recipe,
        timing: {
          fetch: fetchTime,
          extract: extractTime,
          total: totalTime,
        },
      });
    } else {
      // HTML content extracted, needs LLM processing
      return res.json({
        method: result.method,
        htmlContent: result.htmlContent,
        needsLlm: true,
        extractionStats: result.extractionStats,
        timing: {
          fetch: fetchTime,
          extract: extractTime,
          total: totalTime,
        },
      });
    }
  } catch (err) {
    const totalTime = Date.now() - startTime;
    console.error(`💥 Error after ${totalTime}ms:`, err);
    return res.status(500).json({ error: "failed to extract HTML" });
  }
});

// Separate endpoint for ingredient parsing
router.post("/parse-ingredients", async (req, res) => {
  const startTime = Date.now();
  try {
    const { ingredients, model } = req.body || {};
    if (!ingredients || !Array.isArray(ingredients)) {
      return res
        .status(400)
        .json({ error: "Missing or invalid ingredients array" });
    }

    const modelName = model || "llama3.1:8b";
    console.log(
      `🔧 Parsing ${ingredients.length} ingredients with model: ${modelName}`
    );

    const parseStart = Date.now();
    const parsedIngredients = await parseIngredientsWithLlm(
      ingredients,
      modelName
    );
    const parseTime = Date.now() - parseStart;

    const totalTime = Date.now() - startTime;
    console.log(`✅ Ingredient parsing total time: ${totalTime}ms`);

    return res.json({
      ingredients: parsedIngredients,
      timing: {
        parse: parseTime,
        total: totalTime,
      },
    });
  } catch (err) {
    const totalTime = Date.now() - startTime;
    console.error(`💥 Ingredient parsing error after ${totalTime}ms:`, err);
    return res.status(500).json({ error: "Failed to parse ingredients" });
  }
});

export default router;
