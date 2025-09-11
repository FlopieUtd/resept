import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { ArrowLeft } from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import { Input } from "./Input";

export const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isValidToken, setIsValidToken] = useState(false);
  const { updatePassword, user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (user) {
        setIsValidToken(true);
      } else {
        setError("Invalid or expired recovery link. Please request a new one.");
      }
    }
  }, [loading, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    setIsLoading(true);

    try {
      await updatePassword(password);
      navigate("/login", {
        state: {
          message:
            "Password updated successfully! Please sign in with your new password.",
        },
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update password"
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex w-full h-full justify-center items-center">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white p-8 rounded-lg shadow-lg">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-4"></div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Verifying Recovery Link
              </h1>
              <p className="text-gray-600">
                Please wait while we verify your recovery link...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isValidToken) {
    return (
      <div className="flex w-full h-full justify-center items-center">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white p-8 rounded-lg shadow-lg">
            <div className="mb-6">
              <Link
                to="/login"
                className="inline-flex items-center text-red-600 hover:text-red-800 mb-4"
              >
                <ArrowLeft size={20} className="mr-2" />
                Back to Login
              </Link>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Invalid Recovery Link
              </h1>
              <p className="text-gray-600">
                {error || "This recovery link is invalid or has expired."}
              </p>
            </div>
            <div className="text-center">
              <Link
                to="/password-recovery"
                className="inline-block bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                Request New Recovery Email
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full h-full justify-center items-center">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white p-8 rounded-lg shadow-lg">
          <div className="mb-6">
            <Link
              to="/login"
              className="inline-flex items-center text-red-600 hover:text-red-800 mb-4"
            >
              <ArrowLeft size={20} className="mr-2" />
              Back to Login
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Set New Password
            </h1>
            <p className="text-gray-600">Enter your new password below.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="New Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter new password"
              required
              disabled={isLoading}
              minLength={6}
            />

            <Input
              label="Confirm New Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              required
              disabled={isLoading}
              minLength={6}
            />

            {error && (
              <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={
                isLoading || !password.trim() || !confirmPassword.trim()
              }
              className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? "Updating..." : "Update Password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
