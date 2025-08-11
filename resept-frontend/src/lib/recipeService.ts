import { supabase } from "./supabase";
import { type DatabaseRecipe, type CreateRecipeData } from "../types";

export const recipeService = {
  async createRecipe(
    recipeData: CreateRecipeData
  ): Promise<DatabaseRecipe | null> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        console.error("User not authenticated");
        return null;
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
        console.error("Error creating recipe:", error);
        return null;
      }

      return data;
    } catch (error) {
      console.error("Error creating recipe:", error);
      return null;
    }
  },

  async getUserRecipes(): Promise<DatabaseRecipe[]> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        console.error("User not authenticated");
        return [];
      }

      const { data, error } = await supabase
        .from("recipes")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching recipes:", error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error("Error fetching recipes:", error);
      return [];
    }
  },

  async getUserRecipe(recipeId: string): Promise<DatabaseRecipe | null> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        console.error("User not authenticated");
        return null;
      }

      const { data, error } = await supabase
        .from("recipes")
        .select("*")
        .eq("id", recipeId)
        .eq("user_id", user.id)
        .single();

      if (error) {
        console.error("Error fetching recipe:", error);
        return null;
      }

      return data;
    } catch (error) {
      console.error("Error fetching recipe:", error);
      return null;
    }
  },

  async updateRecipe(
    recipeId: string,
    updates: Partial<CreateRecipeData>
  ): Promise<DatabaseRecipe | null> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        console.error("User not authenticated");
        return null;
      }

      const { data, error } = await supabase
        .from("recipes")
        .update(updates)
        .eq("id", recipeId)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) {
        console.error("Error updating recipe:", error);
        return null;
      }

      return data;
    } catch (error) {
      console.error("Error updating recipe:", error);
      return null;
    }
  },

  async deleteRecipe(recipeId: string): Promise<boolean> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        console.error("User not authenticated");
        return false;
      }

      const { error } = await supabase
        .from("recipes")
        .delete()
        .eq("id", recipeId)
        .eq("user_id", user.id);

      if (error) {
        console.error("Error deleting recipe:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error deleting recipe:", error);
      return false;
    }
  },
};
