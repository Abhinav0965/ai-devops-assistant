import { Response } from "express";
import prisma from "../utils/prisma";
import { AuthRequest } from "../middleware/auth.middleware";

import {
  createProject,
  getUserProjects,
  getProjectById,
  connectGitHubRepository,
} from "../services/project.service";

import { getRepository } from "../services/github/github.service";

export const createProjectController = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const { name } = req.body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return res.status(400).json({
        message: "Project name is required",
      });
    }

    const project = await createProject({
      userId: req.userId,
      name: name.trim(),
    });

    return res.status(201).json({
      message: "Project created successfully",
      project,
    });
  } catch (error) {
    console.error("Create project error:", error);

    return res.status(500).json({
      message: "Failed to create project",
    });
  }
};

export const getProjectsController = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const projects = await getUserProjects(req.userId);

    return res.status(200).json({
      projects,
    });
  } catch (error) {
    console.error("Get projects error:", error);

    return res.status(500).json({
      message: "Failed to fetch projects",
    });
  }
};

export const getProjectController = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const { id } = req.params;

    if (typeof id !== "string") {
      return res.status(400).json({
        message: "Invalid project ID",
      });
    }

    const project = await getProjectById(id, req.userId);

    if (!project) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    return res.status(200).json({
      project,
    });
  } catch (error) {
    console.error("Get project error:", error);

    return res.status(500).json({
      message: "Failed to fetch project",
    });
  }
};

export const connectGitHubController = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const { id } = req.params;

    if (typeof id !== "string") {
      return res.status(400).json({
        message: "Invalid project ID",
      });
    }

    const { githubOwner, githubRepo } = req.body;

    if (
      !githubOwner ||
      typeof githubOwner !== "string" ||
      !githubRepo ||
      typeof githubRepo !== "string"
    ) {
      return res.status(400).json({
        message: "githubOwner and githubRepo are required",
      });
    }

    const owner = githubOwner.trim();
    const repo = githubRepo.trim();

    // Verify repository exists on GitHub first.
    const githubRepository = await getRepository(owner, repo);

    // Save repository connection.
    const repository = await connectGitHubRepository({
      projectId: id,
      userId: req.userId,
      owner: githubRepository.fullName.split("/")[0],
      repo: githubRepository.name,
    });

    // Update GitHub summary information on Project.
    const project = await prisma.project.update({
  where: {
    id,
  },
  data: {
    githubOwner: githubRepository.fullName.split("/")[0],
    githubRepo: githubRepository.name,
    githubRepoId: githubRepository.id,
    githubDefaultBranch: githubRepository.defaultBranch,
    githubConnected: true,
  },
  include: {
    services: true,
    githubRepositories: true,
  },
});

    return res.status(200).json({
      message: "GitHub repository connected successfully",
      repository,
      project,
    });
  } catch (error) {
    console.error("Connect GitHub error:", error);

    return res.status(500).json({
      message: "Failed to connect GitHub repository",
    });
  }
};