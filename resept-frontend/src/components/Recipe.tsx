import { useParams, useNavigate } from "react-router-dom";
import {
  useRecipe,
  useUpdateRecipe,
  useDeleteRecipe,
  useRecipes,
} from "../lib/recipeService";
import {
  type RecipeInstructionItem,
  type CreateRecipeData,
  type IngredientGroup,
  Language,
} from "../types";
import { Loading } from "./Loading";
import { RecipeEditModal } from "./RecipeEditModal";
import {
  PencilSimple,
  ArrowsOutSimple,
  ArrowsInSimple,
} from "@phosphor-icons/react";
import { useState, useEffect } from "react";
import { useRecipeYield } from "../hooks/useRecipeYield";
import { extractDomainFromUrl } from "../utils/extractDomainFromUrl";
import { decodeHtmlEntities } from "../utils/decodeHtmlEntities";
import { formatTime } from "../utils/formatTime";
import { isDurationEmpty } from "../utils/isDurationEmpty";
import { useFullscreen } from "../contexts/FullscreenContext";
import { LABELS } from "../utils/constants";
import { useLanguageDetection } from "../hooks/useLanguageDetection";

export const Recipe = () => {
  const { recipeId } = useParams();
  const navigate = useNavigate();
  const { data: recipe, isLoading, error } = useRecipe(recipeId!);
  const { refetch: refetchRecipes } = useRecipes();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const updateRecipe = useUpdateRecipe();
  const deleteRecipe = useDeleteRecipe();
  const { isFullscreen, setIsFullscreen } = useFullscreen();
  const [activeTab, setActiveTab] = useState<"ingredients" | "instructions">(
    "ingredients"
  );

  const detectedLanguage = useLanguageDetection(
    recipe?.title || "",
    recipe?.description || "",
    recipe?.instructions || []
  );

  const t = LABELS[detectedLanguage];

  const {
    recipeYield,
    incrementRecipeYield,
    decrementRecipeYield,
    scaledGroups,
  } = useRecipeYield({
    originalYield: recipe?.recipe_yield,
    ingredients: (recipe?.ingredients as IngredientGroup[]) || [],
  });

  const formatNumber = (num: number) => {
    return Number(num.toFixed(2)).toString().replace(".", ",");
  };

  useEffect(() => {
    if (recipe?.title) {
      document.title = `${recipe.title} - Resept`;
    }

    return () => {
      document.title = "Resept";
    };
  }, [recipe?.title]);

  if (isLoading && !recipe) {
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
    <div className="flex w-full min-h-screen justify-center items-start">
      <div className="flex w-full max-w-[1080px] mx-[12px] sm:mx-[24px] flex-col justify-center min-h-screen pb-[64px] sm:pb-0">
        <div
          className="flex flex-col border-b-[2px] border-black mb-[24px] mt-[12px] sm:mt-[36px]"
          key={refreshTrigger}
        >
          <div className="flex justify-between items-center mb-[12px] gap-[12px]">
            <h1 className="text-[36px] sm:text-[48px] font-bold text-balance">
              {recipe.title}
            </h1>
            <div className="flex gap-[8px]">
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="bg-white text-black p-[8px] rounded-lg hover:bg-gray-200 transition-colors"
              >
                <PencilSimple size={24} />
              </button>
              <button
                onClick={async () => {
                  if (!document.fullscreenElement) {
                    await document.documentElement.requestFullscreen();
                    setIsFullscreen(true);
                  } else {
                    await document.exitFullscreen();
                    setIsFullscreen(false);
                  }
                }}
                className="hidden sm:flex bg-white text-black p-[8px] rounded-lg hover:bg-gray-200 transition-colors"
              >
                {isFullscreen ? (
                  <ArrowsInSimple size={24} />
                ) : (
                  <ArrowsOutSimple size={24} />
                )}
              </button>
            </div>
          </div>
        </div>
        <div className="mb-[36px] flex flex-col gap-[16px]">
          {recipe.description && (
            <div className="font-radley text-[18px]">{recipe.description}</div>
          )}

          <div className="flex gap-[12px] flex-wrap">
            {recipe.recipe_yield && (
              <div className="bg-[#f9f9f9] text-[14px] flex">
                <button
                  onClick={decrementRecipeYield}
                  className="py-[4px] flex justify-center w-[29px] hover:bg-[#eee]"
                >
                  -
                </button>
                <div className="flex py-[4px] min-w-[100px] justify-center text-center">
                  {detectedLanguage === Language.NL ? (
                    <>
                      {recipeYield || 0}{" "}
                      {recipeYield === 1 ? t.personSingular : t.personPlural}
                    </>
                  ) : (
                    <>
                      {t.serves} {recipeYield || 0}
                    </>
                  )}
                </div>
                <button
                  onClick={incrementRecipeYield}
                  className="py-[4px] flex justify-center w-[29px] hover:bg-[#eee]"
                >
                  +
                </button>
              </div>
            )}
            {recipe.prep_time && !isDurationEmpty(recipe.prep_time) && (
              <div className="bg-[#f9f9f9] py-[4px] px-[16px] text-[14px]">
                {t.prep}: {formatTime(recipe.prep_time)}
              </div>
            )}
            {recipe.cook_time && !isDurationEmpty(recipe.cook_time) && (
              <div className="bg-[#f9f9f9] py-[4px] px-[16px] text-[14px]">
                {t.cook}: {formatTime(recipe.cook_time)}
              </div>
            )}
            {recipe.total_time && !isDurationEmpty(recipe.total_time) && (
              <div className="bg-[#f9f9f9] py-[4px] px-[16px] text-[14px]">
                {t.total}: {formatTime(recipe.total_time)}
              </div>
            )}
            {recipe.source_url && (
              <a href={recipe.source_url} target="_blank">
                <div className="bg-[#f9f9f9] hover:bg-[#eee] py-[4px] px-[16px] text-[14px]">
                  {t.source}: {extractDomainFromUrl(recipe.source_url)}
                </div>{" "}
              </a>
            )}
          </div>
        </div>

        <div className="sm:hidden flex flex-col gap-[24px] pb-[24px]">
          <div className="text-[24px] pb-[12px] font-bold border-b-[2px] border-black tracking-[1px]">
            {activeTab === "ingredients" ? t.ingredients : t.instructions}
          </div>
          {activeTab === "ingredients" ? (
            <div className="flex flex-col gap-[16px]">
              {scaledGroups.map((group, gIndex) => (
                <div key={gIndex}>
                  {group.title && (
                    <div className="font-bold text-[18px] mb-[8px] text-[#333]">
                      {group.title}
                    </div>
                  )}
                  <ul>
                    {group.ingredients.map((ingredient, index: number) => (
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
              ))}
            </div>
          ) : (
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
          )}
        </div>

        <div className="hidden sm:flex gap-[36px] pb-[36px]">
          <div className="w-1/3 flex flex-col gap-[24px]">
            <div className="text-[24px] pb-[12px] font-bold border-b-[2px] border-black tracking-[1px]">
              {t.ingredients}
            </div>
            <div className="flex flex-col gap-[16px]">
              {scaledGroups.map((group, gIndex) => (
                <div key={gIndex}>
                  {group.title && (
                    <div className="font-bold text-[18px] mb-[8px] text-[#333]">
                      {group.title}
                    </div>
                  )}
                  <ul>
                    {group.ingredients.map((ingredient, index: number) => (
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
              ))}
            </div>
          </div>
          <div className="w-2/3 flex flex-col gap-[24px]">
            <div className="text-[24px] pb-[12px] font-bold border-b-[2px] border-black tracking-[1px]">
              {t.instructions}
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
      <div className="sm:hidden fixed bottom-0 left-0 right-0 border-t border-black/10 bg-white">
        <div className="max-w-[1080px] mx-auto flex">
          <button
            onClick={() => setActiveTab("ingredients")}
            className={`flex-1 py-[8px] border-r ${
              activeTab === "ingredients" ? "font-bold" : "bg-[#f9f9f9]"
            }`}
          >
            {t.ingredients}
          </button>
          <button
            onClick={() => setActiveTab("instructions")}
            className={`flex-1 py-[8px] ${
              activeTab === "instructions" ? "font-bold" : "bg-[#f9f9f9]"
            }`}
          >
            {t.instructions}
          </button>
        </div>
      </div>
      <RecipeEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSave}
        onDelete={handleDelete}
        title={t.editRecipe}
        initialData={recipe}
        isSaving={updateRecipe.isPending}
        isDeleting={deleteRecipe.isPending}
        showImport={false}
      />
    </div>
  );
};
