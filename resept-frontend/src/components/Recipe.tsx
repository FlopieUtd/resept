import { useParams, useNavigate } from "react-router-dom";
import {
  useRecipe,
  useUpdateRecipe,
  useDeleteRecipe,
  useRecipes,
} from "../lib/recipeService";
import {
  type InstructionGroup,
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
  CaretLeft,
} from "@phosphor-icons/react";
import { useState, useEffect, useRef } from "react";
import { useRecipeYield } from "../hooks/useRecipeYield";
import { extractDomainFromUrl } from "../utils/extractDomainFromUrl";
import { decodeHtmlEntities } from "../utils/decodeHtmlEntities";
import { formatTime } from "../utils/formatTime";
import { isDurationEmpty } from "../utils/isDurationEmpty";
import { useFullscreen } from "../contexts/FullscreenContext";
import { LABELS } from "../utils/constants";
import { useLanguageDetection } from "../hooks/useLanguageDetection";
import { HeaderIconButton } from "./HeaderIconButton";

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
  const headerRef = useRef<HTMLDivElement>(null);
  const [headerOffset, setHeaderOffset] = useState(0);

  const normalizedInstructions =
    (recipe?.instructions as InstructionGroup[]) || [];

  const detectedLanguage = useLanguageDetection(
    recipe?.title || "",
    recipe?.description || "",
    normalizedInstructions
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

  useEffect(() => {
    const updateOffset = () => {
      if (headerRef.current) {
        setHeaderOffset(headerRef.current.getBoundingClientRect().height);
      }
    };
    updateOffset();
    window.addEventListener("resize", updateOffset);
    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined" && headerRef.current) {
      observer = new ResizeObserver(updateOffset);
      observer.observe(headerRef.current);
    }
    return () => {
      window.removeEventListener("resize", updateOffset);
      observer?.disconnect();
    };
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [recipeId]);

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
    <div className="flex w-full min-h-[100dvh] justify-center items-start">
      <div className="flex w-full max-w-[1080px] mx-[16px] sm:mx-[24px] lg:justify-center flex-col min-h-[100dvh]">
        <div
          ref={headerRef}
          className="flex flex-col border-b-[2px] border-black mb-[12px] sm:mb-[24px] sticky top-0 bg-white z-10"
          key={refreshTrigger}
        >
          <div className="flex justify-between items-center py-[6px] sm:py-[12px] gap-[12px]">
            <div className="flex gap-[12px]  items-center">
              <HeaderIconButton
                icon={CaretLeft}
                to="/recipes"
                className="lg:hidden"
              />
              <h1 className="text-[24px] sm:text-[36px] lg:text-[48px] font-bold text-balance py-[8px]">
                {recipe.title}
              </h1>
            </div>
            <div className="flex gap-[8px]">
              <HeaderIconButton
                icon={PencilSimple}
                onClick={() => setIsEditModalOpen(true)}
              />
              <HeaderIconButton
                icon={isFullscreen ? ArrowsInSimple : ArrowsOutSimple}
                className="hidden sm:flex"
                onClick={async () => {
                  if (!document.fullscreenElement) {
                    await document.documentElement.requestFullscreen();
                    setIsFullscreen(true);
                  } else {
                    await document.exitFullscreen();
                    setIsFullscreen(false);
                  }
                }}
              />
            </div>
          </div>
        </div>
        <div className="mb-[16px] flex flex-col gap-[16px] px-[2px]">
          {recipe.description && (
            <div className="font-radley text-[18px] whitespace-pre-line">
              {recipe.description}
            </div>
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
          <div
            className="flex border-b-[2px] border-black gap-[24px] sticky bg-white pt-[12px] z-5"
            style={{ top: headerOffset }}
          >
            <button
              className="text-[16px] pb-[12px] tracking-[1px]"
              style={{
                fontWeight: activeTab === "ingredients" ? "bold" : "normal",
              }}
              onClick={() => setActiveTab("ingredients")}
            >
              {t.ingredients}
            </button>
            <button
              className="text-[16px] pb-[12px] tracking-[1px]"
              style={{
                fontWeight: activeTab === "instructions" ? "bold" : "normal",
              }}
              onClick={() => setActiveTab("instructions")}
            >
              {t.instructions}
            </button>
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
                        <span className="min-w-[60px]">
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
              {normalizedInstructions.length === 0 ? (
                <div>No instructions found</div>
              ) : (
                normalizedInstructions.map(
                  (group: InstructionGroup, groupIndex: number) => {
                    if (!group || !group.instructions) {
                      return null;
                    }
                    return (
                      <div key={groupIndex} className="sm:pb-[16px]">
                        {group.title && (
                          <div className="font-sans font-bold text-[20px] mb-[12px] text-[#333]">
                            {group.title}
                          </div>
                        )}
                        {group.instructions.map((instruction, index) => (
                          <div key={index} className="pb-[12px]">
                            {instruction.text}
                          </div>
                        ))}
                      </div>
                    );
                  }
                )
              )}
            </div>
          )}
        </div>

        <div className="hidden sm:flex gap-[24px] pb-[36px]">
          <div className="w-1/3 flex flex-col gap-[24px]">
            <div
              className="text-[22px] py-[12px] font-bold border-b-[2px] border-black tracking-[1px] sticky bg-white z-5"
              style={{ top: headerOffset }}
            >
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
                        <span className="min-w-[60px]">
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
            <div
              className="text-[22px] py-[12px] font-bold border-b-[2px] border-black tracking-[1px] sticky bg-white z-5"
              style={{ top: headerOffset }}
            >
              {t.instructions}
            </div>
            <div className="font-radley text-[18px]">
              {normalizedInstructions.length === 0 ? (
                <div>No instructions found</div>
              ) : (
                normalizedInstructions.map(
                  (group: InstructionGroup, groupIndex: number) => {
                    if (!group || !group.instructions) {
                      return null;
                    }
                    return (
                      <div key={groupIndex} className="sm:pb-[16px]">
                        {group.title && (
                          <div className="font-sans font-bold text-[18px] mb-[12px] text-[#333]">
                            {group.title}
                          </div>
                        )}
                        {group.instructions.map((instruction, index) => (
                          <div key={index} className="pb-[12px]">
                            {instruction.text}
                          </div>
                        ))}
                      </div>
                    );
                  }
                )
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
        title={t.editRecipe}
        initialData={recipe}
        isSaving={updateRecipe.isPending}
        isDeleting={deleteRecipe.isPending}
        showImport={false}
      />
    </div>
  );
};
