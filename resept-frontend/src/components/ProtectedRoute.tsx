interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  // const { user, loading } = useAuth();
  // const navigate = useNavigate();

  // useEffect(() => {
  //   if (!loading && !user) {
  //     alert("redirecting to login");
  //     navigate("/login");
  //   }
  // }, [user, loading, navigate]);

  // if (loading) {
  //   return <Loading />;
  // }

  // if (!user) {
  //   return null;
  // }

  return <>{children}</>;
};
