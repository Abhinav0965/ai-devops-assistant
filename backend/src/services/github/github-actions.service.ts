import { Octokit } from "octokit";
import type { RestEndpointMethodTypes } from "@octokit/plugin-rest-endpoint-methods";

const githubToken = process.env.GITHUB_TOKEN;

if (!githubToken) {
  throw new Error("GITHUB_TOKEN is not configured");
}

const octokit = new Octokit({
  auth: githubToken,
});

/* =========================================================
   WORKFLOW RUNS
   ========================================================= */

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
  htmlUrl: string | null;
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
    htmlUrl: run.html_url ?? null,
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
    (run: WorkflowRunInfo) =>
      run.conclusion === "failure" ||
      run.conclusion === "timed_out" ||
      run.conclusion === "cancelled"
  );
};

/* =========================================================
   WORKFLOW JOBS
   ========================================================= */

type WorkflowJob =
  RestEndpointMethodTypes["actions"]["listJobsForWorkflowRun"]["response"]["data"]["jobs"][number];

export interface WorkflowJobInfo {
  id: number;
  name: string;
  status: string | null;
  conclusion: string | null;
  startedAt: string | null;
  completedAt: string | null;
  htmlUrl: string | null;
}

const mapWorkflowJob = (job: WorkflowJob): WorkflowJobInfo => {
  return {
    id: job.id,
    name: job.name,
    status: job.status ?? null,
    conclusion: job.conclusion ?? null,
    startedAt: job.started_at ?? null,
    completedAt: job.completed_at ?? null,
    htmlUrl: job.html_url ?? null,
  };
};

export const getWorkflowJobs = async (
  owner: string,
  repo: string,
  runId: number
): Promise<WorkflowJobInfo[]> => {
  try {
    const response =
      await octokit.rest.actions.listJobsForWorkflowRun({
        owner,
        repo,
        run_id: runId,
        per_page: 100,
      });

    return response.data.jobs.map(mapWorkflowJob);
  } catch (error) {
    console.error("GitHub workflow jobs error:", error);

    throw new Error(
      "Failed to fetch GitHub workflow jobs"
    );
  }
};

export const getFailedWorkflowJobs = async (
  owner: string,
  repo: string,
  runId: number
): Promise<WorkflowJobInfo[]> => {
  const jobs = await getWorkflowJobs(owner, repo, runId);

  return jobs.filter(
    (job: WorkflowJobInfo) =>
      job.conclusion === "failure" ||
      job.conclusion === "timed_out" ||
      job.conclusion === "cancelled"
  );
};