import { Octokit } from "octokit";
import type { RestEndpointMethodTypes } from "@octokit/plugin-rest-endpoint-methods";

const githubToken = process.env.GITHUB_TOKEN;

if (!githubToken) {
  throw new Error("GITHUB_TOKEN is not configured");
}

const octokit = new Octokit({
  auth: githubToken,
});

type WorkflowRun =
  RestEndpointMethodTypes["actions"]["listWorkflowRunsForRepo"]["response"]["data"]["workflow_runs"][number];

export interface WorkflowRunInfo {
  id: number;
  name: string | null;
  status: string | null;
  conclusion: string | null;
  branch: string | null;
  commitSha: string;
  createdAt: string;
  updatedAt: string;
  htmlUrl: string;
}

const mapWorkflowRun = (run: WorkflowRun): WorkflowRunInfo => {
  return {
    id: run.id,
    name: run.name ?? null,
    status: run.status ?? null,
    conclusion: run.conclusion ?? null,
    branch: run.head_branch ?? null,
    commitSha: run.head_sha,
    createdAt: run.created_at,
    updatedAt: run.updated_at,
    htmlUrl: run.html_url,
  };
};

export const getWorkflowRuns = async (
  owner: string,
  repo: string
): Promise<WorkflowRunInfo[]> => {
  try {
    const response =
      await octokit.rest.actions.listWorkflowRunsForRepo({
        owner,
        repo,
        per_page: 20,
      });

    return response.data.workflow_runs.map(mapWorkflowRun);
  } catch (error) {
    console.error("GitHub Actions error:", error);

    throw new Error(
      "Failed to fetch GitHub Actions workflow runs"
    );
  }
};

export const getFailedWorkflowRuns = async (
  owner: string,
  repo: string
): Promise<WorkflowRunInfo[]> => {
  const runs = await getWorkflowRuns(owner, repo);

  return runs.filter(
    (run) =>
      run.conclusion === "failure" ||
      run.conclusion === "timed_out" ||
      run.conclusion === "cancelled"
  );
};