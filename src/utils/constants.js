// LLM Configuration
export const LLM_CONFIG = {
  DEFAULT_MODEL: "llama3.1:1b",
  MODEL_PRIORITY: [
    "llama3.1:1b", // Fastest
    "llama3.1:3b", // Fast
    "llama3.1:8b", // Slower but more accurate
  ],
  TIMEOUT_MS: 10000,
  KEEP_ALIVE: "2m",
  TEMPERATURE: 0.1,
  NUM_PREDICT: 500,
  NUM_CTX: 1024,
};

// HTML Processing
export const HTML_CONFIG = {
  MAX_CONTEXT_CHARS: 2000,
  MIN_INGREDIENT_LENGTH: 3,
  MAX_INGREDIENT_LENGTH: 100,
  MIN_INSTRUCTION_LENGTH: 5,
  MAX_INSTRUCTION_LENGTH: 200,
  MIN_INGREDIENTS_FOR_FAST_EXTRACTION: 2,
  MIN_INSTRUCTIONS_FOR_FAST_EXTRACTION: 2,
  MAX_INGREDIENTS_LIMIT: 10,
  MAX_INSTRUCTIONS_LIMIT: 15,
};

// Recipe Validation
export const REQUIRED_FIELDS = {
  NAME: "name",
  INGREDIENTS: "recipeIngredients",
  INSTRUCTIONS: "recipeInstructions",
};

// API Endpoints
export const OLLAMA_API_URL = "http://localhost:11434/api/generate"; 