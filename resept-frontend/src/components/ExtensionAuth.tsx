import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Loading } from "./Loading";

export const ExtensionAuth = () => {
  const { user, session } = useAuth();
  const [status, setStatus] = useState<
    "loading" | "success" | "error" | "redirecting"
  >("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    const handleAuth = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const redirectUri = urlParams.get("redirect_uri");

        if (!redirectUri) {
          if (isMounted) {
            setStatus("error");
            setMessage("Invalid redirect URI");
          }
          return;
        }

        if (!user || !session) {
          if (isMounted) {
            setStatus("redirecting");
            setMessage("Redirecting to login page...");
          }

          localStorage.setItem("extension_redirect_uri", redirectUri);

          setTimeout(() => {
            if (isMounted) {
              window.location.href = "/login?from_extension=1";
            }
          }, 1000);
          return;
        }

        const accessToken = session.access_token;
        const refreshToken = session.refresh_token;
        const expiresAt = session.expires_at;

        localStorage.setItem("extension_token", accessToken);
        localStorage.setItem("extension_refresh_token", refreshToken);
        localStorage.setItem(
          "extension_expires_at",
          expiresAt?.toString() || ""
        );
        localStorage.setItem("jwtToken", accessToken);

        if (isMounted) {
          setStatus("success");
          setMessage(
            "Extension authenticated successfully! You can now close this tab and use the extension."
          );

          window.postMessage(
            {
              type: "EXTENSION_AUTH_SUCCESS",
              tokens: {
                jwtToken: accessToken,
                refreshToken: refreshToken,
                tokenExpiresAt: expiresAt?.toString() || "",
              },
            },
            "*"
          );
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
  }, [user, session]);

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
