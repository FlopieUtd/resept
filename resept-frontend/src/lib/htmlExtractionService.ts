import { supabase } from "./supabase";
import { API_URL } from "../utils/constants";

export const extractRecipeFromHtml = async (html: string, url?: string) => {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error("User not authenticated");
  }

  const response = await fetch(`${API_URL}/extract-from-html`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      html,
      url,
      metadata: {
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
      },
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to extract recipe from HTML");
  }

  // Check if we need to redirect to no-recipe page
  if (data.redirectTo === "/no-recipe") {
    window.location.href = "/no-recipe";
    return;
  }

  return data;
};
