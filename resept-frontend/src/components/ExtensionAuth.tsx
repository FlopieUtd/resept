import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Loading } from "./Loading";
import { API_URL } from "../utils/constants";

export const ExtensionAuth = () => {
  const { user, session, loading: authLoading } = useAuth();
  const [status, setStatus] = useState<
    "loading" | "success" | "error" | "redirecting"
  >("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    const handleAuth = async () => {
      // Wait for auth to finish loading
      if (authLoading) {
        return;
      }

      try {
        const urlParams = new URLSearchParams(window.location.search);
        const redirectUri = urlParams.get("redirect_uri");
        const originalUrl = urlParams.get("original_url");
        const originalTabIdParam = urlParams.get("original_tab_id");

        if (!redirectUri) {
          if (isMounted) {
            setStatus("error");
            setMessage("Invalid redirect URI");
          }
          return;
        }

        // Store original_url and originalTabId for later use
        if (originalUrl) {
          localStorage.setItem("extension_original_url", originalUrl);
        }
        if (originalTabIdParam) {
          localStorage.setItem("extension_original_tab_id", originalTabIdParam);
        }

        // If user is not logged in, redirect to login
        if (!user || !session) {
          if (isMounted) {
            setStatus("redirecting");
            setMessage("Redirecting to login page...");
          }

          localStorage.setItem("extension_redirect_uri", redirectUri);
          // originalUrl and originalTabId are already stored above

          setTimeout(() => {
            if (isMounted) {
              window.location.href = "/login?from_extension=1";
            }
          }, 1000);
          return;
        }

        // User is logged in - get tokens from backend and redirect to extension
        if (isMounted) {
          setStatus("loading");
          setMessage("Authenticating extension...");
        }

        // Call backend to validate and get tokens
        const backendUrl = API_URL || "http://localhost:8787";
        const response = await fetch(`${backendUrl}/auth/extension/tokens`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            access_token: session.access_token,
            refresh_token: session.refresh_token,
            expires_at: session.expires_at,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to get tokens from backend");
        }

        const tokenData = await response.json();

        // Get original tab ID from URL params or localStorage
        let originalTabId: number | null = null;
        if (originalTabIdParam) {
          originalTabId = parseInt(originalTabIdParam);
        } else {
          const storedTabId = localStorage.getItem("extension_original_tab_id");
          if (storedTabId) {
            originalTabId = parseInt(storedTabId);
          }
        }

        // Send tokens to extension via postMessage
        // The extension's content script will listen for this message
        if (isMounted) {
          setStatus("success");
          setMessage(
            "Authentication successful! Sending tokens to extension..."
          );

          // Send message to extension content script
          window.postMessage(
            {
              type: "EXTENSION_AUTH_TOKENS",
              tokens: {
                jwtToken: tokenData.access_token,
                refreshToken: tokenData.refresh_token || "",
                tokenExpiresAt: tokenData.expires_at?.toString() || "",
              },
              originalUrl: originalUrl || null,
              originalTabId: originalTabId,
            },
            "*"
          );

          // Also try to open extension URL as fallback (in case postMessage doesn't work)
          // But don't rely on it since browsers block it
          setTimeout(() => {
            try {
              window.open(redirectUri, "_blank");
            } catch {
              // Ignore - browsers block this anyway
            }
          }, 500);

          // Close this tab after a delay
          setTimeout(() => {
            window.close();
          }, 2000);
        }
      } catch (error) {
        if (isMounted) {
          console.error("Authentication failed", error);
          setStatus("error");
          setMessage("Authentication failed");
        }
      }
    };

    handleAuth();

    return () => {
      isMounted = false;
    };
  }, [user, session, authLoading]);

  if (status === "loading" || status === "redirecting") {
    return (
      <div className="flex w-full h-screen justify-center items-center">
        <div className="text-center">
          <Loading />
          <p className="mt-4 text-lg">
            {status === "loading"
              ? "Authenticating extension..."
              : "Redirecting to login page..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full h-screen justify-center items-center">
      <div className="text-center max-w-md mx-auto p-6">
        <div
          className={`text-6xl mb-4 ${
            status === "success" ? "text-green-500" : "text-red-500"
          }`}
        >
          {status === "success" ? "✅" : "❌"}
        </div>
        <h1 className="text-2xl font-bold mb-4">
          {status === "success" ? "Success!" : "Error"}
        </h1>
        <p className="text-lg mb-6">{message}</p>
        {status === "success" && (
          <p className="text-sm text-gray-600">
            This window will close automatically...
          </p>
        )}
      </div>
    </div>
  );
};
