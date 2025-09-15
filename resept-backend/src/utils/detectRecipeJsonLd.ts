interface JsonLdRecipe {
  "@type": string | string[];
  "@graph"?: Array<{ "@type": string }>;
  [key: string]: any;
}

export const detectRecipeJsonLd = (html: string): JsonLdRecipe[] | null => {
  const jsonLdMatches = html.match(
    /<script type="application\/ld\+json"[^>]*>(.*?)<\/script>/gs
  );

  if (!jsonLdMatches) {
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
        recipes.push(parsed);
      }
    } catch (error: any) {}
  });

  if (recipes.length > 0) {
    return recipes;
  } else {
    return null;
  }
};
