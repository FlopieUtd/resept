# Recipe Extraction Flow

1. **HTML validation**

   - Reject empty or >10MB payloads in `extractRecipeFromHtml`.

2. **Fast fetch pipeline (when scraping from URLs)**

   - `fetchHtmlFromUrl` grabs HTML directly.
   - `detectSiteType` decides if we must re-render via headless browser.
   - `fetchHtmlWithBrowser` (optional) rehydrates tricky pages (JS-heavy, lazy content).

3. **Primary extraction path (`processRecipeExtraction`)**

   1. Compute a fallback title immediately with `extractTitle`.
   2. Run `detectRecipeJsonLd`; if JSON-LD exists:
      - `transformJsonLdToRecipe` converts to our schema.
      - Validate it has both ingredients + instructions; return early if so.
   3. If JSON-LD is missing or incomplete, fall back to heuristic parsing.

4. **Heuristic parsing stack**

   - `extractTextNodes` strips markup and normalizes text nodes (depth + element type preserved).
   - `parseNodes` consumes those nodes:
     - `groupNodesByDepthAndType` clusters sibling nodes.
     - `calculateProbabilities` scores groups for ingredient vs instruction likelihood.
     - `extractInstructions` chooses the most instruction-like cluster, flattening to ordered steps.
     - `extractIngredientCandidates` finds ingredient blocks, tracks structural group titles, and parses each line via `parseIngredient`.
     - `clusterIngredientGroups` merges candidate blocks into the final `IngredientGroup[]`.

5. **Metadata extraction**

   - `extractYield` estimates `recipe_yield` from the text nodes.
   - (Future slots for prep/cook/total when not provided by JSON-LD.)

6. **Quality gate**

   - `processRecipeExtraction` requires both max ingredient and instruction probabilities ≥ 0.3.
   - If the threshold fails: return `{ success: false, error: "No recipe detected" }`.

7. **Response assembly**
   - On success, return `{ title, ingredients, instructions, recipe_yield }`, using:
     - JSON-LD values when available, otherwise the heuristic results.
     - `fallbackTitle` whenever the heuristics are used.

This file should be kept in sync with changes to `processRecipeExtraction` and the helper utilities it orchestrates.
