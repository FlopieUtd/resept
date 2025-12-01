import type { InstructionGroup, RecipeInstructionItem } from "../../types";

const containsStepPattern = (title: string): boolean => {
  return /step/i.test(title);
};

const extractNumber = (title: string): number | null => {
  const match = title.match(/\d+/);
  return match ? parseInt(match[0], 10) : null;
};

const hasIncrementingNumbers = (groups: InstructionGroup[]): boolean => {
  const groupsWithTitles = groups.filter((group) => group.title);
  if (groupsWithTitles.length === 0) {
    return false;
  }

  const numbers = groupsWithTitles.map((group) => extractNumber(group.title!));

  if (numbers.some((num) => num === null)) {
    return false;
  }

  const sortedNumbers = [...numbers].sort((a, b) => a! - b!);
  if (sortedNumbers[0] !== 1) {
    return false;
  }

  for (let i = 0; i < sortedNumbers.length - 1; i++) {
    if (sortedNumbers[i + 1]! - sortedNumbers[i]! !== 1) {
      return false;
    }
  }

  return true;
};

const shouldRemoveTitles = (groups: InstructionGroup[]): boolean => {
  const groupsWithTitles = groups.filter((group) => group.title);
  if (groupsWithTitles.length === 0) {
    return false;
  }

  const allContainStep = groupsWithTitles.every((group) =>
    containsStepPattern(group.title!)
  );

  if (allContainStep) {
    return true;
  }

  return hasIncrementingNumbers(groups);
};

const sanitizeInstructionGroup = (group: any): InstructionGroup => {
  const title =
    typeof group?.title === "string" && group.title.trim().length > 0
      ? group.title.trim()
      : undefined;

  const instructions = Array.isArray(group?.instructions)
    ? group.instructions
        .map((instruction: any) => {
          const text =
            typeof instruction?.text === "string"
              ? instruction.text.trim()
              : typeof instruction === "string"
              ? instruction.trim()
              : "";
          return text.length > 0 ? { text } : null;
        })
        .filter(
          (
            instruction: { text: string } | null
          ): instruction is {
            text: string;
          } => Boolean(instruction)
        )
    : [];

  return {
    ...(title ? { title } : {}),
    instructions,
  };
};

const fromInstructionItems = (
  items: RecipeInstructionItem[]
): InstructionGroup[] => {
  if (items.length === 0) {
    return [];
  }

  const first = items[0] as RecipeInstructionItem & { instructions?: any[] };

  if (Array.isArray((first as any)?.instructions)) {
    return items
      .map((group) => sanitizeInstructionGroup(group))
      .filter((group) => group.instructions.length > 0 || group.title);
  }

  if ("type" in first && first.type === "section") {
    return items
      .map((item) => {
        if ("type" in item && item.type === "section") {
          const steps = Array.isArray(item.steps)
            ? item.steps
                .map((step) => {
                  const text =
                    typeof step?.text === "string"
                      ? step.text.trim()
                      : typeof step === "string"
                      ? (step as string).trim()
                      : "";
                  return text.length > 0 ? { text } : null;
                })
                .filter(
                  (step: { text: string } | null): step is { text: string } =>
                    Boolean(step)
                )
            : [];
          return {
            ...(item.name ? { title: item.name } : {}),
            instructions: steps,
          };
        }

        if ("text" in item && typeof item.text === "string") {
          const text = item.text.trim();
          return text.length > 0
            ? { instructions: [{ text }] }
            : { instructions: [] };
        }

        return { instructions: [] };
      })
      .filter((group) => group.instructions.length > 0 || group.title);
  }

  if ("text" in first) {
    const instructions = items
      .map((item) => {
        if ("text" in item && typeof item.text === "string") {
          const text = item.text.trim();
          return text.length > 0 ? { text } : null;
        }
        if (typeof item === "string") {
          const text = (item as string).trim();
          return text.length > 0 ? { text } : null;
        }
        return null;
      })
      .filter((instruction): instruction is { text: string } =>
        Boolean(instruction)
      );

    return instructions.length > 0 ? [{ instructions }] : [];
  }

  if (typeof first === "string") {
    const instructions = items
      .map((item) => (typeof item === "string" ? (item as string).trim() : ""))
      .filter((text) => text.length > 0)
      .map((text) => ({ text }));

    return instructions.length > 0 ? [{ instructions }] : [];
  }

  return [];
};

export const normalizeInstructionGroups = (
  instructions: unknown
): InstructionGroup[] => {
  if (!Array.isArray(instructions)) {
    return [];
  }

  const groups = fromInstructionItems(instructions as RecipeInstructionItem[]);

  if (shouldRemoveTitles(groups)) {
    const allInstructions = groups.flatMap((group) => group.instructions);
    return allInstructions.length > 0
      ? [{ instructions: allInstructions }]
      : [];
  }

  return groups;
};
