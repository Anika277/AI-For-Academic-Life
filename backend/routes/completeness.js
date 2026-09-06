import express from "express";
import { checkCompleteness } from "../utils/completenessRules.js";

const router = express.Router();

// POST /api/check-completeness
// Body: { course: {...} }  (matches locked DATA SCHEMA)
// Returns: { checklist: [...], percent: number }
// Pure rule-based — no AI call, instant response.
router.post("/", (req, res) => {
  const { course } = req.body;

  if (!course) {
    return res.status(400).json({
      error: "Request body must include a 'course' object.",
    });
  }

  try {
    const result = checkCompleteness(course);
    return res.json(result);
  } catch (err) {
    console.error("[check-completeness] error:", err);
    return res.status(500).json({
      error: "Failed to run completeness check.",
      detail: err.message,
    });
  }
});

export default router;