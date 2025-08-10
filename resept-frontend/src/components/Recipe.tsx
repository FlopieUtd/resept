import recipesData from "../json/recipes.json";
import { useParams } from "react-router-dom";
import type { IngredientLine, Recipe as RecipeType } from "../types";
import { UNIT_LABEL_MAP } from "../consts";

const recipes = recipesData as Array<RecipeType>;

export const Recipe = () => {
  const { recipeId } = useParams();
  const recipeIndex = parseInt(recipeId || "0");
  const recipe = recipes[recipeIndex];

  if (!recipe) {
    return (
      <div className="flex w-full h-full justify-center items-center">
        <div className="text-[24px]">Couldn't find recipe</div>
      </div>
    );
  }

  const formatTime = (timeString: string) => {
    const match = timeString.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
    if (match) {
      const hours = parseInt(match[1] || "0");
      const minutes = parseInt(match[2] || "0");

      if (hours > 0 && minutes > 0) {
        return `${hours} uur ${minutes} min`;
      } else if (hours > 0) {
        return `${hours} uur`;
      } else if (minutes > 0) {
        return `${minutes} min`;
      }
    }
    return timeString;
  };

  const formatIngredientAmount = (ingredient: IngredientLine) => {
    if (ingredient.amount === undefined) return "";

    if (ingredient.amountMax !== undefined) {
      return `${ingredient.amount}-${ingredient.amountMax}`;
    } else {
      return ingredient.amount.toString();
    }
  };

  const formatIngredientRest = (ingredient: IngredientLine) => {
    let rest = "";

    if (ingredient.unit) {
      rest += `${UNIT_LABEL_MAP[ingredient.unit]} `;
    }

    if (ingredient.qualifier) {
      rest += `${ingredient.qualifier} `;
    }

    if (ingredient.name) {
      rest += ingredient.name;
    }

    if (ingredient.note) {
      rest += ` (${ingredient.note})`;
    }

    return rest.trim();
  };

  return (
    <div className="flex w-full h-full justify-center">
      <div className="flex w-full max-w-[1080px] mx-[24px] my-[48px] flex-col">
        <div className="flex flex-col border-b-[2px] border-black mb-[24px]">
          <div className="text-[48px] font-bold mb-[12px]">{recipe.name}</div>
        </div>
        <div className=" mb-[36px] mt-[6px]">
          <div className="font-radley text-[18px]">{recipe.description}</div>
          <div className="flex mt-[16px] gap-[12px] ">
            <div className="bg-[#f9f9f9] py-[4px] px-[16px] text-[14px]">
              {recipe.recipeYield}
            </div>
            <div className="bg-[#f9f9f9] py-[4px] px-[16px] text-[14px]">
              Bereiding: {formatTime(recipe.prepTime)}
            </div>
            <div className="bg-[#f9f9f9] py-[4px] px-[16px] text-[14px]">
              Kooktijd: {formatTime(recipe.cookTime)}
            </div>
            <div className="bg-[#f9f9f9] py-[4px] px-[16px] text-[14px]">
              Totaal: {formatTime(recipe.totalTime)}
            </div>
          </div>
        </div>

        <div className="flex gap-[36px] pb-[72px]">
          <div className="w-1/3 flex flex-col gap-[24px]">
            <div className="text-[24px] pb-[12px] font-bold border-b-[2px] border-black tracking-[1px]">
              Ingrediënten
            </div>
            <ul>
              {recipe.recipeIngredient.map((ingredient, index) => (
                <li key={index} className="pb-[16px] flex">
                  <span className="w-[50px] flex-shrink-0">
                    {formatIngredientAmount(ingredient)}
                  </span>
                  <span className="flex-1">
                    {formatIngredientRest(ingredient)}
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
              {recipe.recipeInstructions.map((instruction, index) => (
                <div key={index} className="pb-[16px]">
                  {instruction.text}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
