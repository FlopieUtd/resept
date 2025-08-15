import { useParams } from "react-router-dom";
import { useRecipe } from "../lib/recipeService";
import { type IngredientLine, type RecipeInstructionItem } from "../types";
import { Loading } from "./Loading";

export const Recipe = () => {
  const { recipeId } = useParams();
  const { data: recipe, isLoading, error } = useRecipe(recipeId!);

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

  const formatTime = (timeString: string) => {
    if (!timeString) return "0 min";

    const match = timeString.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (match) {
      const hours = parseInt(match[1] || "0");
      const minutes = parseInt(match[2] || "0");
      const seconds = parseInt(match[3] || "0");

      if (hours > 0 && minutes > 0) {
        return `${hours} uur ${minutes} min`;
      } else if (hours > 0) {
        return `${hours} uur`;
      } else if (minutes > 0) {
        return `${minutes} min`;
      } else if (seconds > 0) {
        return `${seconds} sec`;
      }
    }

    if (
      timeString.includes("m") ||
      timeString.includes("h") ||
      timeString.includes("u")
    ) {
      return timeString;
    }

    return "0 min";
  };

  return (
    <div className="flex w-full h-full justify-center">
      <div className="flex w-full max-w-[1080px] mx-[24px] my-[48px] flex-col">
        <div className="flex flex-col border-b-[2px] border-black mb-[24px]">
          <div className="text-[48px] font-bold mb-[12px]">{recipe.title}</div>
        </div>
        <div className=" mb-[36px] mt-[6px]">
          <div className="font-radley text-[18px]">{recipe.description}</div>
          <div className="flex mt-[16px] gap-[12px] ">
            {recipe.recipe_yield && (
              <div className="bg-[#f9f9f9] py-[4px] px-[16px] text-[14px]">
                {recipe.recipe_yield} personen
              </div>
            )}
            {recipe.prep_time && (
              <div className="bg-[#f9f9f9] py-[4px] px-[16px] text-[14px]">
                Bereiding: {formatTime(recipe.prep_time)}
              </div>
            )}
            {recipe.cook_time && (
              <div className="bg-[#f9f9f9] py-[4px] px-[16px] text-[14px]">
                Kooktijd: {formatTime(recipe.cook_time)}
              </div>
            )}
            {recipe.total_time && (
              <div className="bg-[#f9f9f9] py-[4px] px-[16px] text-[14px]">
                Totaal: {formatTime(recipe.total_time)}
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-[36px] pb-[72px]">
          <div className="w-1/3 flex flex-col gap-[24px]">
            <div className="text-[24px] pb-[12px] font-bold border-b-[2px] border-black tracking-[1px]">
              Ingrediënten
            </div>
            <ul>
              {recipe.ingredients.map(
                (ingredient: IngredientLine, index: number) => (
                  <li key={index} className="pb-[16px] flex">
                    {ingredient.raw}
                  </li>
                )
              )}
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
    </div>
  );
};
