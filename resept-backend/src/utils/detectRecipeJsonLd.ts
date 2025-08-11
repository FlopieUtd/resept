interface JsonLdRecipe {
  "@type": string | string[];
  "@graph"?: Array<{ "@type": string }>;
  [key: string]: any;
}

export const detectRecipeJsonLd = (html: string): JsonLdRecipe[] | null => {
  console.log("Step 2: Detecting recipe JSON-LD...");

  const jsonLdMatches = html.match(
    /<script type="application\/ld\+json"[^>]*>(.*?)<\/script>/gs
  );

  if (!jsonLdMatches) {
    console.log("No JSON-LD scripts found");
    return null;
  }

  const recipes: JsonLdRecipe[] = [];

  jsonLdMatches.forEach((match, index) => {
    try {
      const jsonContent = match
        .replace(/<script type="application\/ld\+json"[^>]*>/, "")
        .replace(/<\/script>/, "");
      const parsed: JsonLdRecipe = JSON.parse(jsonContent);

      if (
        parsed["@type"] === "Recipe" ||
        (Array.isArray(parsed["@type"]) &&
          parsed["@type"].includes("Recipe")) ||
        (parsed["@graph"] &&
          Array.isArray(parsed["@graph"]) &&
          parsed["@graph"].some((item) => item["@type"] === "Recipe"))
      ) {
        console.log(`Recipe JSON-LD found in script ${index + 1}`);
        recipes.push(parsed);
      }
    } catch (error: any) {
      console.log(
        `Failed to parse JSON-LD script ${index + 1}:`,
        error.message
      );
    }
  });

  if (recipes.length > 0) {
    console.log(`Found ${recipes.length} recipe(s) in JSON-LD`);
    return recipes;
  } else {
    console.log("No recipe JSON-LD found");
    return null;
  }
};
