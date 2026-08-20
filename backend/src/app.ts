import express from "express";
import cors from "cors";

import authRoutes from "./routes/auth.routes";
import incidentRoutes from "./routes/incident.routes";
import aiTestRoutes from "./routes/ai-test.routes";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    service: "ai-devops-assistant",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/incidents", incidentRoutes);
app.use("/api/ai-test", aiTestRoutes);

export default app;