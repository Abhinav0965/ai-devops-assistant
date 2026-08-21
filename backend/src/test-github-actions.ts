import dotenv from "dotenv";

dotenv.config();

import {
  getWorkflowRuns,
  getFailedWorkflowRuns,
} from "./services/github/github-actions.service";

const test = async () => {
  try {
    const owner = "Abhinav0965";
    const repo = "ai-devops-assistant";

    console.log("Testing GitHub Actions API...\n");

    const runs = await getWorkflowRuns(owner, repo);

    console.log(`Total workflow runs returned: ${runs.length}\n`);

    for (const run of runs) {
      console.log("--------------------------------");
      console.log(`ID: ${run.id}`);
      console.log(`Name: ${run.name}`);
      console.log(`Status: ${run.status}`);
      console.log(`Conclusion: ${run.conclusion}`);
      console.log(`Branch: ${run.branch}`);
      console.log(`Commit: ${run.commitSha}`);
      console.log(`URL: ${run.htmlUrl}`);
    }

    console.log("\n\nFailed workflow runs:\n");

    const failedRuns = await getFailedWorkflowRuns(owner, repo);

    console.log(`Failed runs: ${failedRuns.length}\n`);

    for (const run of failedRuns) {
      console.log("--------------------------------");
      console.log(`ID: ${run.id}`);
      console.log(`Name: ${run.name}`);
      console.log(`Conclusion: ${run.conclusion}`);
      console.log(`Branch: ${run.branch}`);
      console.log(`Commit: ${run.commitSha}`);
      console.log(`URL: ${run.htmlUrl}`);
    }
  } catch (error) {
    console.error("\nGitHub Actions test failed:", error);
    process.exit(1);
  }
};

test();