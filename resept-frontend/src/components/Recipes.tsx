import { Link } from "react-router-dom";
import { useRecipes } from "../lib/recipeService";
import { Loading } from "./Loading";
import { formatTime } from "../utils/formatTime";

export const Recipes = () => {
  const { data: recipes, isLoading, error } = useRecipes();

  return (
    <div className="flex w-full h-full justify-center">
      <div className="flex w-full max-w-[1080px] mx-[24px] my-[48px] flex-col">
        <h1 className="text-3xl font-bold mb-6 w-full border-b-2 border-black pb-[12px]">
          Recepten
        </h1>

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
          <div className="grid grid-cols-2 gap-4">
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
                  <div>{recipe.recipe_category && recipe.recipe_category}</div>
                  <div>●</div>
                  {recipe.total_time && (
                    <div className="">{formatTime(recipe.total_time)}</div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
