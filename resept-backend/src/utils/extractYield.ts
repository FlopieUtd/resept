import { YIELD_KEYWORDS } from "./constants.js";
import { TextNode } from "./extractTextNodes.js";

const extractNumbersFromSentence = (sentence: string): number[] => {
  const numberRegex = /\d+(?:\.\d+)?/g;
  const matches = sentence.match(numberRegex);

  if (!matches) return [];

  return matches
    .map((match) => parseFloat(match))
    .filter((num) => num > 0 && num < 1000);
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
    if (lowerSentence.includes(keyword.toLowerCase())) {
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
    return allYieldKeywords.some((keyword) =>
      lowerText.includes(keyword.toLowerCase())
    );
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
