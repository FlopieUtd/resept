import {
  COOKING_IMPERATIVES,
  UNIT_KEYWORDS,
  NUTRITION_KEYWORDS,
} from "./constants";

const getAllUnitKeywords = (): string[] => {
  return [
    ...new Set(
      Object.values(UNIT_KEYWORDS).flatMap((unitGroup) => {
        const dutch = Array.isArray(unitGroup.dutch)
          ? unitGroup.dutch
          : [unitGroup.dutch];
        const english = Array.isArray(unitGroup.english)
          ? unitGroup.english
          : [unitGroup.english];
        return [...dutch, ...english];
      })
    ),
  ];
};

const getAllCookingVerbs = (): string[] => {
  return Object.values(COOKING_IMPERATIVES).flatMap((verbGroup) => {
    const dutchVerbs = Array.isArray(verbGroup.dutch)
      ? verbGroup.dutch
      : [verbGroup.dutch];
    const englishVerbs = Array.isArray(verbGroup.english)
      ? verbGroup.english
      : [verbGroup.english];
    return [...dutchVerbs, ...englishVerbs];
  });
};

export const containsUnitKeyword = (text: string): boolean => {
  const normalizedText = text.toLowerCase().trim();
  const allUnitKeywords = getAllUnitKeywords();

  return allUnitKeywords.some((keyword) => {
    const regex = new RegExp(
      `\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
      "i"
    );
    return regex.test(normalizedText);
  });
};

const getAllNutritionKeywords = (): string[] => {
  return [
    ...new Set(
      Object.values(NUTRITION_KEYWORDS).flatMap((group) => {
        const dutch = Array.isArray(group.dutch) ? group.dutch : [group.dutch];
        const english = Array.isArray(group.english)
          ? group.english
          : [group.english];
        return [...dutch, ...english];
      })
    ),
  ];
};

export const containsNutritionKeyword = (text: string): boolean => {
  const normalizedText = text.toLowerCase().trim();
  const allKeywords = getAllNutritionKeywords();
  return allKeywords.some((keyword) => {
    const regex = new RegExp(
      `\\b${keyword.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&")}\\b`,
      "i"
    );
    return regex.test(normalizedText);
  });
};

export const startsWithCookingVerb = (text: string): boolean => {
  if (!text.trim()) return false;
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const firstWords = sentences
    .map((sentence) => sentence.trim().split(/\s+/)[0]?.toLowerCase())
    .filter((word) => word && word.length > 0);

  const allVerbs = getAllCookingVerbs();
  return firstWords.some((firstWord) => allVerbs.includes(firstWord));
};

export const countSentencesStartingWithCookingVerb = (text: string): number => {
  if (!text.trim()) return 0;
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const firstWords = sentences
    .map((sentence) => sentence.trim().split(/\s+/)[0]?.toLowerCase())
    .filter((word) => word && word.length > 0);

  const allVerbs = getAllCookingVerbs();
  return firstWords.filter((firstWord) => allVerbs.includes(firstWord)).length;
};
