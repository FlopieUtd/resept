import { Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Menu } from "./components/Menu";
import { Recipe } from "./components/Recipe";
import { Home } from "./components/Home";
import { Recipes } from "./components/Recipes";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
    },
  },
});

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
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
    </QueryClientProvider>
  );
};

export default App;
