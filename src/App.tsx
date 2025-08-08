import { Routes, Route } from "react-router-dom";
import { Menu } from "./components/Menu";
import { Recipe } from "./components/Recipe";
import { Home } from "./components/Home";
import { Recipes } from "./components/Recipes";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";

const App = () => {
  return (
    <AuthProvider>
      <div className="flex w-full h-[100vh]">
        <Menu />
        <div className="ml-[240px] w-full flex">
          <Routes>
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Home />
                </ProtectedRoute>
              }
            />
            <Route
              path="/recipes/"
              element={
                <ProtectedRoute>
                  <Recipes />
                </ProtectedRoute>
              }
            />
            <Route
              path="/recipes/:recipeId"
              element={
                <ProtectedRoute>
                  <Recipe />
                </ProtectedRoute>
              }
            />
          </Routes>
        </div>
      </div>
    </AuthProvider>
  );
};

export default App;
