import * as cheerio from "cheerio";
import { normalizeListItemPrefix } from "./normalizeText";

export interface TextNode {
  depth: number;
  text: string;
  elementType: string;
}

const parseBrTags = (html: string): string => {
  return html;
};

// Strip HTML tags from text
const stripHtmlTags = (text: string): string => {
  return text.replace(/<[^>]*>/g, "").trim();
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

    const collectInlineText = (element: cheerio.Element): string => {
      const parts: string[] = [];
      const $element = $cleanWithBrDivs(element);
      $element.contents().each((_, child) => {
        if (child.type === "text") {
          const data = ((child as any).data as string) || "";
          const cleaned = stripHtmlTags(data).trim();
          if (cleaned) {
            parts.push(cleaned);
          }
        } else if (child.type === "tag") {
          const name = (child as any).name?.toLowerCase();
          if (name === "br") {
            parts.push("\n");
          } else {
            const nested = collectInlineText(child as cheerio.Element);
            if (nested) {
              parts.push(nested);
            }
          }
        }
      });
      return parts
        .join(" ")
        .replace(/\s{2,}/g, " ")
        .trim();
    };

    const extractTextNodes = (element: cheerio.Element, depth: number = 0) => {
      const $el = $cleanWithBrDivs(element);

      const tagName = $el.prop("tagName")?.toLowerCase() || "unknown";
      if (tagName === "tr") {
        const children = $el.children();
        const childrenArr = children.toArray();
        const allCells =
          childrenArr.length > 0 &&
          childrenArr.every((n) => {
            const name = (n as any).name?.toLowerCase();
            return name === "td" || name === "th";
          });
        const hasColspan = childrenArr.some((n) => {
          const attribs = (n as any).attribs || {};
          return (
            attribs["colspan"] !== undefined && attribs["colspan"] !== null
          );
        });

        if (allCells && !hasColspan) {
          const cellTexts = childrenArr
            .map((n) => $cleanWithBrDivs(n).text().trim())
            .map((t) => stripHtmlTags(t))
            .filter((t) => t.length > 0);
          const joined = cellTexts.join(" ").trim();
          if (joined.length > 0) {
            textNodes.push({
              depth,
              text: normalizeListItemPrefix(joined),
              elementType: "tr",
            });
          }
          return;
        }
      }

      // Check if this element contains <br> tags
      const hasBrTags = $el.find("br").length > 0;
      const adjustedDepth = hasBrTags ? depth + 1 : depth;

      let buffer = "";
      $el.contents().each((_, node) => {
        if (node.type === "text") {
          const text = (node as any).data as string;
          if (text && text.trim()) {
            // Add space before text if buffer already has content
            if (buffer.trim()) {
              buffer += " " + stripHtmlTags(text);
            } else {
              buffer += stripHtmlTags(text);
            }
          }
        } else if (node.type === "tag") {
          const name = (node as any).name?.toLowerCase();
          if (name === "br") {
            const cleanedBuffer = buffer.replace(/\s{2,}/g, " ").trim();
            if (cleanedBuffer) {
              const parentTag = $el.prop("tagName")?.toLowerCase() || "unknown";
              textNodes.push({
                depth: adjustedDepth,
                text: normalizeListItemPrefix(stripHtmlTags(cleanedBuffer)),
                elementType: parentTag,
              });
            }
            buffer = "";
          } else if (name === "span" || name === "a") {
            const content = collectInlineText(node as cheerio.Element);
            if (content) {
              if (buffer && !buffer.endsWith(" ")) {
                buffer += " ";
              }
              buffer += content;
            }
          } else {
            const cleanedBuffer = buffer.replace(/\s{2,}/g, " ").trim();
            if (cleanedBuffer) {
              const parentTag = $el.prop("tagName")?.toLowerCase() || "unknown";
              textNodes.push({
                depth: adjustedDepth,
                text: normalizeListItemPrefix(stripHtmlTags(cleanedBuffer)),
                elementType: parentTag,
              });
              buffer = "";
            }
            extractTextNodes(node as unknown as cheerio.Element, depth + 1);
          }
        }
      });

      const cleanedBuffer = buffer.replace(/\s{2,}/g, " ").trim();
      if (cleanedBuffer) {
        const parentTag = $el.prop("tagName")?.toLowerCase() || "unknown";
        textNodes.push({
          depth: adjustedDepth,
          text: normalizeListItemPrefix(stripHtmlTags(cleanedBuffer)),
          elementType: parentTag,
        });
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

    return textNodes;
  } catch (error) {
    console.error("Error cleaning HTML:", error);
    return [];
  }
};
