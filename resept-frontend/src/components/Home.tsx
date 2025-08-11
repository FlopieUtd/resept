import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCreateRecipe } from "../lib/recipeService";
import { type DatabaseRecipe } from "../types";

export const Home = () => {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
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
        await handleAutoSave(data);
      } else {
        setError(data.error || "Failed to extract recipe");
      }
    } catch {
      setError("Network error occurred");
    }
  };

  const handleAutoSave = async (extractedRecipe: DatabaseRecipe) => {
    try {
      const recipeData = {
        title: extractedRecipe.title,
        recipe_yield: extractedRecipe.recipe_yield,
        recipe_category: extractedRecipe.recipe_category,
        description: extractedRecipe.description,
        prep_time: extractedRecipe.prep_time,
        cook_time: extractedRecipe.cook_time,
        total_time: extractedRecipe.total_time,
        ingredients: extractedRecipe.ingredients,
        instructions: extractedRecipe.instructions,
        source_url: extractedRecipe.source_url,
      };

      const savedRecipe = await createRecipeMutation.mutateAsync(recipeData);

      if (savedRecipe) {
        setUrl("");
        navigate(`/recipes/${savedRecipe.id}`);
      }
    } catch {
      setError("Error saving recipe to database");
    }
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
    </div>
  );
};
