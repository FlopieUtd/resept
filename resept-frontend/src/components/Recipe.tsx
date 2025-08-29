import { useParams, useNavigate } from "react-router-dom";
import {
  useRecipe,
  useUpdateRecipe,
  useDeleteRecipe,
  useRecipes,
} from "../lib/recipeService";
import { type RecipeInstructionItem, type CreateRecipeData } from "../types";
import { Loading } from "./Loading";
import { RecipeEditModal } from "./RecipeEditModal";
import { PencilSimple } from "@phosphor-icons/react";
import { useState } from "react";
import { useRecipeYield } from "../hooks/useRecipeYield";
import { extractDomainFromUrl } from "../utils/extractDomainFromUrl";
import { decodeHtmlEntities } from "../utils/decodeHtmlEntities";
import { formatTime } from "../utils/formatTime";
import { isDurationEmpty } from "../utils/isDurationEmpty";

export const Recipe = () => {
  const { recipeId } = useParams();
  const navigate = useNavigate();
  const { data: recipe, isLoading, error } = useRecipe(recipeId!);
  const { refetch: refetchRecipes } = useRecipes();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const updateRecipe = useUpdateRecipe();
  const deleteRecipe = useDeleteRecipe();

  const {
    recipeYield,
    incrementRecipeYield,
    decrementRecipeYield,
    scaledIngredients,
  } = useRecipeYield({
    originalYield: recipe?.recipe_yield,
    ingredients: recipe?.ingredients || [],
  });

  const formatNumber = (num: number) => {
    return Number(num.toFixed(2)).toString().replace(".", ",");
  };

  if (isLoading) {
    return <Loading />;
  }

  if (error || !recipe) {
    return (
      <div className="flex w-full h-full justify-center items-center">
        <div className="text-[24px]">
          {error instanceof Error ? error.message : "Couldn't find recipe"}
        </div>
      </div>
    );
  }

  const handleSave = async (recipeData: CreateRecipeData) => {
    if (!recipeId) return;

    try {
      await updateRecipe.mutateAsync({
        recipeId,
        updates: recipeData,
      });
      setIsEditModalOpen(false);
      // Force component re-render
      setRefreshTrigger((prev) => prev + 1);
    } catch (error) {
      console.error("Failed to update recipe:", error);
    }
  };

  const handleDelete = async () => {
    if (!recipeId) return;

    try {
      await deleteRecipe.mutateAsync(recipeId);
      // Refetch recipes list before navigating to ensure it's up to date
      await refetchRecipes();
      navigate("/recipes");
    } catch (error) {
      console.error("Failed to delete recipe:", error);
    }
  };

  return (
    <div className="flex w-full h-full justify-center">
      <div className="flex w-full max-w-[1080px] mx-[24px] my-[48px] flex-col">
        <div
          className="flex flex-col border-b-[2px] border-black mb-[24px]"
          key={refreshTrigger}
        >
          <div className="flex justify-between items-center mb-[12px]">
            <div className="text-[48px] font-bold">{recipe.title}</div>
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="bg-white text-black p-3 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <PencilSimple size={24} />
            </button>
          </div>
        </div>
        <div className=" mb-[36px] flex flex-col gap-[16px]">
          {recipe.description && (
            <div className="font-radley text-[18px]">{recipe.description}</div>
          )}

          <div className="flex gap-[12px] ">
            {recipe.recipe_yield && (
              <div className="bg-[#f9f9f9] text-[14px] flex">
                <button
                  onClick={decrementRecipeYield}
                  className="py-[4px] px-[12px] hover:bg-[#eee]"
                >
                  -
                </button>
                <div className="flex py-[4px] px-[12px] min-w-[106px] justify-center">
                  {recipeYield || 0}{" "}
                  {recipeYield === 1 ? "persoon" : "personen"}
                </div>
                <button
                  onClick={incrementRecipeYield}
                  className="py-[4px] px-[12px] hover:bg-[#eee]"
                >
                  +
                </button>
              </div>
            )}
            {recipe.prep_time && !isDurationEmpty(recipe.prep_time) && (
              <div className="bg-[#f9f9f9] py-[4px] px-[16px] text-[14px]">
                Bereiding: {formatTime(recipe.prep_time)}
              </div>
            )}
            {recipe.cook_time && !isDurationEmpty(recipe.cook_time) && (
              <div className="bg-[#f9f9f9] py-[4px] px-[16px] text-[14px]">
                Kooktijd: {formatTime(recipe.cook_time)}
              </div>
            )}
            {recipe.total_time && !isDurationEmpty(recipe.total_time) && (
              <div className="bg-[#f9f9f9] py-[4px] px-[16px] text-[14px]">
                Totaal: {formatTime(recipe.total_time)}
              </div>
            )}
            {recipe.source_url && (
              <a href={recipe.source_url} target="_blank">
                <div className="bg-[#f9f9f9] hover:bg-[#eee] py-[4px] px-[16px] text-[14px]">
                  Bron: {extractDomainFromUrl(recipe.source_url)}
                </div>{" "}
              </a>
            )}
          </div>
        </div>

        <div className="flex gap-[36px] pb-[72px]">
          <div className="w-1/3 flex flex-col gap-[24px]">
            <div className="text-[24px] pb-[12px] font-bold border-b-[2px] border-black tracking-[1px]">
              Ingrediënten
            </div>
            <ul>
              {scaledIngredients.map((ingredient, index: number) => (
                <li key={index} className="pb-[16px] flex">
                  <span className="min-w-[65px]">
                    {ingredient.scaledAmountMax !== undefined
                      ? `${formatNumber(
                          ingredient.scaledAmount!
                        )}-${formatNumber(ingredient.scaledAmountMax)}`
                      : ingredient.scaledAmount !== undefined
                      ? formatNumber(ingredient.scaledAmount)
                      : ingredient.parsed?.amountMax !== undefined
                      ? `${formatNumber(
                          ingredient.parsed.amount!
                        )}-${formatNumber(ingredient.parsed.amountMax)}`
                      : ingredient.parsed?.amount !== undefined
                      ? formatNumber(ingredient.parsed.amount)
                      : ""}
                  </span>
                  <span>
                    {decodeHtmlEntities(
                      ingredient.parsed?.rawWithoutAmount || ""
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div className="w-2/3 flex flex-col gap-[24px]">
            <div className="text-[24px] pb-[12px] font-bold border-b-[2px] border-black tracking-[1px]">
              Instructies
            </div>
            <div className="font-radley text-[18px]">
              {recipe.instructions.map(
                (instruction: RecipeInstructionItem, index: number) => {
                  if ("type" in instruction && instruction.type === "section") {
                    return (
                      <div key={index} className="pb-[16px]">
                        <div className="font-bold text-[20px] mb-[12px] text-[#333]">
                          {instruction.name}
                        </div>
                        {instruction.steps.map((step, stepIndex) => (
                          <div key={stepIndex} className="pb-[12px] ml-[16px]">
                            {step.text}
                          </div>
                        ))}
                      </div>
                    );
                  } else if ("text" in instruction) {
                    return (
                      <div key={index} className="pb-[16px]">
                        {instruction.text}
                      </div>
                    );
                  }
                  return null;
                }
              )}
            </div>
          </div>
        </div>
      </div>

      <RecipeEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSave}
        onDelete={handleDelete}
        title="Bewerk recept"
        initialData={recipe}
        isSaving={updateRecipe.isPending}
        isDeleting={deleteRecipe.isPending}
      />
    </div>
  );
};
