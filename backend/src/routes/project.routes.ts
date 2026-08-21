import { Router } from "express";

import {
  createProjectController,
  getProjectsController,
  getProjectController,
  connectGitHubController,
} from "../controllers/project.controller";

import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.use(authenticate);

router.post("/", createProjectController);

router.get("/", getProjectsController);

router.get("/:id", getProjectController);

router.post("/:id/github", connectGitHubController);

export default router;