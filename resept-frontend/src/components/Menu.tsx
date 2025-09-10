import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useRecentRecipes } from "../contexts/RecentRecipesContext";

export const Menu = () => {
  const { user, signOut } = useAuth();
  const { recentRecipes } = useRecentRecipes();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <div className="w-[240px] h-full border-r flex flex-col bg-[#f9f9f9] fixed">
      <Link
        to="/recipes"
        className="px-[12px] py-[6px] border-b hover:bg-[#f0f0f0] cursor-pointer font-bold"
      >
        Recepten
      </Link>

      {recentRecipes.length > 0 && (
        <div className="">
          {recentRecipes.map((recipe) => (
            <Link
              key={recipe.id}
              to={`/recipes/${recipe.id}`}
              className="px-[12px] py-[6px] border-b hover:bg-[#f0f0f0] cursor-pointer flex w-full"
              title={recipe.title}
            >
              {recipe.title}
            </Link>
          ))}
        </div>
      )}

      {user && (
        <div className="mt-auto p-3 border-t">
          <div className="text-sm text-gray-600 mb-2">{user.email}</div>
          <button
            onClick={handleSignOut}
            className="w-full px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
          >
            Uitloggen
          </button>
        </div>
      )}
    </div>
  );
};
