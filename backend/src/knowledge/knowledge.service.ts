import { mongodbKnowledge } from "./documents/mongodb";
import { postgresqlKnowledge } from "./documents/postgresql";
import { nodejsKnowledge } from "./documents/nodejs";
import { dockerKnowledge } from "./documents/docker";

export interface KnowledgeDocument {
  title: string;
  category: string;
  content: string;
}

interface ScoredDocument {
  document: KnowledgeDocument;
  score: number;
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

/*
 * Common words that do not provide much useful information
 * when searching DevOps knowledge.
 */
const stopWords = new Set([
  "the",
  "a",
  "an",
  "is",
  "are",
  "was",
  "were",
  "to",
  "of",
  "in",
  "on",
  "for",
  "with",
  "and",
  "or",
  "from",
  "this",
  "that",
  "it",
  "as",
  "at",
  "by",
  "be",
  "has",
  "have",
  "had",
  "can",
  "could",
  "should",
  "would",
  "will",
  "application",
]);

/*
 * Convert a query into meaningful keywords.
 */
const tokenize = (text: string): string[] => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9:_-]/g, " ")
    .split(/\s+/)
    .filter(
      (word) =>
        word.length >= 3 &&
        !stopWords.has(word)
    );
};

/*
 * Calculate how relevant a document is to the query.
 *
 * Higher score = more relevant document.
 */
const calculateRelevanceScore = (
  query: string,
  document: KnowledgeDocument
): number => {
  const queryWords = tokenize(query);

  const titleWords = tokenize(document.title);
  const categoryWords = tokenize(document.category);
  const contentWords = tokenize(document.content);

  let score = 0;

  for (const word of queryWords) {
    /*
     * Title matches are strongest.
     */
    if (titleWords.includes(word)) {
      score += 5;
    }

    /*
     * Category matches are also important.
     */
    if (categoryWords.includes(word)) {
      score += 3;
    }

    /*
     * Content matches provide supporting evidence.
     */
    if (contentWords.includes(word)) {
      score += 1;
    }
  }

  return score;
};

export const searchKnowledge = (
  query: string
): KnowledgeDocument[] => {
  const scoredDocuments: ScoredDocument[] =
    knowledgeBase.map((document) => ({
      document,
      score: calculateRelevanceScore(
        query,
        document
      ),
    }));

  /*
   * Remove documents that have no relevant matches.
   */
  const relevantDocuments = scoredDocuments.filter(
    (item) => item.score > 0
  );

  /*
   * Highest relevance first.
   */
  relevantDocuments.sort(
    (a, b) => b.score - a.score
  );

  /*
   * Return only the top 3 documents.
   *
   * This prevents unnecessary knowledge from being
   * sent to Gemini as the knowledge base grows.
   */
  return relevantDocuments
    .slice(0, 3)
    .map((item) => item.document);
};