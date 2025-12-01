import { YIELD_KEYWORDS, WRITTEN_NUMBERS } from "./constants";
import { TextNode } from "./extractTextNodes";

const NUMBER_WORDS = WRITTEN_NUMBERS;

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

  return selectBestYield(candidates);
};
