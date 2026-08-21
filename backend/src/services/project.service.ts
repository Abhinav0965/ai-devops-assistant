import prisma from "../utils/prisma";

interface CreateProjectInput {
  userId: string;
  name: string;
}

interface ConnectGitHubInput {
  projectId: string;
  userId: string;
  owner: string;
  repo: string;
}

export const createProject = async ({
  userId,
  name,
}: CreateProjectInput) => {
  return prisma.project.create({
    data: {
      name,
      ownerId: userId,
    },
  });
};

export const getUserProjects = async (userId: string) => {
  return prisma.project.findMany({
    where: {
      ownerId: userId,
    },
    include: {
      services: true,
      githubRepositories: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

export const getProjectById = async (
  projectId: string,
  userId: string
) => {
  return prisma.project.findFirst({
    where: {
      id: projectId,
      ownerId: userId,
    },
    include: {
      services: true,
      githubRepositories: true,
    },
  });
};

export const connectGitHubRepository = async ({
  projectId,
  userId,
  owner,
  repo,
}: ConnectGitHubInput) => {
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      ownerId: userId,
    },
  });

  if (!project) {
    throw new Error("Project not found");
  }

  const repository = await prisma.gitHubRepository.upsert({
    where: {
      owner_repo_projectId: {
        owner,
        repo,
        projectId,
      },
    },
    update: {},
    create: {
      owner,
      repo,
      projectId,
    },
  });

  return repository;
};