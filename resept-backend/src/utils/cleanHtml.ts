import * as cheerio from "cheerio";

export interface TextNode {
  depth: number;
  text: string;
}

const parseBrTags = (html: string): string => {
  // Split the HTML by <br> tags (case insensitive)
  const brRegex = /<br\s*\/?>/gi;
  const parts = html.split(brRegex);

  if (parts.length <= 1) {
    return html; // No br tags found
  }

  let result = "";

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i].trim();
    if (part) {
      // Wrap each part in a div
      result += `<div>${part}</div>`;
    }
  }

  return result;
};

export const cleanHtml = (html: string): TextNode[] => {
  try {
    const $ = cheerio.load(html);
    $("head").remove();
    $("style").remove();
    $("script").remove();
    $("img").remove();

    // Remove HTML comments using regex
    const htmlWithoutComments = $.html().replace(/<!--[\s\S]*?-->/g, "");
    // Normalize whitespace safely
    const normalizedHtml = htmlWithoutComments
      .replace(/\s+/g, " ") // Collapse multiple whitespace (including newlines) to single space
      .replace(/>\s+</g, "><") // Remove whitespace between tags
      .replace(/\s+>/g, ">") // Remove whitespace before closing tags
      .replace(/>\s+/g, ">") // Remove whitespace after opening tags
      .replace(/\n+/g, "") // Remove all newlines
      .replace(/\r+/g, "") // Remove all carriage returns
      .trim(); // Remove leading/trailing whitespace

    const $clean = cheerio.load(normalizedHtml);

    // Parse br tags by wrapping content before each br in its own div
    const htmlWithBrDivs = parseBrTags(normalizedHtml);
    const $cleanWithBrDivs = cheerio.load(htmlWithBrDivs);

    const textNodes: TextNode[] = [];

    const extractTextNodes = (element: cheerio.Element, depth: number = 0) => {
      const $el = $cleanWithBrDivs(element);

      // Get direct text content of this element
      const directText = $el
        .contents()
        .filter((_, node) => node.type === "text")
        .text()
        .trim();
      if (directText) {
        textNodes.push({ depth, text: directText });
      }

      // Recursively process child elements
      $el.children().each((_, child) => {
        extractTextNodes(child, depth + 1);
      });
    };

    extractTextNodes(
      $cleanWithBrDivs("body")[0] || $cleanWithBrDivs("html")[0]
    );

    const originalLength = html.length;
    const finalLength = normalizedHtml.length;
    const strippedPercent = (
      ((originalLength - finalLength) / originalLength) *
      100
    ).toFixed(1);
    console.log(
      `HTML stripped: ${strippedPercent}% (${originalLength} -> ${finalLength} chars)`
    );

    return textNodes;
  } catch (error) {
    console.error("Error cleaning HTML:", error);
    return [];
  }
};
