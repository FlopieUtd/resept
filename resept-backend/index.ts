import express, { Application } from "express";
import { Server } from "http";
import cors from "cors";
import routes from "./routes.js";
import { closeBrowser } from "./src/utils/fetchHtmlWithBrowser.js";

const app: Application = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

app.use(routes);

const PORT = process.env.PORT || 8787;
const server: Server = app.listen(PORT, () =>
  console.log(`API on http://localhost:${PORT}`)
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
