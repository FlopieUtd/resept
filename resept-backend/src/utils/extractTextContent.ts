import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";

export const extractTextContent = (html: string): string | null => {
  try {
    const dom = new JSDOM(html);
    const reader = new Readability(dom.window.document);
    const article = reader.parse();

    if (article?.textContent) {
      return article.textContent.trim();
    }

    // Fallback to basic text extraction if Readability fails
    const fallbackText = dom.window.document.body?.textContent || "";
    return fallbackText.replace(/\s+/g, " ").trim();
  } catch (error) {
    console.error("Error extracting text content:", error);
    return null;
  }
};

export const cleanHtml = (html: string): string => {
  try {
    const dom = new JSDOM(html);

    // Remove images before Readability processing
    const images = dom.window.document.querySelectorAll("img");
    images.forEach((img) => img.remove());

    const reader = new Readability(dom.window.document);
    const article = reader.parse();

    if (article?.content) {
      return article.content;
    }

    // Fallback to original HTML if Readability fails
    return html;
  } catch (error) {
    console.error("Error cleaning HTML:", error);
    return html;
  }
};
