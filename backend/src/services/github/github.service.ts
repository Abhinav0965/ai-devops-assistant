import { Octokit } from "octokit";

const githubToken = process.env.GITHUB_TOKEN;

if (!githubToken) {
  throw new Error("GITHUB_TOKEN is not configured");
}

const octokit = new Octokit({
  auth: githubToken,
});

export interface GitHubRepositoryInfo {
  id: number;
  name: string;
  fullName: string;
  private: boolean;
  defaultBranch: string;
}

export const getRepository = async (
  owner: string,
  repo: string
): Promise<GitHubRepositoryInfo> => {
  try {
    const response = await octokit.rest.repos.get({
      owner,
      repo,
    });

    return {
      id: response.data.id,
      name: response.data.name,
      fullName: response.data.full_name,
      private: response.data.private,
      defaultBranch: response.data.default_branch,
    };
  } catch (error) {
    console.error("GitHub repository error:", error);
    throw new Error("Failed to fetch GitHub repository");
  }
};