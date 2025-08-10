import express from "express";
import { extractRecipe } from "./src/services/extractRecipe.js";

const router = express.Router();

router.post("/extract", async (req, res) => {
  try {
    const { url } = req.body || {};
    if (!url) return res.status(400).json({ error: "Missing URL" });

    const result = await extractRecipe(url);
    return res.json(result);
  } catch (err) {
    console.error("💥 Error in extract:", err);
    return res.status(500).json({ error: "Extract failed" });
  }
});

export default router;
