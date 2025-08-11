import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { recipeService } from "../lib/recipeService";
import { type DatabaseRecipe } from "../types";
import { Loading } from "./Loading";

export const Recipes = () => {
  const [recipes, setRecipes] = useState<DatabaseRecipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        const recipesData = await recipeService.getUserRecipes();
        setRecipes(recipesData);
      } catch (err) {
        setError("Failed to fetch recipes");
        console.error("Error fetching recipes:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRecipes();
  }, []);

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return (
      <div className="flex w-full h-full justify-center items-center">
        <div className="text-[24px] text-red-600">{error}</div>
      </div>
    );
  }

  if (recipes.length === 0) {
    return (
      <div className="flex w-full h-full justify-center items-center">
        <div className="text-[24px] text-gray-500">No recipes found</div>
      </div>
    );
  }

  return (
    <div className="flex w-full h-full justify-center">
      <div className="flex w-full max-w-[1080px] mx-[24px] my-[48px] flex-col">
        <h1 className="text-3xl font-bold mb-6 w-full border-b-2 border-black pb-[12px]">
          Recepten
        </h1>
        <div className="grid grid-cols-3 gap-4">
          {recipes.map((recipe) => (
            <Link
              key={recipe.id}
              to={`/recipes/${recipe.id}`}
              className="block p-4 border-2 border-black hover:bg-gray-100 cursor-pointer"
            >
              <h2 className="text-xl font-semibold mb-2 min-h-[56px]">
                {recipe.title}
              </h2>
              <p className="text-black mb-2 line-clamp-3 font-radley">
                {recipe.description}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};
