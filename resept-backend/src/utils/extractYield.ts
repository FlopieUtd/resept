import { YIELD_KEYWORDS } from "./constants.js";
import { TextNode } from "./extractTextNodes.js";

const NUMBER_WORDS: Record<string, number> = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
  twenty: 20,
  een: 1,
  twee: 2,
  drie: 3,
  vier: 4,
  vijf: 5,
  zes: 6,
  zeven: 7,
  acht: 8,
  negen: 9,
  tien: 10,
  elf: 11,
  twaalf: 12,
  dertien: 13,
  veertien: 14,
  vijftien: 15,
  zestien: 16,
  zeventien: 17,
  achttien: 18,
  negentien: 19,
  twintig: 20,
};

const extractNumbersFromSentence = (sentence: string): number[] => {
  const digitRegex = /(?<![A-Za-z])\d+(?:\.\d+)?(?![A-Za-z])/g;
  const digitMatches = sentence.match(digitRegex) || [];
  const digitNumbers = digitMatches.map((m) => parseFloat(m));

  const lower = sentence.toLowerCase();
  const escapedKeys = Object.keys(NUMBER_WORDS).map((k) =>
    k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  );
  const wordRegex = new RegExp(
    `(^|[^A-Za-z])(${escapedKeys.join("|")})([^A-Za-z]|$)`,
    "gi"
  );
  const wordNumbers: number[] = [];
  let match: RegExpExecArray | null;
  while ((match = wordRegex.exec(lower)) !== null) {
    const word = match[2].toLowerCase();
    const value = NUMBER_WORDS[word];
    if (typeof value === "number") {
      wordNumbers.push(value);
    }
  }

  return [...digitNumbers, ...wordNumbers].filter(
    (num) => num > 0 && num < 1000
  );
};

const scoreYieldSentence = (sentence: string, numbers: number[]): number => {
  if (numbers.length === 0) return 0;

  const lowerSentence = sentence.toLowerCase();
  const words = lowerSentence.split(/\s+/).filter((word) => word.length > 0);

  if (words.length === 0) return 0;

  const yieldKeywords = [
    ...YIELD_KEYWORDS.yield.dutch,
    ...YIELD_KEYWORDS.yield.english,
  ];

  let yieldKeywordCount = 0;
  yieldKeywords.forEach((keyword) => {
    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(^|[^A-Za-z])${escaped}([^A-Za-z]|$)`, "i");
    if (regex.test(lowerSentence)) {
      yieldKeywordCount++;
    }
  });

  if (yieldKeywordCount === 0) return 0;

  const yieldKeywordRatio = yieldKeywordCount / words.length;
  const reasonableNumbers = numbers.filter((num) => num >= 1 && num <= 50);

  if (reasonableNumbers.length === 0) return 0;

  return yieldKeywordRatio * 100;
};

const selectBestYield = (
  candidates: { text: string; score: number }[]
): number => {
  if (candidates.length === 0) return 0;

  const bestCandidate = candidates.reduce((best, current) =>
    current.score > best.score ? current : best
  );

  if (bestCandidate.score === 0) return 0;

  const numbers = extractNumbersFromSentence(bestCandidate.text);
  return numbers.length > 0 ? Math.round(numbers[0]) : 0;
};

export const extractYield = (textNodes: TextNode[]): number => {
  const allYieldKeywords = [
    ...YIELD_KEYWORDS.yield.dutch,
    ...YIELD_KEYWORDS.yield.english,
  ];

  const yieldTextNodes = textNodes.filter((node) => {
    const lowerText = node.text.toLowerCase();
    return allYieldKeywords.some((keyword) => {
      const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(`(^|[^A-Za-z])${escaped}([^A-Za-z]|$)`, "i");
      return regex.test(lowerText);
    });
  });

  if (yieldTextNodes.length === 0) return 0;

  const candidates = yieldTextNodes.map((node) => {
    const numbers = extractNumbersFromSentence(node.text);
    const score = scoreYieldSentence(node.text, numbers);
    return { text: node.text, score };
  });

  console.log("Candidates", JSON.stringify(candidates, null, 2));

  return selectBestYield(candidates);
};
