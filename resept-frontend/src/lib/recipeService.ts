import { supabase } from "./supabase";
import { type CreateRecipeData } from "../types";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export const useRecipes = () => {
  return useQuery({
    queryKey: ["recipes"],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("User not authenticated");
      }

      const { data, error } = await supabase
        .from("recipes")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch recipes: ${error.message}`);
      }

      return data || [];
    },
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

export const useRecipe = (recipeId: string) => {
  return useQuery({
    queryKey: ["recipe", recipeId],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("User not authenticated");
      }

      const { data, error } = await supabase
        .from("recipes")
        .select("*")
        .eq("id", recipeId)
        .eq("user_id", user.id)
        .single();

      if (error) {
        throw new Error(`Failed to fetch recipe: ${error.message}`);
      }

      return data;
    },
    enabled: !!recipeId,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

export const useCreateRecipe = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (recipeData: CreateRecipeData) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("User not authenticated");
      }

      const { data, error } = await supabase
        .from("recipes")
        .insert([
          {
            user_id: user.id,
            title: recipeData.title,
            recipe_yield: recipeData.recipe_yield,
            recipe_category: recipeData.recipe_category,
            description: recipeData.description,
            prep_time: recipeData.prep_time,
            cook_time: recipeData.cook_time,
            total_time: recipeData.total_time,
            ingredients: recipeData.ingredients,
            instructions: recipeData.instructions,
            source_url: recipeData.source_url,
          },
        ])
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create recipe: ${error.message}`);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recipes"] });
    },
    onError: (error) => {
      console.error("Recipe creation failed:", error);
    },
  });
};

export const useUpdateRecipe = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      recipeId,
      updates,
    }: {
      recipeId: string;
      updates: Partial<CreateRecipeData>;
    }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("User not authenticated");
      }

      const { data, error } = await supabase
        .from("recipes")
        .update(updates)
        .eq("id", recipeId)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update recipe: ${error.message}`);
      }

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["recipes"] });
      queryClient.invalidateQueries({ queryKey: ["recipe", data.id] });
    },
    onError: (error) => {
      console.error("Recipe update failed:", error);
    },
  });
};

export const useDeleteRecipe = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (recipeId: string) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("User not authenticated");
      }

      const { error } = await supabase
        .from("recipes")
        .delete()
        .eq("id", recipeId)
        .eq("user_id", user.id);

      if (error) {
        throw new Error(`Failed to delete recipe: ${error.message}`);
      }

      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recipes"] });
    },
    onError: (error) => {
      console.error("Recipe deletion failed:", error);
    },
  });
};
