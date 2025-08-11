import * as cheerio from "cheerio";

export const extractTextContent = (html) => {
  try {
    const $ = cheerio.load(html);

    $("script").remove();
    $("style").remove();
    $("noscript").remove();
    $("iframe").remove();
    $("svg").remove();

    const textContent = $("body").text() || $("html").text();

    return textContent.replace(/\s+/g, " ").replace(/\n+/g, "\n").trim();
  } catch (error) {
    console.error("Error extracting text content:", error);
    return null;
  }
};
