import prisma from "../utils/prisma";
import { analyzeIncident } from "./ai/incident-analyzer.service";

interface CreateIncidentInput {
  userId: string;
  title?: string;
  log: string;
}

export const createIncident = async ({
  userId,
  title,
  log,
}: CreateIncidentInput) => {
  const analysis = await analyzeIncident(log);

  console.log("Saving AI analysis to database:");
  console.log({
    severity: analysis.severity,
    errorType: analysis.errorType,
    summary: analysis.summary,
    rootCause: analysis.rootCause,
    solution: analysis.solution,
    possibleCauses: analysis.possibleCauses,
    prevention: analysis.prevention,
    confidence: analysis.confidence,
  });

  return prisma.incident.create({
    data: {
      userId,
      title,
      log,

      severity: analysis.severity,
      errorType: analysis.errorType,
      summary: analysis.summary,
      rootCause: analysis.rootCause,
      solution: analysis.solution,

      possibleCauses: JSON.stringify(analysis.possibleCauses),
      prevention: analysis.prevention,
      confidence: analysis.confidence,

      status: "ANALYZED",
    },
  });
};

export const getUserIncidents = async (userId: string) => {
  return prisma.incident.findMany({
    where: {
      userId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

export const getIncidentById = async (
  incidentId: string,
  userId: string
) => {
  return prisma.incident.findFirst({
    where: {
      id: incidentId,
      userId,
    },
  });
};

export const deleteIncident = async (
  incidentId: string,
  userId: string
) => {
  return prisma.incident.deleteMany({
    where: {
      id: incidentId,
      userId,
    },
  });
};