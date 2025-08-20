import { useState, useEffect } from "react";
import { type CreateRecipeData, type ParsedIngredient } from "../types";

// Simple ingredient parsing function for the frontend
const parseIngredientFrontend = (text: string): ParsedIngredient => {
  const trimmedText = text.trim();

  // Default values
  let amount: number | undefined = undefined;
  let rawWithoutAmount = trimmedText;

  // Check for ranges first
  const rangeMatch = trimmedText.match(/^(\d+)\s*[-–—‐‑]\s*(\d+)/);
  if (rangeMatch) {
    const min = parseInt(rangeMatch[1]);
    const max = parseInt(rangeMatch[2]);
    const fullRange = rangeMatch[0];

    return {
      amount: min,
      rawWithoutAmount: trimmedText
        .replace(new RegExp(`^${fullRange}\\s*`, "g"), "")
        .trim(),
      amountMax: max,
    };
  }

  // Try to match amount patterns
  const amountPatterns = [
    // Dutch ranges: 3 a 4, 3 à 4, 1 a 2, etc.
    /^(\d+\s+a\s+\d+)/,
    /^(\d+\s+à\s+\d+)/,
    // Fractions: 1/2, 1/4, 3/4, etc.
    /^(\d+\/\d+)/,
    // Mixed numbers: 1 1/2, 2 3/4, etc.
    /^(\d+\s+\d+\/\d+)/,
    // European decimals: 0,5, 1,25, etc.
    /^(\d+,\d+)/,
    // US decimals: 1.5, 0.25, etc.
    /^(\d+\.\d+)/,
    // Whole numbers: 1, 2, 3, etc.
    /^(\d+)/,
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

  // Parse amount and extract text without amount
  if (matchedAmount) {
    if (matchedAmount.includes(" a ") || matchedAmount.includes(" à ")) {
      // Handle Dutch ranges like "3 a 4" or "3 à 4"
      const separator = matchedAmount.includes(" a ") ? " a " : " à ";
      const rangeParts = matchedAmount.split(separator);
      const min = parseInt(rangeParts[0]);
      const max = parseInt(rangeParts[1]);
      amount = min;
      return {
        amount: min,
        rawWithoutAmount: trimmedText
          .replace(new RegExp(`^${matchedAmount}\\s*`, "g"), "")
          .trim(),
        amountMax: max,
      };
    } else if (matchedAmount.includes(" ")) {
      // Handle mixed numbers like "1 1/2"
      const parts = matchedAmount.split(" ");
      const whole = parseInt(parts[0]);

      if (parts[1].includes("/")) {
        // Mixed numbers like "1 1/2"
        const fractionParts = parts[1].split("/");
        const numerator = parseInt(fractionParts[0]);
        const denominator = parseInt(fractionParts[1]);
        amount = whole + numerator / denominator;
      } else {
        // Mixed numbers with whole numbers like "12 3"
        amount = whole;
      }
    } else if (matchedAmount.includes("/")) {
      // Handle fractions
      const parts = matchedAmount.split("/");
      const numerator = parseInt(parts[0]);
      const denominator = parseInt(parts[1]);
      amount = numerator / denominator;
    } else if (matchedAmount.includes(",")) {
      // European decimals (comma as decimal separator)
      amount = parseFloat(matchedAmount.replace(",", "."));
    } else if (matchedAmount.includes(".")) {
      // US decimals (dot as decimal separator)
      amount = parseFloat(matchedAmount);
    } else if (/^\d+$/.test(matchedAmount)) {
      // Whole numbers
      amount = parseInt(matchedAmount);
    }

    // Extract text without the amount
    rawWithoutAmount = trimmedText
      .replace(new RegExp(`^${matchedAmount}\\s*`, "g"), "")
      .trim();
  }

  return {
    amount,
    rawWithoutAmount,
  };
};

interface RecipeEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (recipeData: CreateRecipeData) => void;
  onDelete?: () => void;
  initialData: CreateRecipeData;
  isSaving: boolean;
  isDeleting?: boolean;
  title?: string;
}

export const RecipeEditModal = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialData,
  isSaving,
  isDeleting = false,
  title = "Bewerk recept",
}: RecipeEditModalProps) => {
  const [formData, setFormData] = useState<CreateRecipeData>({
    ...initialData,
    ingredients:
      initialData.ingredients.length > 0
        ? initialData.ingredients
        : [{ raw: "" }],
    instructions:
      initialData.instructions.length > 0
        ? initialData.instructions
        : [{ text: "" }],
  });

  useEffect(() => {
    setFormData({
      ...initialData,
      ingredients:
        initialData.ingredients.length > 0
          ? initialData.ingredients
          : [{ raw: "" }],
      instructions:
        initialData.instructions.length > 0
          ? initialData.instructions
          : [{ text: "" }],
    });
  }, [initialData]);

  const handleInputChange = (
    field: keyof CreateRecipeData,
    value: string | number
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleIngredientChange = (index: number, value: string) => {
    const newIngredients = [...formData.ingredients];
    newIngredients[index] = { raw: value };
    setFormData((prev) => ({
      ...prev,
      ingredients: newIngredients,
    }));
  };

  const handleInstructionChange = (index: number, value: string) => {
    const newInstructions = [...formData.instructions];
    if (newInstructions[index] && "text" in newInstructions[index]) {
      (newInstructions[index] as { text: string }).text = value;
    }
    setFormData((prev) => ({
      ...prev,
      instructions: newInstructions,
    }));
  };

  const addIngredient = () => {
    setFormData((prev) => ({
      ...prev,
      ingredients: [...prev.ingredients, { raw: "" }],
    }));
  };

  const removeIngredient = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index),
    }));
  };

  const addInstruction = () => {
    setFormData((prev) => ({
      ...prev,
      instructions: [...prev.instructions, { text: "" }],
    }));
  };

  const removeInstruction = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      instructions: prev.instructions.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.title.trim()) {
      return; // Form validation will show required field errors
    }

    // Filter out empty ingredients and instructions
    const cleanedData = {
      ...formData,
      ingredients: formData.ingredients
        .filter((ing) => ing.raw.trim() !== "")
        .map((ing) => ({
          raw: ing.raw,
          parsed: parseIngredientFrontend(ing.raw),
        })),
      instructions: formData.instructions.filter(
        (inst) => "text" in inst && inst.text.trim() !== ""
      ),
    };

    onSave(cleanedData);
  };

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center p-4 z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-white max-w-[960px] w-full max-h-[90vh] overflow-y-auto">
        <div className="py-[24px] px-[96px]">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Titel
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categorie
                </label>
                <input
                  type="text"
                  value={formData.recipe_category}
                  onChange={(e) =>
                    handleInputChange("recipe_category", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Opbrengst
                </label>
                <input
                  type="number"
                  value={formData.recipe_yield}
                  onChange={(e) =>
                    handleInputChange("recipe_yield", parseInt(e.target.value))
                  }
                  className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  min="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Voorbereidingstijd
                </label>
                <input
                  type="text"
                  value={formData.prep_time}
                  onChange={(e) =>
                    handleInputChange("prep_time", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="bijv. 15 min"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kooktijd
                </label>
                <input
                  type="text"
                  value={formData.cook_time}
                  onChange={(e) =>
                    handleInputChange("cook_time", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="bijv. 30 min"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Totale tijd
                </label>
                <input
                  type="text"
                  value={formData.total_time}
                  onChange={(e) =>
                    handleInputChange("total_time", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="bijv. 45 min"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Beschrijving
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bron URL
              </label>
              <input
                type="url"
                value={formData.source_url}
                onChange={(e) =>
                  handleInputChange("source_url", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://example.com/recipe"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Ingrediënten
                </label>
                <button
                  type="button"
                  onClick={addIngredient}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  + Toevoegen
                </button>
              </div>
              <div className="space-y-2">
                {formData.ingredients.map((ingredient, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={ingredient.raw}
                      onChange={(e) =>
                        handleIngredientChange(index, e.target.value)
                      }
                      className="flex-1 px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Ingrediënt..."
                      required
                    />
                    <button
                      type="button"
                      onClick={() => removeIngredient(index)}
                      className="px-3 py-2 text-red-600 hover:text-red-800"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Instructies
                </label>
                <button
                  type="button"
                  onClick={addInstruction}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  + Toevoegen
                </button>
              </div>
              <div className="space-y-2">
                {formData.instructions.map((instruction, index) => (
                  <div key={index} className="flex gap-2">
                    <div className="flex-1">
                      <div className="text-sm text-gray-500 mb-1">
                        Stap {index + 1}
                      </div>
                      <textarea
                        value={"text" in instruction ? instruction.text : ""}
                        onChange={(e) =>
                          handleInstructionChange(index, e.target.value)
                        }
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Instructie..."
                        required
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeInstruction(index)}
                      className="px-3 py-2 text-red-600 hover:text-red-800 self-end"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center gap-4 pt-4 border-t">
              <div className="flex gap-2">
                {onDelete && (
                  <button
                    type="button"
                    onClick={onDelete}
                    disabled={isDeleting}
                    className="px-6 py-2 bg-red-600 text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isDeleting ? "Verwijderen..." : "Verwijderen"}
                  </button>
                )}
              </div>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2 text-gray-600 border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Annuleren
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? "Opslaan..." : "Opslaan"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
