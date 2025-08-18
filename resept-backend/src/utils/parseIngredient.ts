export interface ParsedIngredient {
  amount: number;
}

export const parseIngredient = (text: string): ParsedIngredient => {
  const trimmedText = text.trim();

  // Default values
  let amount = 1;

  // Try to match amount patterns
  const amountPatterns = [
    // Fractions: 1/2, 1/4, 3/4, etc.
    /^(\d+\/\d+)/,
    // Mixed numbers: 1 1/2, 2 3/4, etc.
    /^(\d+\s+\d+\/\d+)/,
    // Decimals: 1.5, 0.25, etc.
    /^(\d+\.\d+)/,
    // Whole numbers: 1, 2, 3, etc.
    /^(\d+)/,
    // Written numbers: one, two, three, etc.
    /^(one|two|three|four|five|six|seven|eight|nine|ten|een|twee|drie|vier|vijf|zes|zeven|acht|negen|tien)\b/i,
  ];

  let matchedAmount = "";

  // Find amount
  for (const pattern of amountPatterns) {
    const match = trimmedText.match(pattern);
    if (match) {
      matchedAmount = match[1] || match[0];
      break;
    }
  }

  // Parse amount
  if (matchedAmount) {
    if (matchedAmount.includes("/")) {
      // Handle fractions
      if (matchedAmount.includes(" ")) {
        // Mixed numbers like "1 1/2"
        const parts = matchedAmount.split(" ");
        const whole = parseInt(parts[0]);
        const fractionParts = parts[1].split("/");
        const numerator = parseInt(fractionParts[0]);
        const denominator = parseInt(fractionParts[1]);
        amount = whole + numerator / denominator;
      } else {
        // Simple fractions like "1/2"
        const parts = matchedAmount.split("/");
        const numerator = parseInt(parts[0]);
        const denominator = parseInt(parts[1]);
        amount = numerator / denominator;
      }
    } else if (matchedAmount.includes(".")) {
      // Decimals
      amount = parseFloat(matchedAmount);
    } else if (/^\d+$/.test(matchedAmount)) {
      // Whole numbers
      amount = parseInt(matchedAmount);
    } else {
      // Written numbers
      const writtenNumbers: Record<string, number> = {
        one: 1,
        een: 1,
        two: 2,
        twee: 2,
        three: 3,
        drie: 3,
        four: 4,
        vier: 4,
        five: 5,
        vijf: 5,
        six: 6,
        zes: 6,
        seven: 7,
        zeven: 7,
        eight: 8,
        acht: 8,
        nine: 9,
        negen: 9,
        ten: 10,
        tien: 10,
      };
      amount = writtenNumbers[matchedAmount.toLowerCase()] || 1;
    }
  }

  return {
    amount,
  };
};
