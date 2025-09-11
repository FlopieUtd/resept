const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Simple test route
app.get("/test", (req, res) => {
  console.log("🧪 GET /test hit");
  res.json({ message: "Backend routing is working!" });
});

const PORT = process.env.PORT || 8787;
app.listen(PORT, () => {
  console.log(`API on http://localhost:${PORT}`);
});