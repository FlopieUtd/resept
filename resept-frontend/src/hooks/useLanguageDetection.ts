import { useMemo } from 'react';
import { Language } from '../types';
import { type RecipeInstructionItem } from '../types';

const DUTCH_STOPWORDS = new Set([
  'de', 'het', 'een', 'van', 'op', 'met', 'voor', 'aan', 'zijn', 'heeft'
]);

const ENGLISH_STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'is', 'on', 'at', 'to'
]);

const extractTextFromInstructions = (instructions: RecipeInstructionItem[]): string => {
  return instructions
    .map(instruction => {
      if ('type' in instruction && instruction.type === 'section') {
        return instruction.name + ' ' + instruction.steps.map(step => step.text).join(' ');
      } else if ('text' in instruction) {
        return instruction.text;
      }
      return '';
    })
    .join(' ')
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const countStopwords = (text: string, stopwords: Set<string>): number => {
  const words = text.split(/\s+/);
  return words.filter(word => stopwords.has(word)).length;
};

export const useLanguageDetection = (
  title: string,
  description: string,
  instructions: RecipeInstructionItem[]
): Language => {
  return useMemo(() => {
    const instructionText = extractTextFromInstructions(instructions);
    const fullText = `${title} ${description} ${instructionText}`.toLowerCase();
    
    const dutchCount = countStopwords(fullText, DUTCH_STOPWORDS);
    const englishCount = countStopwords(fullText, ENGLISH_STOPWORDS);
    
    const totalWords = fullText.split(/\s+/).length;
    const dutchRatio = dutchCount / totalWords;
    const englishRatio = englishCount / totalWords;
    
    const threshold = 0.01;
    
    if (dutchRatio > threshold && dutchRatio > englishRatio) {
      return Language.NL;
    } else if (englishRatio > threshold && englishRatio > dutchRatio) {
      return Language.EN;
    } else {
      return Language.UNKNOWN;
    }
  }, [title, description, instructions]);
};