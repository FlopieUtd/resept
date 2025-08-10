import { Link } from "react-router-dom";
import recipesData from "../json/recipes.json";

export const Recipes = () => {
  return (
    <div className="flex w-full h-full justify-center">
      <div className="flex w-full max-w-[1080px] mx-[24px] my-[48px] flex-col">
        <h1 className="text-3xl font-bold mb-6 w-full border-b-2 border-black pb-[12px]">
          Recepten
        </h1>
        <div className="grid grid-cols-3 gap-4">
          {recipesData.map((recipe, index) => (
            <Link
              key={index}
              to={`/recipes/${index}`}
              className="block p-4 border-2 border-black hover:bg-gray-100 cursor-pointer"
            >
              <h2 className="text-xl font-semibold mb-2 min-h-[56px]">
                {recipe.name}
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
