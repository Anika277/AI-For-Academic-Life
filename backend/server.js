import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import completenessRouter from "./routes/completeness.js";
import overlapRouter from "./routes/overlap.js";
import cloRouter from "./routes/clo.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: "2mb" }));

// Simple request logger — helpful during a live demo to see what's
// hitting the backend in real time, next to nothing in cost.
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", model: process.env.GROK_MODEL || "grok-4-fast" });
});

app.use("/api/check-completeness", completenessRouter);
app.use("/api/check-overlap", overlapRouter);
app.use("/api/check-clo", cloRouter);

// Catch-all 404 for unmatched API routes
app.use("/api", (req, res) => {
  res.status(404).json({ error: `No route for ${req.method} ${req.path}` });
});

// Centralized error handler — catches anything thrown synchronously
// in a route that wasn't already caught locally.
app.use((err, req, res, next) => {
  console.error("[unhandled error]", err);
  res.status(500).json({ error: "Internal server error", detail: err.message });
});

app.listen(PORT, () => {
  console.log(`✅ Backend running on http://localhost:${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/api/health`);
});