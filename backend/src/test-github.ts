import dotenv from "dotenv";

dotenv.config();

import { getRepository } from "./services/github/github.service";

const test = async () => {
  try {
    console.log("Testing GitHub API...");

    const repository = await getRepository(
      "Abhinav0965",
      "ai-devops-assistant"
    );

    console.log("\nGitHub repository found:\n");

    console.log(`ID: ${repository.id}`);
    console.log(`Name: ${repository.name}`);
    console.log(`Full name: ${repository.fullName}`);
    console.log(`Private: ${repository.private}`);
    console.log(`Default branch: ${repository.defaultBranch}`);
  } catch (error) {
    console.error("\nGitHub API test failed:", error);
    process.exit(1);
  }
};

test();