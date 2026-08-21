import dotenv from "dotenv";

dotenv.config();

import {
  searchKnowledge,
} from "./knowledge/knowledge.service";

const testKnowledgeSearch = async () => {
  const query = `
    The backend container cannot connect to a
    database running in another container.
    The connection is being rejected because the
    service is trying to reach the local machine.
  `;

  console.log(
    "Searching knowledge base...\n"
  );

  const results =
    await searchKnowledge(query);

  console.log(
    `Found ${results.length} relevant documents:\n`
  );

  for (const document of results) {
    console.log(
      `TITLE: ${document.title}`
    );

    console.log(
      `CATEGORY: ${document.category}`
    );

    console.log(
      `CONTENT:\n${document.content}`
    );

    console.log(
      "\n--------------------------------\n"
    );
  }
};

testKnowledgeSearch().catch(
  (error) => {
    console.error(
      "Knowledge search failed:",
      error
    );

    process.exit(1);
  }
);