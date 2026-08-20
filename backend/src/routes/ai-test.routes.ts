import { Router } from "express";
import { analyzeIncident } from "../services/ai/incident-analyzer.service";

const router = Router();

router.post("/analyze", async (req, res) => {
  try {
    const { log } = req.body;

    if (!log || typeof log !== "string") {
      return res.status(400).json({
        message: "Log is required",
      });
    }

    const analysis = await analyzeIncident(log);

    return res.status(200).json({
      success: true,
      analysis,
    });
  } catch (error) {
    console.error("AI analysis error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to analyze incident",
    });
  }
});

export default router;