import { Request, Response, NextFunction } from "express";
import { supabase } from "../lib/supabase.js";

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  console.log("🔐 [AUTH] Token verification request");
  console.log(
    "🔑 [AUTH] Token (first 50 chars):",
    token?.substring(0, 50) + "..."
  );

  if (!token) {
    console.log("❌ [AUTH] No token provided");
    return res.status(401).json({ error: "Access token required" });
  }

  try {
    // Use Supabase to verify the token
    console.log("🌐 [AUTH] Verifying token with Supabase");
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    console.log("📊 [AUTH] Supabase response:", {
      hasUser: !!user,
      hasError: !!error,
      errorMessage: error?.message,
      userId: user?.id,
      userEmail: user?.email,
    });

    if (error || !user) {
      console.error("❌ [AUTH] Token verification failed:", error);
      return res.status(403).json({ error: "Invalid or expired token" });
    }

    console.log("✅ [AUTH] Token verified successfully");
    req.user = {
      id: user.id,
      email: user.email || "",
    };

    next();
  } catch (error) {
    console.error("💥 [AUTH] Token verification error:", error);
    return res.status(403).json({ error: "Invalid or expired token" });
  }
};
