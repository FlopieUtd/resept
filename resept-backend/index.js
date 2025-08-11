import express from "express";
import cors from "cors";
import routes from "./routes.js";
import { closeBrowser } from "./src/utils/fetchHtmlWithBrowser.js";

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.use(routes);

const server = app.listen(8787, () =>
  console.log("API on http://localhost:8787")
);

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("Shutting down gracefully...");
  await closeBrowser();
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});

process.on("SIGTERM", async () => {
  console.log("Shutting down gracefully...");
  await closeBrowser();
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});
