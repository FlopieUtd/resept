import express, { Request, Response, Router } from "express";
import {
  fetchHtmlFromUrl,
  extractRecipeFromHtml,
} from "./src/services/recipeExtractionService";
import { updateRecipe } from "./src/services/updateRecipe";
import { processAndSaveRecipe } from "./src/services/processAndSaveRecipe";
import { authenticateToken } from "./src/middleware/auth";
import { supabase } from "./src/lib/supabase";

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
  res.json({ message: "Backend routing is working!" });
});

// OAuth endpoint for extension authentication
router.get("/auth/extension", (req: Request, res: Response) => {
  const redirectUri = req.query.redirect_uri as string;
  const originalUrl = req.query.original_url as string;
  const originalTabId = req.query.original_tab_id as string;

  if (!redirectUri) {
    return res.status(400).json({ error: "Missing redirect_uri parameter" });
  }

  // Always redirect to frontend - frontend will check if user is logged in
  // and either get tokens directly or redirect to login
  let frontendUrl = `${
    process.env.FRONTEND_URL || "http://localhost:5173"
  }/auth/extension?redirect_uri=${encodeURIComponent(redirectUri)}`;

  if (originalUrl) {
    frontendUrl += `&original_url=${encodeURIComponent(originalUrl)}`;
  }

  if (originalTabId) {
    frontendUrl += `&original_tab_id=${encodeURIComponent(originalTabId)}`;
  }

  res.redirect(frontendUrl);
});

// Endpoint to generate tokens for extension from a valid session
// Frontend sends the access_token and refresh_token from its Supabase session
// Returns tokens as JSON (frontend handles opening extension URL)
router.post("/auth/extension/tokens", async (req: Request, res: Response) => {
  try {
    const { access_token, refresh_token, expires_at } = req.body;

    if (!access_token) {
      return res.status(400).json({ error: "Access token required" });
    }

    // Verify the token with Supabase
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(access_token);

    if (error || !user) {
      return res.status(403).json({ error: "Invalid or expired token" });
    }

    // Return tokens as JSON - frontend will handle opening extension URL
    return res.status(200).json({
      access_token: access_token,
      refresh_token: refresh_token || null,
      expires_at: expires_at || null,
    });
  } catch (error: any) {
    return res.status(500).json({ error: "Token generation failed" });
  }
});

// Token refresh endpoint for extension
router.post("/auth/refresh", async (req: Request, res: Response) => {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      return res.status(400).json({ error: "Missing refresh_token" });
    }

    const {
      data: { session },
      error,
    } = await supabase.auth.refreshSession({
      refresh_token,
    });

    if (error || !session) {
      const isTokenNotFound =
        error?.code === "refresh_token_not_found" ||
        error?.message?.includes("Refresh Token Not Found");

      return res.status(403).json({
        error: error?.message || "Invalid or expired refresh token",
        code: error?.code || "refresh_token_invalid",
        clearTokens: isTokenNotFound,
      });
    }

    return res.status(200).json({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      expires_at: session.expires_at,
    });
  } catch (error: any) {
    return res.status(500).json({ error: "Token refresh failed" });
  }
});

router.post("/extract-from-url", async (req: any, res: Response) => {
  try {
    const { url } = req.body || {};
    if (!url) return res.status(400).json({ error: "Missing URL" });

    // Fetch HTML from URL
    const htmlResult = await fetchHtmlFromUrl(url);

    if (!htmlResult.success) {
      return res.status(404).json({ error: htmlResult.error });
    }

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
    return res.status(500).json({ error: "Extract from URL failed" });
  }
});

router.post(
  "/extract-from-html",
  authenticateToken,
  async (req: any, res: Response) => {
    try {
      const { html, url, metadata } = req.body || {};
      if (!html) return res.status(400).json({ error: "Missing HTML content" });

      // Process and save the recipe directly
      const result = await processAndSaveRecipe({
        html: html,
        url: url,
        userId: req.user?.id,
      });

      if (result.success) {
        return res.status(200).json(result.data);
      } else {
        // Check if it's a "No recipe detected" error
        if (result.error === "No recipe detected") {
          return res.status(200).json({
            success: false,
            error: "No recipe detected",
            redirectTo: "/no-recipe",
          });
        }
        return res.status(400).json({ error: result.error });
      }
    } catch (err) {
      console.error("Error in extract-from-html:", err);
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
      return res.status(500).json({ error: "Update failed" });
    }
  }
);

export default router;
