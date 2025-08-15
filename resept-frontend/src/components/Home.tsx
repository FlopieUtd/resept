import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCreateRecipe } from "../lib/recipeService";
import { type CreateRecipeData } from "../types";
import { RecipeEditModal } from "./RecipeEditModal";

export const Home = () => {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [extractedRecipe, setExtractedRecipe] =
    useState<CreateRecipeData | null>(null);
  const navigate = useNavigate();
  const createRecipeMutation = useCreateRecipe();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const response = await fetch("/extract", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();

      if (response.ok) {
        // Transform backend data to match frontend format
        const transformedData: CreateRecipeData = {
          title: data.title || "Untitled Recipe",
          recipe_yield: data.recipe_yield || 1,
          recipe_category: data.recipe_category || "Recepten",
          description: data.description || "",
          prep_time: data.prep_time || "",
          cook_time: data.cook_time || "",
          total_time: data.total_time || "",
          ingredients: data.ingredients || [],
          instructions: data.instructions || [],
          source_url: url, // Always use the submitted URL as the source
        };

        // Only show modal if we have at least a title, source URL, and some ingredients/instructions
        if (
          transformedData.title &&
          transformedData.source_url &&
          (transformedData.ingredients.length > 0 ||
            transformedData.instructions.length > 0)
        ) {
          setExtractedRecipe(transformedData);
          setIsModalOpen(true);
        } else {
          setError("Could not extract valid recipe data from this URL");
        }
      } else {
        setError(data.error || "Failed to extract recipe");
      }
    } catch {
      setError("Network error occurred");
    }
  };

  const handleSave = async (recipeData: CreateRecipeData) => {
    try {
      const savedRecipe = await createRecipeMutation.mutateAsync(recipeData);

      if (savedRecipe) {
        setUrl("");
        setIsModalOpen(false);
        setExtractedRecipe(null);
        navigate(`/recipes/${savedRecipe.id}`);
      }
    } catch {
      setError("Error saving recipe to database");
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setExtractedRecipe(null);
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-start p-8">
      <div className="max-w-2xl w-full">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
          Recept importeren
        </h1>

        <form onSubmit={handleSubmit} className="mb-8">
          <div className="flex gap-4">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Recept URL..."
              className="flex-1 px-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
            <button
              type="submit"
              disabled={createRecipeMutation.isPending}
              className="px-6 py-3 bg-blue-600 text-white font-semibold  hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createRecipeMutation.isPending ? "Importeren..." : "Importeren"}
            </button>
          </div>
        </form>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}
      </div>

      {extractedRecipe && (
        <RecipeEditModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSave={handleSave}
          initialData={extractedRecipe}
          isSaving={createRecipeMutation.isPending}
        />
      )}
    </div>
  );
};
