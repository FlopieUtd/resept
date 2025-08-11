import { useAuth } from "../contexts/AuthContext";
import { Login } from "./Login";
import { Loading } from "./Loading";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <Loading />;
  }

  if (!user) {
    return <Login />;
  }

  return <>{children}</>;
};
