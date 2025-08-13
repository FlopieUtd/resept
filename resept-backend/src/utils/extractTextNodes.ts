import * as cheerio from "cheerio";

export interface TextNode {
  depth: number;
  text: string;
}

const parseBrTags = (html: string): string => {
  return html;
};

export const extractTextNodes = (html: string): TextNode[] => {
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

    const htmlWithBrDivs = parseBrTags(normalizedHtml);
    const $cleanWithBrDivs = cheerio.load(htmlWithBrDivs);

    const textNodes: TextNode[] = [];

    const extractTextNodes = (element: cheerio.Element, depth: number = 0) => {
      const $el = $cleanWithBrDivs(element);

      // Check if this element contains <br> tags
      const hasBrTags = $el.find("br").length > 0;
      const adjustedDepth = hasBrTags ? depth + 1 : depth;

      let buffer = "";
      $el.contents().each((_, node) => {
        if (node.type === "text") {
          const text = (node as any).data as string;
          if (text && text.trim()) {
            buffer += text;
          }
        } else if (node.type === "tag") {
          const name = (node as any).name?.toLowerCase();
          if (name === "br") {
            if (buffer.trim()) {
              textNodes.push({ depth: adjustedDepth, text: buffer.trim() });
            }
            buffer = "";
          } else {
            if (buffer.trim()) {
              textNodes.push({ depth: adjustedDepth, text: buffer.trim() });
              buffer = "";
            }
            extractTextNodes(node as unknown as cheerio.Element, depth + 1);
          }
        }
      });

      if (buffer.trim()) {
        textNodes.push({ depth: adjustedDepth, text: buffer.trim() });
      }
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

export const cleanHtml = (html: string): TextNode[] => {
  return extractTextNodes(html);
};
