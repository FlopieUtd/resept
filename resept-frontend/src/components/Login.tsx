import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Link } from "react-router-dom";
import { Input } from "./Input";
import garlicImage from "../assets/garlic.png";

export const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { signIn, signUp, user } = useAuth();

  const location = useLocation();
  const navigate = useNavigate();
  const successMessage = location.state?.message;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (isSignUp) {
        await signUp(email, password);
        setError("Controleer je e-mail om je account te bevestigen!");
      } else {
        await signIn(email, password);

        const params = new URLSearchParams(location.search);
        const fromExtension = params.get("from_extension") === "1";

        if (fromExtension) {
          const extensionRedirectUri = localStorage.getItem(
            "extension_redirect_uri"
          );
          const originalUrl = localStorage.getItem("extension_original_url");
          const originalTabId = localStorage.getItem(
            "extension_original_tab_id"
          );

          if (extensionRedirectUri) {
            localStorage.removeItem("extension_redirect_uri");
            let redirectUrl = `/auth/extension?redirect_uri=${encodeURIComponent(
              extensionRedirectUri
            )}`;
            if (originalUrl) {
              redirectUrl += `&original_url=${encodeURIComponent(originalUrl)}`;
            }
            if (originalTabId) {
              redirectUrl += `&original_tab_id=${encodeURIComponent(
                originalTabId
              )}`;
            }
            navigate(redirectUrl);
            return;
          }
        } else {
          localStorage.removeItem("extension_redirect_uri");
          localStorage.removeItem("extension_original_url");
          localStorage.removeItem("extension_original_tab_id");
        }

        navigate("/");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Er is een fout opgetreden"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      navigate("/", { replace: true });
    }
  }, [user, navigate]);

  return (
    <div className="flex w-full h-full justify-center items-center">
      <div className="w-full max-w-[400px] p-[16px] bg-white">
        <h2 className="text-[48px] font-bold mb-[24px] text-center tracking-[6px]">
          Resept
        </h2>
        <div className="flex justify-center w-full mb-[24px]">
          <img src={garlicImage} className="w-[100px] md:w-[140px]" />
        </div>
        {successMessage && (
          <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
            {successMessage}
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="E-mail"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Input
            label="Wachtwoord"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
          >
            {isSignUp ? "Registreren" : "Inloggen"}
          </button>
        </form>

        <div className="mt-4 text-center space-y-2">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-red-600 hover:text-red-800 block w-full"
          >
            {isSignUp
              ? "Heb je al een account? Inloggen"
              : "Nog geen account? Registreren"}
          </button>

          {!isSignUp && (
            <Link
              to="/password-recovery"
              className="text-red-600 hover:text-red-800 block w-full"
            >
              Wachtwoord vergeten?
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};
