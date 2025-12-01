import { type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { Loading } from "./Loading";
import { useAuth } from "../contexts/AuthContext";
import { Menu } from "./Menu";
import { useFullscreen } from "../contexts/FullscreenContext";

interface ProtectedRouteProps {
  children: ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const { isFullscreen } = useFullscreen();

  if (loading) {
    return <Loading />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex w-full h-[100vh]">
      {!isFullscreen && <Menu />}
      <div
        className={
          isFullscreen ? "ml-0 w-full flex" : "lg:ml-[240px] w-full flex"
        }
      >
        {children}
      </div>
    </div>
  );
};
