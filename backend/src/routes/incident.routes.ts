import { Router } from "express";

import { authenticate } from "../middleware/auth.middleware";

import {
  createIncidentController,
  getIncidentsController,
  getIncidentController,
  deleteIncidentController,
} from "../controllers/incident.controller";

const router = Router();

router.use(authenticate);

router.post("/", createIncidentController);

router.get("/", getIncidentsController);

router.get("/:id", getIncidentController);

router.delete("/:id", deleteIncidentController);

export default router;