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
            if (buffer.trim()) {
              const parentTag = $el.prop("tagName")?.toLowerCase() || "unknown";
              textNodes.push({
                depth: adjustedDepth,
                text: normalizeListItemPrefix(stripHtmlTags(buffer.trim())),
                elementType: parentTag,
              });
            }
            buffer = "";
          } else if (name === "span") {
            // For span elements, just extract their text content and add to buffer
            // without creating new text nodes or changing depth
            const $span = $cleanWithBrDivs(node);
            const spanText = $span.text().trim();
            if (spanText) {
              // Add space before span content if buffer is not empty
              if (buffer.trim()) {
                buffer += " " + stripHtmlTags(spanText);
              } else {
                buffer += stripHtmlTags(spanText);
              }
            }
          } else {
            if (buffer.trim()) {
              const parentTag = $el.prop("tagName")?.toLowerCase() || "unknown";
              textNodes.push({
                depth: adjustedDepth,
                text: normalizeListItemPrefix(stripHtmlTags(buffer.trim())),
                elementType: parentTag,
              });
              buffer = "";
            }
            extractTextNodes(node as unknown as cheerio.Element, depth + 1);
          }
        }
      });

      if (buffer.trim()) {
        const parentTag = $el.prop("tagName")?.toLowerCase() || "unknown";
        textNodes.push({
          depth: adjustedDepth,
          text: normalizeListItemPrefix(stripHtmlTags(buffer.trim())),
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
