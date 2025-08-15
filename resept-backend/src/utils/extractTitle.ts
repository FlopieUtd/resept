export const extractTitle = (html: string, url: string): string => {
  // Strip all non-alphabetical chars from URL and render in human readable format
  const urlTitle = extractTitleFromUrl(url);

  if (!urlTitle) {
    return "";
  }

  // First, try to find heading elements (h1, h2, h3, h4, h5, h6)
  const headingTags = ["h1", "h2", "h3", "h4", "h5", "h6"];

  for (const tag of headingTags) {
    const headingRegex = new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`, "gi");
    const headings = html.match(headingRegex);

    if (headings) {
      for (const heading of headings) {
        const headingText = heading
          .replace(new RegExp(`<${tag}[^>]*>|</${tag}>`, "gi"), "")
          .trim();

        // Check if URL title appears in this heading (case insensitive)
        if (headingText.toLowerCase().includes(urlTitle.toLowerCase())) {
          return headingText; // Return the heading content
        }
      }
    }
  }

  // If no heading contains the URL title, check other elements (but exclude title tag)
  const elementRegex = />([^<]+)</g;
  const textNodes = html.match(elementRegex);

  if (textNodes) {
    for (const textNode of textNodes) {
      const textContent = textNode.replace(/[<>]/g, "").trim();

      // Skip if this looks like it's from a title tag
      if (
        textContent.toLowerCase().includes("title") &&
        textContent.length < 100
      ) {
        continue;
      }

      // Check if URL title appears in this text node (case insensitive)
      if (textContent.toLowerCase().includes(urlTitle.toLowerCase())) {
        return textContent; // Return the content of the text node
      }
    }
  }

  // Fallback: return the URL title
  return urlTitle;
};

const extractTitleFromUrl = (url: string): string => {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;

    // Remove leading/trailing slashes and split by slashes
    const pathParts = pathname.replace(/^\/+|\/+$/g, "").split("/");

    // Get the last meaningful path segment
    const lastSegment = pathParts[pathParts.length - 1];

    if (!lastSegment || lastSegment === "") {
      return "";
    }

    // Strip all non-alphabetical characters and render in human readable format
    let title = lastSegment
      .replace(/[^a-zA-Z]/g, " ") // Replace all non-alphabetical chars with spaces
      .replace(/\s+/g, " ") // Replace multiple spaces with single space
      .trim()
      .replace(/\b\w/g, (char) => char.toUpperCase()); // Capitalize first letter of each word

    return title;
  } catch (error) {
    return "";
  }
};
