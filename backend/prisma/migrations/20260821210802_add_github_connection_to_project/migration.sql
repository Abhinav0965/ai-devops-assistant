-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "githubConnected" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "githubDefaultBranch" TEXT,
ADD COLUMN     "githubOwner" TEXT,
ADD COLUMN     "githubRepo" TEXT,
ADD COLUMN     "githubRepoId" INTEGER;
