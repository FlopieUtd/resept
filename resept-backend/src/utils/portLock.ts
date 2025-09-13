import { execSync } from "child_process";
import { Server } from "http";

const PORT = parseInt(process.env.PORT || "8787", 10);

export const killExistingProcessOnPort = (port: number = PORT): void => {
  try {
    // Find processes using the port
    const result = execSync(`lsof -ti:${port}`, { encoding: "utf8" });
    const pids = result
      .trim()
      .split("\n")
      .filter((pid) => pid.length > 0);

    if (pids.length > 0) {
      // Kill all processes on the port
      pids.forEach((pid) => {
        try {
          execSync(`kill -9 ${pid}`, { stdio: "inherit" });
        } catch (killError) {}
      });

      // Wait a moment for the port to be released
      setTimeout(() => {}, 1000);
    } else {
    }
  } catch (error) {
    // No processes found on the port, which is fine
  }
};

export const createServerWithPortLock = (
  app: any,
  port: number = PORT
): Server => {
  // Kill any existing processes first
  killExistingProcessOnPort(port);

  // Create the server
  const server = app.listen(port, () => {});

  // Handle port already in use errors
  server.on("error", (err: any) => {
    if (err.code === "EADDRINUSE") {
      process.exit(1);
    } else {
      process.exit(1);
    }
  });

  return server;
};

export const setupGracefulShutdown = (
  server: Server,
  port: number = PORT
): void => {
  const shutdown = async (signal: string) => {
    server.close(() => {
      process.exit(0);
    });

    // Force close after 5 seconds
    setTimeout(() => {
      process.exit(1);
    }, 5000);
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
};
