import { mongodbKnowledge } from "./documents/mongodb";
import { postgresqlKnowledge } from "./documents/postgresql";
import { nodejsKnowledge } from "./documents/nodejs";
import { dockerKnowledge } from "./documents/docker";

export interface KnowledgeDocument {
  title: string;
  category: string;
  content: string;
}

const knowledgeBase: KnowledgeDocument[] = [
  mongodbKnowledge,
  postgresqlKnowledge,
  nodejsKnowledge,
  dockerKnowledge,
];

export const getKnowledgeBase = (): KnowledgeDocument[] => {
  return knowledgeBase;
};

export const searchKnowledge = (
  query: string
): KnowledgeDocument[] => {
  const normalizedQuery = query.toLowerCase();

  return knowledgeBase.filter((document) => {
    const searchableText = `
      ${document.title}
      ${document.category}
      ${document.content}
    `.toLowerCase();

    return normalizedQuery
      .split(/\s+/)
      .some((word) => searchableText.includes(word));
  });
};