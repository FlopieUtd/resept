import express, { Request, Response, Router } from "express";
import {
  fetchHtmlFromUrl,
  extractRecipeFromHtml,
} from "./src/services/recipeExtractionService.js";
import { updateRecipe } from "./src/services/updateRecipe.js";
import { processAndSaveRecipe } from "./src/services/processAndSaveRecipe.js";
import { authenticateToken } from "./src/middleware/auth.js";
import { supabase } from "./src/lib/supabase.js";

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

// OAuth endpoint for extension authentication
router.get("/auth/extension", (req: Request, res: Response) => {
  const redirectUri = req.query.redirect_uri as string;

  if (!redirectUri) {
    return res.status(400).json({ error: "Missing redirect_uri parameter" });
  }

  // Redirect to the frontend for login, but the frontend will handle the token passing
  const frontendUrl = `${
    process.env.FRONTEND_URL || "http://localhost:5173"
  }/auth/extension?redirect_uri=${encodeURIComponent(redirectUri)}`;
  console.log("🔄 Redirecting to frontend:", frontendUrl);
  res.redirect(frontendUrl);
});

// Token refresh endpoint for extension
router.post("/auth/refresh", async (req: Request, res: Response) => {
  try {
    console.log("🔄 [REFRESH] Token refresh request received");
    const { refresh_token } = req.body;

    if (!refresh_token) {
      console.log("❌ [REFRESH] No refresh token provided");
      return res.status(400).json({ error: "Missing refresh_token" });
    }

    console.log(
      "🔑 [REFRESH] Refresh token (first 20 chars):",
      refresh_token.substring(0, 20) + "..."
    );

    // Use Supabase to refresh the token
    console.log("🌐 [REFRESH] Calling Supabase refreshSession");
    const {
      data: { session },
      error,
    } = await supabase.auth.refreshSession({
      refresh_token,
    });

    console.log("📊 [REFRESH] Supabase refresh response:", {
      hasSession: !!session,
      hasError: !!error,
      errorMessage: error?.message,
      hasAccessToken: !!session?.access_token,
      hasRefreshToken: !!session?.refresh_token,
      expiresAt: session?.expires_at,
    });

    if (error || !session) {
      console.error("❌ [REFRESH] Token refresh failed:", error);
      return res
        .status(403)
        .json({ error: "Invalid or expired refresh token" });
    }

    console.log("✅ [REFRESH] Token refresh successful");
    return res.status(200).json({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      expires_at: session.expires_at,
    });
  } catch (error) {
    console.error("💥 [REFRESH] Token refresh error:", error);
    return res.status(500).json({ error: "Token refresh failed" });
  }
});

router.post("/extract-from-url", async (req: any, res: Response) => {
  try {
    const { url } = req.body || {};
    if (!url) return res.status(400).json({ error: "Missing URL" });

    console.log("🌐 Extracting recipe from URL:", url);

    // Fetch HTML from URL
    const htmlResult = await fetchHtmlFromUrl(url);

    if (!htmlResult.success) {
      return res.status(404).json({ error: htmlResult.error });
    }

    console.log("HTML result", htmlResult);

    // Extract recipe data from HTML (no persistence)
    const extractionResult = await extractRecipeFromHtml(
      htmlResult.data!.html,
      url
    );

    if (!extractionResult.success) {
      return res.status(400).json({ error: extractionResult.error });
    }

    // Return the extracted recipe data to frontend
    return res.status(200).json(extractionResult.data);
  } catch (err) {
    console.error("💥 Error in extract-from-url:", err);
    return res.status(500).json({ error: "Extract from URL failed" });
  }
});

router.post(
  "/extract-from-html",
  authenticateToken,
  async (req: any, res: Response) => {
    try {
      console.log("🚀 EXTRACT-FROM-HTML ENDPOINT HIT!");
      console.log("📥 Request body:", req.body);

      const { html, url, metadata } = req.body || {};
      if (!html) return res.status(400).json({ error: "Missing HTML content" });

      console.log("📄 Processing recipe from HTML", {
        htmlLength: html.length,
        url: url || "not provided",
        metadata: metadata || "not provided",
        userId: req.user.id,
      });

      // Process and save the recipe directly
      const result = await processAndSaveRecipe({
        html: html,
        url: url,
        userId: req.user.id,
      });

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
