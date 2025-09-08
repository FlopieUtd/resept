import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App.tsx";
import { FullscreenProvider } from "./contexts/FullscreenContext";

// Get the base path dynamically - empty in development, /resept in production
const basename = import.meta.env.DEV ? "" : "/resept";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter basename={basename}>
      <FullscreenProvider>
        <App />
      </FullscreenProvider>
    </BrowserRouter>
  </StrictMode>
);
