import { YIELD_KEYWORDS } from "./constants";

export const extractYield = (html: string): number => {
  // Look for yield information in HTML content
  const yieldPatterns = [
    // Pattern: "4 personen" or "4 personen"
    /(\d+)\s*(?:personen?|persoon)/gi,
    // Pattern: "voor 4 personen" or "voor 4 personen"
    /voor\s+(\d+)\s*(?:personen?|persoon)/gi,
    // Pattern: "4 porties" or "4 porties"
    /(\d+)\s*(?:porties?|portie)/gi,
    // Pattern: "maakt 4 stuks" or "maakt 4 stuks"
    /maakt\s+(\d+)\s*(?:stuks?|stuk)/gi,
    // Pattern: "yields 4 servings" or "yields 4 servings"
    /yields?\s+(\d+)\s*(?:servings?|serving)/gi,
    // Pattern: "4 servings" or "4 servings"
    /(\d+)\s*(?:servings?|serving)/gi,
    // Pattern: "serves 4" or "serves 4"
    /serves?\s+(\d+)/gi,
    // Pattern: "for 4 people" or "for 4 people"
    /for\s+(\d+)\s*(?:people?|person)/gi,
  ];

  for (const pattern of yieldPatterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      const number = parseInt(match[1], 10);
      if (number > 0 && number < 100) {
        // Reasonable range for recipe yield
        return number;
      }
    }
  }

  // Look for yield keywords with numbers in proximity
  const allYieldKeywords = [
    ...YIELD_KEYWORDS.yield.dutch,
    ...YIELD_KEYWORDS.yield.english,
    ...YIELD_KEYWORDS.yield_numbers.dutch,
    ...YIELD_KEYWORDS.yield_numbers.english,
  ];

  for (const keyword of allYieldKeywords) {
    const keywordRegex = new RegExp(keyword, "gi");
    const matches = html.match(keywordRegex);

    if (matches) {
      // Look for numbers near the keyword
      const contextRegex = new RegExp(
        `[^\\d]*${keyword}[^\\d]*(\\d+)[^\\d]*`,
        "gi"
      );
      const contextMatches = html.match(contextRegex);

      if (contextMatches) {
        for (const contextMatch of contextMatches) {
          const numberMatch = contextMatch.match(/(\d+)/);
          if (numberMatch) {
            const number = parseInt(numberMatch[1], 10);
            if (number > 0 && number < 100) {
              return number;
            }
          }
        }
      }
    }
  }

  return 0;
};
