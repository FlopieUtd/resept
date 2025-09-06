import { createContext, useContext, useEffect, useState } from "react";
import type { User, Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getSession = async () => {
      console.log("AuthProvider: Getting session...");
      console.log("AuthProvider: Current pathname:", window.location.pathname);
      console.log(
        "AuthProvider: Current search params:",
        window.location.search
      );
      console.log("AuthProvider: Current hash:", window.location.hash);
      console.log("AuthProvider: Full URL:", window.location.href);

      // Check if we're on a password reset page with tokens in URL
      const urlParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.substring(1));

      // Also check for tokens in the URL fragment directly
      const hash = window.location.hash;
      const accessToken =
        urlParams.get("access_token") ||
        hashParams.get("access_token") ||
        (hash.includes("access_token=")
          ? hash.split("access_token=")[1]?.split("&")[0]
          : null);
      const refreshToken =
        urlParams.get("refresh_token") ||
        hashParams.get("refresh_token") ||
        (hash.includes("refresh_token=")
          ? hash.split("refresh_token=")[1]?.split("&")[0]
          : null);

      console.log("AuthProvider: Access token found:", !!accessToken);
      console.log("AuthProvider: Refresh token found:", !!refreshToken);
      console.log(
        "AuthProvider: Is reset-password path:",
        window.location.pathname.includes("/reset-password")
      );

      if (accessToken && window.location.pathname.includes("/reset-password")) {
        console.log("AuthProvider: Processing password reset tokens...");
        // We have password reset tokens, try to verify the OTP
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash: accessToken,
          type: "recovery",
        });

        if (error) {
          console.error(
            "Error setting session from password reset tokens:",
            error
          );
        } else {
          console.log("AuthProvider: Successfully set session from tokens");
          console.log("AuthProvider: Session data:", data.session);
          console.log("AuthProvider: User data:", data.session?.user);
        }

        setSession(data.session);
        setUser(data.session?.user ?? null);
        setLoading(false);
      } else {
        console.log(
          "AuthProvider: No password reset tokens, doing normal session check..."
        );
        // Normal session check
        const {
          data: { session },
        } = await supabase.auth.getSession();
        console.log("AuthProvider: Normal session data:", session);
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    };

    getSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const resetPassword = async (email: string) => {
    console.log("ResetPassword: Sending reset email to:", email);
    console.log(
      "ResetPassword: Redirect URL:",
      `${window.location.origin}/resept/reset-password/`
    );

    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/resept/reset-password/`,
    });

    console.log("ResetPassword: Supabase response data:", data);
    console.log("ResetPassword: Supabase response error:", error);

    if (error) throw error;
  };

  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({
      password: password,
    });
    if (error) throw error;
  };

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
