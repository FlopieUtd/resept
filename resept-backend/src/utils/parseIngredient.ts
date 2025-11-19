export interface ParsedIngredient {
  amount?: number;
  rawWithoutAmount: string;
  amountMax?: number;
}

const decodeHtmlEntities = (text: string): string => {
  const htmlEntities: Record<string, string> = {
    "&amp;": "&",
    "&lt;": "<",
    "&gt;": ">",
    "&quot;": '"',
    "&#39;": "'",
    "&#8217;": "'",
    "&#8216;": "'",
    "&#8220;": '"',
    "&#8221;": '"',
    "&#8211;": "–",
    "&#8212;": "—",
    "&#8208;": "‐",
    "&#8209;": "‑",
    "&#820A;": " ",
    "&#820B;": "​",
    "&#820C;": "‌",
    "&#820D;": "‍",
    "&#820E;": "‎",
    "&#820F;": "‏",
  };

  return text.replace(/&[#\w]+;/g, (entity) => {
    return htmlEntities[entity] || entity;
  });
};

export const parseIngredient = (text: string): ParsedIngredient => {
  // Decode HTML entities first to ensure proper parsing
  const decodedText = decodeHtmlEntities(text);
  const trimmedText = decodedText.trim();
  const normalizedSlashText = trimmedText.replace(/\u2044/g, "/");

  // Default values
  let amount: number | undefined = undefined;
  let rawWithoutAmount = trimmedText;

  // Check for ranges first (including HTML entity decoded hyphens)
  const rangeMatch = normalizedSlashText.match(/^(\d+)\s*[-–—‐‑]\s*(\d+)/);
  if (rangeMatch) {
    const min = parseInt(rangeMatch[1]);
    const max = parseInt(rangeMatch[2]);
    const fullRange = rangeMatch[0];

    return {
      amount: min,
      rawWithoutAmount: normalizedSlashText
        .replace(new RegExp(`^${fullRange}\\s*`), "")
        .trim(),
      amountMax: max,
    };
  }

  // Try to match other amount patterns
  const amountPatterns = [
    // Dutch ranges: 3 a 4, 3 à 4, 1 a 2, etc.
    /^(\d+\s+a\s+\d+)/,
    /^(\d+\s+à\s+\d+)/,
    // Mixed numbers with Unicode fractions: 12 ¼, 1 ½, etc.
    /^(\d+\s+[¼½¾⅐⅑⅒⅓⅔⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞])/,
    // Fractions: 1/2, 1/4, 3/4, etc.
    /^(\d+\/\d+)/,
    // Mixed numbers: 1 1/2, 2 3/4, etc.
    /^(\d+\s+\d+\/\d+)/,
    // Unicode fractions: ¼, ½, ¾, etc.
    /^([¼½¾⅐⅑⅒⅓⅔⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞])/,
    // European decimals: 0,5, 1,25, etc.
    /^(\d+,\d+)/,
    // US decimals: 1.5, 0.25, etc.
    /^(\d+\.\d+)/,
    // Written numbers: one, two, three, etc.
    /^(one|two|three|four|five|six|seven|eight|nine|ten|een|twee|drie|vier|vijf|zes|zeven|acht|negen|tien)\b/i,
    // Whole numbers: 1, 2, 3, etc.
    /^(\d+)/,
  ];

  let matchedAmount = "";

  // Find amount
  for (const pattern of amountPatterns) {
    const match = normalizedSlashText.match(pattern);
    if (match) {
      matchedAmount = match[1] || match[0];
      break;
    }
  }

  // Parse amount and extract text without amount
  if (matchedAmount) {
    amount = 1; // Set default amount when we find a pattern
    if (matchedAmount.includes(" a ") || matchedAmount.includes(" à ")) {
      // Handle Dutch ranges like "3 a 4" or "3 à 4"
      const separator = matchedAmount.includes(" a ") ? " a " : " à ";
      const rangeParts = matchedAmount.split(separator);
      const min = parseInt(rangeParts[0]);
      const max = parseInt(rangeParts[1]);
      amount = min; // Use the minimum as the default amount
      return {
        amount: min,
        rawWithoutAmount: trimmedText
          .replace(new RegExp(`^${matchedAmount}\\s*`), "")
          .trim(),
        amountMax: max,
      };
    } else if (matchedAmount.includes(" ")) {
      // Handle mixed numbers like "12 ¼" or "1 1/2"
      const parts = matchedAmount.split(" ");
      const whole = parseInt(parts[0]);

      if (parts[1].includes("/")) {
        // Mixed numbers like "1 1/2"
        const fractionParts = parts[1].split("/");
        const numerator = parseInt(fractionParts[0]);
        const denominator = parseInt(fractionParts[1]);
        amount = whole + numerator / denominator;
      } else {
        // Mixed numbers with Unicode fractions like "12 ¼"
        const unicodeFraction = parts[1];
        const fractionValue = getUnicodeFractionValue(unicodeFraction);
        amount = whole + fractionValue;
      }
    } else if (matchedAmount.includes("/")) {
      // Handle fractions
      const parts = matchedAmount.split("/");
      const numerator = parseInt(parts[0]);
      const denominator = parseInt(parts[1]);
      amount = numerator / denominator;
    } else if (isUnicodeFraction(matchedAmount)) {
      // Handle Unicode fractions like "¼", "½", "¾"
      amount = getUnicodeFractionValue(matchedAmount);
    } else if (matchedAmount.includes(",")) {
      // European decimals (comma as decimal separator)
      amount = parseFloat(matchedAmount.replace(",", "."));
    } else if (matchedAmount.includes(".")) {
      // US decimals (dot as decimal separator)
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

    // Extract text without the amount
    rawWithoutAmount = normalizedSlashText
      .replace(new RegExp(`^${matchedAmount}\\s*`), "")
      .trim();
  }

  const result: ParsedIngredient = {
    rawWithoutAmount,
  };
  if (amount !== undefined) {
    result.amount = amount;
  }
  return result;
};

const isUnicodeFraction = (text: string): boolean => {
  const unicodeFractions = [
    "¼",
    "½",
    "¾",
    "⅐",
    "⅑",
    "⅒",
    "⅓",
    "⅔",
    "⅕",
    "⅖",
    "⅗",
    "⅘",
    "⅙",
    "⅚",
    "⅛",
    "⅜",
    "⅝",
    "⅞",
  ];
  return unicodeFractions.includes(text);
};

const getUnicodeFractionValue = (fraction: string): number => {
  const fractionMap: Record<string, number> = {
    "¼": 0.25, // quarter
    "½": 0.5, // half
    "¾": 0.75, // three-quarters
    "⅐": 1 / 7, // one-seventh
    "⅑": 1 / 9, // one-ninth
    "⅒": 1 / 10, // one-tenth
    "⅓": 1 / 3, // one-third
    "⅔": 2 / 3, // two-thirds
    "⅕": 1 / 5, // one-fifth
    "⅖": 2 / 5, // two-fifths
    "⅗": 3 / 5, // three-fifths
    "⅘": 4 / 5, // four-fifths
    "⅙": 1 / 6, // one-sixth
    "⅚": 5 / 6, // five-sixths
    "⅛": 1 / 8, // one-eighth
    "⅜": 3 / 8, // three-eighths
    "⅝": 5 / 8, // five-eighths
    "⅞": 7 / 8, // seven-eighths
  };
  return fractionMap[fraction] || 0;
};
