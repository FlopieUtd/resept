import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();

  useEffect(() => {
    const getSession = async () => {
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

      if (accessToken && window.location.pathname.includes("/reset-password")) {
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
          setSession(null);
          setUser(null);
        } else {
          setSession(data.session);
          setUser(data.session?.user ?? null);
        }
      } else {
        // Normal session check with indefinite persistence
        const {
          data: { session },
        } = await supabase.auth.getSession();

        // If session exists but is close to expiry, refresh it
        if (session && session.expires_at) {
          const now = Math.floor(Date.now() / 1000);
          const timeUntilExpiry = session.expires_at - now;

          // If token expires in less than 1 hour, refresh it
          if (timeUntilExpiry < 3600) {
            const { data: refreshData } = await supabase.auth.refreshSession();
            if (refreshData.session) {
              setSession(refreshData.session);
              setUser(refreshData.session.user);
            }
          } else {
            setSession(session);
            setUser(session.user);
          }
        } else {
          setSession(session);
          setUser(session?.user ?? null);
        }
      }

      // Set loading to false only after session check is complete
      setLoading(false);
    };

    getSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    // Set up periodic token refresh to ensure indefinite login
    const refreshInterval = setInterval(async () => {
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession();
      if (currentSession && currentSession.expires_at) {
        const now = Math.floor(Date.now() / 1000);
        const timeUntilExpiry = currentSession.expires_at - now;

        // Refresh if token expires in less than 24 hours
        if (timeUntilExpiry < 86400) {
          await supabase.auth.refreshSession();
        }
      }
    }, 3600000); // Check every hour

    return () => {
      subscription.unsubscribe();
      clearInterval(refreshInterval);
    };
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
    navigate("/login");
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/resept/reset-password/`,
    });

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
