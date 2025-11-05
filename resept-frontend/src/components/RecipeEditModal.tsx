import { useState, useEffect, useRef } from "react";
import { type CreateRecipeData, type ParsedIngredient } from "../types";
import { API_URL } from "../utils/constants";
import { Input } from "./Input";
import { Textarea } from "./Textarea";
import { Button } from "./Button";
import { X } from "@phosphor-icons/react";

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
  showImport?: boolean;
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
  showImport = false,
}: RecipeEditModalProps) => {
  const [formData, setFormData] = useState<CreateRecipeData>({
    ...initialData,
    ingredients:
      initialData.ingredients.length > 0
        ? initialData.ingredients
        : [{ ingredients: [{ raw: "" }] }],
    instructions:
      initialData.instructions.length > 0
        ? initialData.instructions
        : [{ text: "" }],
  });

  const [importUrl, setImportUrl] = useState("");
  const [importError, setImportError] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const prevIsOpen = useRef(isOpen);
  const ingredientInputRefs = useRef<Record<string, HTMLInputElement | null>>(
    {}
  );
  const [pendingFocusKey, setPendingFocusKey] = useState<string | null>(null);
  const groupTitleInputRefs = useRef<Record<number, HTMLInputElement | null>>(
    {}
  );
  const [pendingGroupTitleFocusIndex, setPendingGroupTitleFocusIndex] =
    useState<number | null>(null);

  useEffect(() => {
    if (isOpen && !prevIsOpen.current) {
      setFormData({
        ...initialData,
        ingredients:
          initialData.ingredients.length > 0
            ? initialData.ingredients
            : [{ ingredients: [{ raw: "" }] }],
        instructions:
          initialData.instructions.length > 0
            ? initialData.instructions
            : [{ text: "" }],
      });
    }
    prevIsOpen.current = isOpen;
  }, [isOpen, initialData]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  useEffect(() => {
    if (!pendingFocusKey) return;
    const el = ingredientInputRefs.current[pendingFocusKey] || null;
    if (el) {
      el.focus();
      setPendingFocusKey(null);
    }
  }, [formData, pendingFocusKey]);

  useEffect(() => {
    if (pendingGroupTitleFocusIndex === null) return;
    const el = groupTitleInputRefs.current[pendingGroupTitleFocusIndex] || null;
    if (el) {
      el.focus();
      setPendingGroupTitleFocusIndex(null);
    }
  }, [formData, pendingGroupTitleFocusIndex]);

  const handleInputChange = (
    field: keyof CreateRecipeData,
    value: string | number
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleGroupTitleChange = (groupIndex: number, value: string) => {
    const newGroups = [...formData.ingredients];
    newGroups[groupIndex] = { ...newGroups[groupIndex], title: value };
    setFormData((prev) => ({ ...prev, ingredients: newGroups }));
  };

  const handleIngredientChange = (
    groupIndex: number,
    index: number,
    value: string
  ) => {
    const newGroups = [...formData.ingredients];
    const group = newGroups[groupIndex];
    const newLines = [...group.ingredients];
    newLines[index] = { raw: value };
    newGroups[groupIndex] = { ...group, ingredients: newLines };
    setFormData((prev) => ({ ...prev, ingredients: newGroups }));
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

  const addGroup = () => {
    setFormData((prev) => {
      const next = {
        ...prev,
        ingredients: [...prev.ingredients, { ingredients: [{ raw: "" }] }],
      };
      if (prev.ingredients.length === 1) {
        setPendingGroupTitleFocusIndex(0);
      }
      return next;
    });
  };

  const addIngredient = (groupIndex: number) => {
    setFormData((prev) => {
      const newGroups = [...prev.ingredients];
      const group = newGroups[groupIndex];
      const newLines = [...group.ingredients, { raw: "" }];
      newGroups[groupIndex] = { ...group, ingredients: newLines };
      const newIndex = newLines.length - 1;
      setPendingFocusKey(`${groupIndex}-${newIndex}`);
      return { ...prev, ingredients: newGroups };
    });
  };

  const removeIngredient = (groupIndex: number, index: number) => {
    setFormData((prev) => {
      const newGroups = [...prev.ingredients];
      const group = newGroups[groupIndex];
      const newLines = group.ingredients.filter((_, i) => i !== index);
      newGroups[groupIndex] = { ...group, ingredients: newLines };
      return { ...prev, ingredients: newGroups };
    });
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
        .map((group) => ({
          title: group.title,
          ingredients: group.ingredients
            .filter((ing) => (ing.raw || "").trim() !== "")
            .map((ing) => ({
              raw: ing.raw,
              parsed: parseIngredientFrontend(ing.raw),
            })),
        }))
        .filter((g) => g.ingredients.length > 0),
      instructions: formData.instructions.filter(
        (inst) => "text" in inst && inst.text.trim() !== ""
      ),
    };

    onSave(cleanedData);
  };

  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setImportError("");
    setIsImporting(true);

    try {
      const response = await fetch(`${API_URL}/extract-from-url`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: importUrl }),
      });

      const data = await response.json();

      if (response.ok) {
        const transformedData: CreateRecipeData = {
          title: data.title || "Untitled Recipe",
          recipe_yield: data.recipe_yield || "",
          recipe_category: data.recipe_category || "Recepten",
          description: data.description || "",
          prep_time: data.prep_time || "",
          cook_time: data.cook_time || "",
          total_time: data.total_time || "",
          ingredients: data.ingredients || [],
          instructions: data.instructions || [],
          source_url: importUrl,
        };

        if (
          transformedData.title &&
          transformedData.source_url &&
          (transformedData.ingredients.length > 0 ||
            transformedData.instructions.length > 0)
        ) {
          setFormData({
            ...transformedData,
            ingredients:
              transformedData.ingredients.length > 0
                ? transformedData.ingredients
                : [{ ingredients: [{ raw: "" }] }],
            instructions:
              transformedData.instructions.length > 0
                ? transformedData.instructions
                : [{ text: "" }],
          });
          setImportUrl("");
        } else {
          setImportError("Could not extract valid recipe data from this URL");
        }
      } else {
        setImportError(data.error || "Failed to extract recipe");
      }
    } catch {
      setImportError("Network error occurred");
    } finally {
      setIsImporting(false);
    }
  };

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-25  flex items-center justify-center p-4 z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-white max-w-[1080px] w-full max-h-[95vh] overflow-y-auto rounded-[8px] shadow-xl">
        <div className="">
          <div className="flex justify-between items-center mb-6 py-[16px] px-[16px] sticky top-0 bg-white">
            <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
            <button onClick={onClose} className="">
              <X size={24} weight="bold" />
            </button>
          </div>

          {showImport && (
            <div className="pb-[16px]  border-b mb-[16px] px-[16px]">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Recept importeren van URL
              </h3>
              <form onSubmit={handleImportSubmit} className="space-y-4">
                <div className="flex gap-[12px]">
                  <div className="flex-1">
                    <Input
                      type="url"
                      value={importUrl}
                      onChange={(e) => setImportUrl(e.target.value)}
                      placeholder="Recept URL..."
                      required
                    />
                  </div>
                  <Button type="submit" loading={isImporting}>
                    Importeren
                  </Button>
                </div>
                {importError && (
                  <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                    {importError}
                  </div>
                )}
              </form>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6 px-[16px]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-[12px]">
              <div>
                <Input
                  label="Titel"
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  required
                />
              </div>

              <div>
                <Input
                  label="Categorie"
                  type="text"
                  value={formData.recipe_category}
                  onChange={(e) =>
                    handleInputChange("recipe_category", e.target.value)
                  }
                />
              </div>

              <div>
                <Input
                  label="Opbrengst"
                  type="number"
                  value={formData.recipe_yield}
                  onChange={(e) =>
                    handleInputChange("recipe_yield", parseInt(e.target.value))
                  }
                  required
                  min="1"
                />
              </div>

              <div>
                <Input
                  label="Voorbereidingstijd"
                  type="text"
                  value={formData.prep_time}
                  onChange={(e) =>
                    handleInputChange("prep_time", e.target.value)
                  }
                  placeholder="bijv. 15 min"
                />
              </div>

              <div>
                <Input
                  label="Kooktijd"
                  type="text"
                  value={formData.cook_time}
                  onChange={(e) =>
                    handleInputChange("cook_time", e.target.value)
                  }
                  placeholder="bijv. 30 min"
                />
              </div>

              <div>
                <Input
                  label="Totale tijd"
                  type="text"
                  value={formData.total_time}
                  onChange={(e) =>
                    handleInputChange("total_time", e.target.value)
                  }
                  placeholder="bijv. 45 min"
                />
              </div>
            </div>

            <div>
              <Textarea
                label="Beschrijving"
                value={formData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                rows={3}
              />
            </div>

            <div>
              <Input
                label="Bron URL"
                type="url"
                value={formData.source_url}
                onChange={(e) =>
                  handleInputChange("source_url", e.target.value)
                }
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
                  onClick={addGroup}
                  className="text-sm text-red-600 hover:text-red-800"
                >
                  + Groep toevoegen
                </button>
              </div>
              <div className="space-y-4">
                {formData.ingredients.map((group, gIndex) => (
                  <div key={gIndex} className="border p-3 rounded">
                    <div className="flex justify-between items-center mb-2">
                      {(formData.ingredients.length >= 2 ||
                        (group.title || "").trim()) && (
                        <div className="flex-1 mr-2">
                          <Input
                            type="text"
                            value={group.title || ""}
                            onChange={(e) =>
                              handleGroupTitleChange(gIndex, e.target.value)
                            }
                            placeholder="Groep titel (optioneel)"
                            className={`${
                              (group.title || "").trim()
                                ? "font-semibold placeholder:font-normal"
                                : ""
                            }`}
                            ref={(el) => {
                              groupTitleInputRefs.current[gIndex] = el;
                            }}
                          />
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      {group.ingredients.map((ingredient, index) => (
                        <div key={index} className="flex gap-2">
                          <div className="flex-1">
                            <Input
                              type="text"
                              value={ingredient.raw}
                              onChange={(e) =>
                                handleIngredientChange(
                                  gIndex,
                                  index,
                                  e.target.value
                                )
                              }
                              placeholder="Ingrediënt..."
                              required
                              ref={(el) => {
                                ingredientInputRefs.current[
                                  `${gIndex}-${index}`
                                ] = el;
                              }}
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => removeIngredient(gIndex, index)}
                            className="px-3 py-2 text-red-600 hover:text-red-800"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="mt-2">
                      <button
                        type="button"
                        onClick={() => addIngredient(gIndex)}
                        className="text-sm text-red-600 hover:text-red-800"
                      >
                        + Ingrediënt toevoegen
                      </button>
                    </div>
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
                  className="text-sm text-red-600 hover:text-red-800"
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
                      <Textarea
                        value={"text" in instruction ? instruction.text : ""}
                        onChange={(e) =>
                          handleInstructionChange(index, e.target.value)
                        }
                        rows={2}
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

            <div className="flex justify-between items-center gap-[12px] border-t sticky bottom-0 bg-white py-[16px]">
              <div className="flex gap-2">
                {onDelete && (
                  <Button
                    type="button"
                    onClick={onDelete}
                    loading={isDeleting}
                    variant="danger"
                  >
                    Verwijderen
                  </Button>
                )}
              </div>
              <div className="flex gap-[12px]">
                <Button type="submit" loading={isSaving}>
                  Opslaan
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
