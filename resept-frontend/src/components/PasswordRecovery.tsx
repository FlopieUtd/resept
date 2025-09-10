import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { ArrowLeft } from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import { Input } from "./Input";

export const PasswordRecovery = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const { resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");
    setError("");

    try {
      await resetPassword(email);
      setMessage("Password recovery email sent! Check your inbox.");
      setEmail("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to send recovery email"
      );
    } finally {
      setIsLoading(false);
    }
  };

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
              Reset Password
            </h1>
            <p className="text-gray-600">
              Enter your email address and we'll send you a link to reset your
              password.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              disabled={isLoading}
            />

            {message && (
              <div className="p-3 bg-green-100 border border-green-400 text-green-700 rounded-md">
                {message}
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !email.trim()}
              className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? "Sending..." : "Send Recovery Email"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
