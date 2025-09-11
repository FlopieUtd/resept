import express, { Request, Response, Router } from "express";
import { extractRecipeFromUrl, extractRecipeFromHtml } from "./src/services/recipeExtractionService.js";
import { updateRecipe } from "./src/services/updateRecipe.js";

const router: Router = express.Router();

interface ExtractFromUrlRequest {
  url: string;
}

interface ExtractFromHtmlRequest {
  html: string;
  url?: string;
  metadata?: {
    userAgent?: string;
    timestamp?: string;
    extensionVersion?: string;
  };
}

interface UpdateRecipeRequest {
  recipeId: string;
  updates: any;
}

// Test endpoint to verify routing
router.get("/test", (req: Request, res: Response) => {
  console.log("🧪 GET /test hit");
  res.json({ message: "Backend routing is working!" });
});

router.post(
  "/extract-from-url",
  async (req: Request<{}, {}, ExtractFromUrlRequest>, res: Response) => {
    try {
      const { url } = req.body || {};
      if (!url) return res.status(400).json({ error: "Missing URL" });

      const result = await extractRecipeFromUrl(url);

      if (result.success) {
        return res.status(200).json(result.data);
      } else {
        return res.status(404).json({ error: result.error });
      }
    } catch (err) {
      console.error("💥 Error in extract-from-url:", err);
      return res.status(500).json({ error: "Extract from URL failed" });
    }
  }
);

router.post(
  "/extract-from-html",
  async (req: Request<{}, {}, ExtractFromHtmlRequest>, res: Response) => {
    try {
      const { html, url, metadata } = req.body || {};
      if (!html) return res.status(400).json({ error: "Missing HTML content" });

      console.log("📄 Extracting recipe from HTML", {
        htmlLength: html.length,
        url: url || "not provided",
        metadata: metadata || "not provided"
      });

      const result = await extractRecipeFromHtml(html, url);

      if (result.success) {
        return res.status(200).json(result.data);
      } else {
        return res.status(400).json({ error: result.error });
      }
    } catch (err) {
      console.error("💥 Error in extract-from-html:", err);
      return res.status(500).json({ error: "Extract from HTML failed" });
    }
  }
);

router.put(
  "/recipe/:recipeId",
  async (
    req: Request<{ recipeId: string }, {}, UpdateRecipeRequest>,
    res: Response
  ) => {
    console.log("🔧 PUT /recipe/:recipeId hit");
    console.log("Params:", req.params);
    console.log("Body:", req.body);

    try {
      const { recipeId } = req.params;
      const { updates } = req.body || {};

      if (!updates) return res.status(400).json({ error: "Missing updates" });

      const result = await updateRecipe({ recipeId, updates });

      if (result.success) {
        return res.status(200).json(result.data);
      } else {
        return res.status(400).json({ error: result.error });
      }
    } catch (err) {
      console.error("💥 Error in update recipe:", err);
      return res.status(500).json({ error: "Update failed" });
    }
  }
);

export default router;
