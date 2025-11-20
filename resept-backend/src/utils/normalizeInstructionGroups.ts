import type { InstructionGroup } from "./extractInstructions";
import type { RecipeInstructionItem } from "../../types";

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
                      ? step.trim()
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
          const text = item.trim();
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
      .map((item) => (typeof item === "string" ? item.trim() : ""))
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

  return fromInstructionItems(instructions as RecipeInstructionItem[]);
};
