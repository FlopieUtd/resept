import express from "express";
import cors from "cors";
import routes from "./routes.js";

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.use(routes);

app.listen(8787, () => console.log("API on http://localhost:8787"));
