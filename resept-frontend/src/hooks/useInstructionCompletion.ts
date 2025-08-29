import { useState } from "react";

export const useInstructionCompletion = () => {
  const [completedInstructions, setCompletedInstructions] = useState<
    Set<string>
  >(new Set());

  const toggleInstruction = (instructionKey: string) => {
    setCompletedInstructions((prev) => {
      const newSet = new Set(prev);

      // Extract step information from the key
      if (instructionKey.startsWith("section-")) {
        // For section steps: section-{sectionIndex}-step-{stepIndex}
        const parts = instructionKey.split("-");
        const sectionIndex = parseInt(parts[1]);
        const stepIndex = parseInt(parts[3]);

        // Check if this step is already completed
        const isCurrentlyCompleted = newSet.has(instructionKey);

        if (isCurrentlyCompleted) {
          // Clear this step and all following steps, keep previous steps completed
          for (let i = stepIndex; i < 1000; i++) {
            // Use a high number to cover all possible steps
            const key = `section-${sectionIndex}-step-${i}`;
            if (newSet.has(key)) {
              newSet.delete(key);
            } else {
              // Stop when we hit the first non-completed step
              break;
            }
          }
        } else {
          // Mark this step and all previous steps as completed
          for (let i = 0; i <= stepIndex; i++) {
            newSet.add(`section-${sectionIndex}-step-${i}`);
          }
        }
      } else if (instructionKey.startsWith("simple-")) {
        // For simple instructions: simple-{index}
        const stepIndex = parseInt(instructionKey.split("-")[1]);
        const isCurrentlyCompleted = newSet.has(instructionKey);

        if (isCurrentlyCompleted) {
          // Clear this step and all following steps, keep previous steps completed
          for (let i = stepIndex; i < 1000; i++) {
            // Use a high number to cover all possible steps
            const key = `simple-${i}`;
            if (newSet.has(key)) {
              newSet.delete(key);
            } else {
              // Stop when we hit the first non-completed step
              break;
            }
          }
        } else {
          // Mark this step and all previous simple steps as completed
          for (let i = 0; i <= stepIndex; i++) {
            newSet.add(`simple-${i}`);
          }
        }
      }

      return newSet;
    });
  };

  const isInstructionCompleted = (instructionKey: string) => {
    return completedInstructions.has(instructionKey);
  };

  const clearAllInstructions = () => {
    setCompletedInstructions(new Set());
  };

  return {
    completedInstructions,
    toggleInstruction,
    isInstructionCompleted,
    clearAllInstructions,
  };
};
