import { useLocation } from "react-router-dom";

const ExtensionError = () => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const message =
    params.get("message") || "We couldn't authenticate your extension session.";

  return (
    <div className="flex w-full h-screen items-center justify-center px-6">
      <div className="text-center max-w-lg">
        <div className="text-6xl mb-4">❌</div>
        <h1 className="text-2xl font-bold mb-4">Extension login failed</h1>
        <p className="text-lg mb-6">{message}</p>
        <a className="text-[#e7000b] font-semibold" href="/login">
          Go to login
        </a>
      </div>
    </div>
  );
};

export default ExtensionError;
