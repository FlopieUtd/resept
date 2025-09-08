import { Link } from "react-router-dom";
import { useRecipes, useCreateRecipe } from "../lib/recipeService";
import { Loading } from "./Loading";
import { formatTime } from "../utils/formatTime";
import { RecipeEditModal } from "./RecipeEditModal";
import { PlusIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { type CreateRecipeData } from "../types";

export const Recipes = () => {
  const { data: recipes, isLoading, error, refetch } = useRecipes();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const createRecipe = useCreateRecipe();

  const handleSave = async (recipeData: CreateRecipeData) => {
    try {
      await createRecipe.mutateAsync(recipeData);
      setIsEditModalOpen(false);
      // Manually refetch recipes to ensure the list updates
      await refetch();
      // Force component re-render
      setRefreshTrigger((prev) => prev + 1);
    } catch (error) {
      console.error("Failed to create recipe:", error);
    }
  };

  const handleClose = () => {
    setIsEditModalOpen(false);
  };

  return (
    <div className="flex w-full h-full justify-center">
      <div className="flex w-full max-w-[1080px] mx-[24px] my-[48px] flex-col">
        <div className="flex justify-between items-center mb-6 w-full border-b-2 border-black pb-[12px]">
          <h1 className="text-3xl font-bold">Recepten</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="bg-white text-black p-3 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <PlusIcon size={24} />
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex w-full h-full justify-center items-center py-8">
            <Loading />
          </div>
        ) : error ? (
          <div className="flex w-full justify-center items-center py-8">
            <div className="text-[24px] text-red-600">
              {error instanceof Error
                ? error.message
                : "Failed to fetch recipes"}
            </div>
          </div>
        ) : !recipes || recipes.length === 0 ? (
          <div className="flex w-full justify-center items-center py-8">
            <div className="text-[24px] text-gray-500">No recipes found</div>
          </div>
        ) : (
          <div
            className="grid grid-cols-2 gap-4 pb-[32px]"
            key={refreshTrigger}
          >
            {recipes.map((recipe) => (
              <Link
                key={recipe.id}
                to={`/recipes/${recipe.id}`}
                className="flex flex-col cursor-pointer bg-[#f9f9f9] hover:bg-[#eee] p-[12px] gap-[6px]"
              >
                <h2 className="text-xl font-semibold line-clamp-3 overflow-hidden">
                  {recipe.title}
                </h2>
                <div className="flex gap-[6px] items-center text-[14px]">
                  {recipe.total_time && (
                    <div className="">{formatTime(recipe.total_time)}</div>
                  )}
                  {recipe.total_time && <div>●</div>}
                  {recipe.recipe_category && (
                    <div className="">
                      {recipe.ingredients.length} ingrediënten
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
      <RecipeEditModal
        isOpen={isEditModalOpen}
        onClose={handleClose}
        onSave={handleSave}
        title="Nieuw recept"
        initialData={{
          title: "",
          recipe_yield: 1,
          recipe_category: "",
          description: "",
          prep_time: "",
          cook_time: "",
          total_time: "",
          ingredients: [{ raw: "" }],
          instructions: [{ text: "" }],
          source_url: "",
        }}
        isSaving={createRecipe.isPending}
      />
    </div>
  );
};
