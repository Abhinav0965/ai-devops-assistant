import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";

import {
  createIncident,
  getUserIncidents,
  getIncidentById,
  deleteIncident,
} from "../services/incident.service";

export const createIncidentController = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const { title, log } = req.body;

    if (!log || typeof log !== "string" || log.trim().length === 0) {
      return res.status(400).json({
        message: "Log is required",
      });
    }

    if (title !== undefined && typeof title !== "string") {
      return res.status(400).json({
        message: "Title must be a string",
      });
    }

    const incident = await createIncident({
      userId: req.userId,
      title: title?.trim(),
      log: log.trim(),
    });

    return res.status(201).json({
      message: "Incident created successfully",
      incident,
    });
  } catch (error) {
    console.error("Create incident error:", error);

    return res.status(500).json({
      message: "Failed to create incident",
    });
  }
};

export const getIncidentsController = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const incidents = await getUserIncidents(req.userId);

    return res.status(200).json({
      incidents,
    });
  } catch (error) {
    console.error("Get incidents error:", error);

    return res.status(500).json({
      message: "Failed to fetch incidents",
    });
  }
};

export const getIncidentController = async (
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
        message: "Invalid incident ID",
      });
    }

    const incident = await getIncidentById(id, req.userId);

    if (!incident) {
      return res.status(404).json({
        message: "Incident not found",
      });
    }

    return res.status(200).json({
      incident,
    });
  } catch (error) {
    console.error("Get incident error:", error);

    return res.status(500).json({
      message: "Failed to fetch incident",
    });
  }
};

export const deleteIncidentController = async (
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
        message: "Invalid incident ID",
      });
    }

    const result = await deleteIncident(id, req.userId);

    if (result.count === 0) {
      return res.status(404).json({
        message: "Incident not found",
      });
    }

    return res.status(200).json({
      message: "Incident deleted successfully",
    });
  } catch (error) {
    console.error("Delete incident error:", error);

    return res.status(500).json({
      message: "Failed to delete incident",
    });
  }
};