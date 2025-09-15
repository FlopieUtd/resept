import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export const Menu = () => {
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <div className="w-[240px] h-full border-r flex-col bg-[#f9f9f9] fixed lg:flex hidden">
      <Link
        to="/recipes"
        className="px-[12px] py-[6px] border-b hover:bg-[#f0f0f0] cursor-pointer font-bold"
      >
        Recepten
      </Link>

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
