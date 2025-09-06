import { Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Menu } from "./components/Menu";
import { Recipe } from "./components/Recipe";
import { Home } from "./components/Home";
import { Recipes } from "./components/Recipes";
import { Login } from "./components/Login";
import { PasswordRecovery } from "./components/PasswordRecovery";
import { ResetPassword } from "./components/ResetPassword";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";

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
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/password-recovery" element={<PasswordRecovery />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route
            path="/"
            element={
              <div className="flex w-full h-[100vh]">
                <Menu />
                <div className="ml-[240px] w-full flex">
                  <ProtectedRoute>
                    <Home />
                  </ProtectedRoute>
                </div>
              </div>
            }
          />
          <Route
            path="/recipes/"
            element={
              <div className="flex w-full h-[100vh]">
                <Menu />
                <div className="ml-[240px] w-full flex">
                  <ProtectedRoute>
                    <Recipes />
                  </ProtectedRoute>
                </div>
              </div>
            }
          />
          <Route
            path="/recipes/:recipeId"
            element={
              <div className="flex w-full h-[100vh]">
                <Menu />
                <div className="ml-[240px] w-full flex">
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
