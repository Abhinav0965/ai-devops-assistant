import prisma from "../utils/prisma";

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
  return prisma.incident.create({
    data: {
      userId,
      title,
      log,
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