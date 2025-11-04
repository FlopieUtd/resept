import "dotenv/config";
import { supabaseAdmin } from "../src/lib/supabase.js";

type UnknownRecord = Record<string, any>;

const isFlatIngredientArray = (value: any): boolean => {
  if (!Array.isArray(value)) return false;
  if (value.length === 0) return false;
  const first = value[0];
  if (typeof first === "string") return true;
  if (first && typeof first === "object" && "raw" in first) return true;
  return false;
};

const normalizeGroups = (ingredients: any): any => {
  if (!Array.isArray(ingredients)) return [];
  if (isFlatIngredientArray(ingredients)) return [{ ingredients }];
  return ingredients;
};

const migrate = async () => {
  const dryRun = process.argv.includes("--dry-run");
  let updated = 0;
  let skipped = 0;
  let errored = 0;
  const pageSize = 500;
  let from = 0;
  while (true) {
    const to = from + pageSize - 1;
    const { data, error } = await supabaseAdmin
      .from("recipes")
      .select("id, ingredients")
      .range(from, to);
    if (error) throw new Error(error.message || "Failed to fetch recipes");
    if (!data || data.length === 0) break;
    for (const row of data as UnknownRecord[]) {
      try {
        const current = row.ingredients;
        const normalized = normalizeGroups(current);
        const changed = JSON.stringify(current) !== JSON.stringify(normalized);
        if (!changed) {
          skipped++;
          continue;
        }
        if (!dryRun) {
          const { error: upsertError } = await supabaseAdmin
            .from("recipes")
            .update({ ingredients: normalized })
            .eq("id", row.id);
          if (upsertError)
            throw new Error(upsertError.message || "Update failed");
        }
        updated++;
      } catch {
        errored++;
      }
    }
    from += pageSize;
  }
  console.log(JSON.stringify({ updated, skipped, errored, dryRun }));
};

migrate()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e?.message || String(e));
    process.exit(1);
  });
