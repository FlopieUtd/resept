import { extractTextNodes } from "./resept-backend/dist/src/utils/extractTextNodes.js";

// Test HTML similar to the problematic case
const testHtml = `
<div class="py-4 md:py-8">
  <ul class="flex flex-col gap-2" data-ingredient-list>
    <li class="flex gap-4" data-ingredient-name="grote aubergines" data-ingredient-unit="" data-ingredient-amount="2">
      <button>checkbox</button>
      <div class="ingredient-data | text-xl-clamp">
        <span class="bold">2</span>
        grote aubergines
      </div>
    </li>
    <li class="flex gap-4" data-ingredient-name="spaghetti" data-ingredient-unit="gr" data-ingredient-amount="280">
      <button>checkbox</button>
      <div class="ingredient-data | text-xl-clamp">
        <span class="bold">280</span>
        <span>gr</span>
        spaghetti
      </div>
    </li>
    <li class="flex gap-4" data-ingredient-name="chili" data-ingredient-unit="Snufje" data-ingredient-amount="">
      <button>checkbox</button>
      <div class="ingredient-data | text-xl-clamp">
        <span>Snufje</span>
        chili
      </div>
    </li>
  </ul>
</div>
`;

console.log("Testing spacing fix...\n");

const textNodes = extractTextNodes(testHtml);

console.log("Extracted text nodes:");
textNodes.forEach((node, index) => {
  console.log(
    `${index + 1}. "${node.text}" (depth: ${node.depth}, type: ${
      node.elementType
    })`
  );
});

// Check if we have properly spaced ingredients
const ingredientNodes = textNodes.filter(
  (node) =>
    node.text.includes("aubergines") ||
    node.text.includes("spaghetti") ||
    node.text.includes("chili")
);

console.log("\nIngredient nodes:");
ingredientNodes.forEach((node) => {
  console.log(`"${node.text}"`);
  const hasProperSpacing =
    node.text.includes(" ") &&
    !node.text.includes("groteaubergines") &&
    !node.text.includes("grspaghetti");
  console.log(`  Proper spacing: ${hasProperSpacing ? "✅" : "❌"}`);
});
