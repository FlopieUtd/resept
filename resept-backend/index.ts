import "dotenv/config";
import express, { Application } from "express";
import { Server } from "http";
import cors from "cors";
import routes from "./routes";
import { closeBrowser } from "./src/utils/fetchHtmlWithBrowser";
import {
  createServerWithPortLock,
  setupGracefulShutdown,
} from "./src/utils/portLock";

const app: Application = express();

// Configure CORS to allow extension requests
app.use(
  cors({
    origin: [
      "http://localhost:5173", // Frontend dev server
      /^moz-extension:\/\/.*/, // Firefox extensions
      /^chrome-extension:\/\/.*/, // Chrome extensions
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// Add request logging middleware
app.use((req, res, next) => {
  next();
});

app.use(routes);

const PORT = parseInt(process.env.PORT || "8787", 10);

// Create server with port locking
const server: Server = createServerWithPortLock(app, PORT);

// Setup graceful shutdown with browser cleanup
setupGracefulShutdown(server, PORT);

// Additional cleanup for browser
process.on("SIGINT", async () => {
  await closeBrowser();
});

process.on("SIGTERM", async () => {
  await closeBrowser();
});
