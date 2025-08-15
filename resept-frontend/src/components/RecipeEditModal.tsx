import { useState, useEffect } from "react";
import { type CreateRecipeData } from "../types";

interface RecipeEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (recipeData: CreateRecipeData) => void;
  initialData: CreateRecipeData;
  isSaving: boolean;
}

export const RecipeEditModal = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  isSaving,
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
    if (!formData.title.trim() || !formData.source_url.trim()) {
      return; // Form validation will show required field errors
    }

    // Filter out empty ingredients and instructions
    const cleanedData = {
      ...formData,
      ingredients: formData.ingredients.filter((ing) => ing.raw.trim() !== ""),
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
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Bewerk recept</h2>
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
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
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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

            <div className="flex justify-end gap-4 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Annuleren
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? "Opslaan..." : "Opslaan"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
