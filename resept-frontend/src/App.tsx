import { Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Menu } from "./components/Menu";
import { Recipe } from "./components/Recipe";
import { Recipes } from "./components/Recipes";
import { Login } from "./components/Login";
import { PasswordRecovery } from "./components/PasswordRecovery";
import { ResetPassword } from "./components/ResetPassword";
import { ExtensionAuth } from "./components/ExtensionAuth";
import NoRecipe from "./components/NoRecipe";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { useFullscreen } from "./contexts/FullscreenContext";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0, // Always consider queries stale so they refetch immediately
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: true, // Refetch when window regains focus
      refetchOnMount: true, // Refetch when component mounts
      refetchOnReconnect: true, // Refetch when reconnecting to network
    },
    mutations: {
      retry: 1, // Retry failed mutations once
      retryDelay: 1000, // Wait 1 second before retrying
    },
  },
});

const App = () => {
  const { isFullscreen } = useFullscreen();
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/recipes" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/password-recovery" element={<PasswordRecovery />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/auth/extension" element={<ExtensionAuth />} />
          <Route path="/no-recipe" element={<NoRecipe />} />

          <Route
            path="/recipes/"
            element={
              <div className="flex w-full h-[100vh]">
                {!isFullscreen && <Menu />}
                <div
                  className={
                    isFullscreen
                      ? "ml-0 w-full flex"
                      : "lg:ml-[240px] w-full flex"
                  }
                >
                  <ProtectedRoute>
                    <Recipes />
                  </ProtectedRoute>
                </div>
              </div>
            }
            index
          />
          <Route
            path="/recipes/:recipeId"
            element={
              <div className="flex w-full h-[100vh]">
                {!isFullscreen && <Menu />}
                <div
                  className={
                    isFullscreen
                      ? "ml-0 w-full flex"
                      : "lg:ml-[240px] w-full flex"
                  }
                >
                  <ProtectedRoute>
                    <Recipe />
                  </ProtectedRoute>
                </div>
              </div>
            }
          />
        </Routes>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
