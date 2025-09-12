import { execSync } from "child_process";
import { Server } from "http";

const PORT = parseInt(process.env.PORT || "8787", 10);

export const killExistingProcessOnPort = (port: number = PORT): void => {
  try {
    console.log(`🔍 Checking for existing processes on port ${port}...`);

    // Find processes using the port
    const result = execSync(`lsof -ti:${port}`, { encoding: "utf8" });
    const pids = result
      .trim()
      .split("\n")
      .filter((pid) => pid.length > 0);

    if (pids.length > 0) {
      console.log(
        `⚠️  Found existing processes on port ${port}: ${pids.join(", ")}`
      );

      // Kill all processes on the port
      pids.forEach((pid) => {
        try {
          console.log(`🔫 Killing process ${pid}...`);
          execSync(`kill -9 ${pid}`, { stdio: "inherit" });
          console.log(`✅ Process ${pid} killed successfully`);
        } catch (killError) {
          console.log(`⚠️  Could not kill process ${pid}:`, killError);
        }
      });

      // Wait a moment for the port to be released
      console.log(`⏳ Waiting for port ${port} to be released...`);
      setTimeout(() => {
        console.log(`✅ Port ${port} should now be available`);
      }, 1000);
    } else {
      console.log(`✅ Port ${port} is available`);
    }
  } catch (error) {
    // No processes found on the port, which is fine
    console.log(`✅ Port ${port} is available (no existing processes found)`);
  }
};

export const createServerWithPortLock = (
  app: any,
  port: number = PORT
): Server => {
  // Kill any existing processes first
  killExistingProcessOnPort(port);

  // Create the server
  const server = app.listen(port, () => {
    console.log(`🚀 Server started on http://localhost:${port}`);
    console.log(`🔒 Port ${port} is now locked by this process`);
  });

  // Handle port already in use errors
  server.on("error", (err: any) => {
    if (err.code === "EADDRINUSE") {
      console.error(`❌ Port ${port} is still in use after cleanup attempt`);
      console.error(`💡 Try running: lsof -ti:${port} | xargs kill -9`);
      process.exit(1);
    } else {
      console.error("❌ Server error:", err);
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
    console.log(`\n🛑 Received ${signal}, shutting down gracefully...`);
    console.log(`🔓 Releasing port ${port}...`);

    server.close(() => {
      console.log(`✅ Server closed, port ${port} released`);
      process.exit(0);
    });

    // Force close after 5 seconds
    setTimeout(() => {
      console.log(`⚠️  Force closing server...`);
      process.exit(1);
    }, 5000);
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
};
