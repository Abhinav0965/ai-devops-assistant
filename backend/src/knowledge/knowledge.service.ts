import { mongodbKnowledge } from "./documents/mongodb";
import { postgresqlKnowledge } from "./documents/postgresql";
import { nodejsKnowledge } from "./documents/nodejs";
import { dockerKnowledge } from "./documents/docker";

import {
  generateEmbedding,
  cosineSimilarity,
} from "./embedding.service";

export interface KnowledgeDocument {
  title: string;
  category: string;
  content: string;
}

interface ScoredDocument {
  document: KnowledgeDocument;
  keywordScore: number;
  semanticScore: number;
  finalScore: number;
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
 * Common words that don't provide much useful
 * information during keyword retrieval.
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
 * Convert text into meaningful keywords.
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
 * Calculate traditional keyword relevance.
 */
const calculateKeywordScore = (
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
     * Category matches.
     */
    if (categoryWords.includes(word)) {
      score += 3;
    }

    /*
     * Content matches.
     */
    if (contentWords.includes(word)) {
      score += 1;
    }
  }

  return score;
};

/*
 * Cache embeddings because our knowledge documents
 * do not change frequently.
 *
 * This prevents generating the same document embedding
 * on every incident request.
 */
const embeddingCache =
  new Map<string, number[]>();

/*
 * Generate or retrieve a cached embedding
 * for a knowledge document.
 */
const getDocumentEmbedding = async (
  document: KnowledgeDocument
): Promise<number[]> => {
  const cacheKey =
    `${document.title}:${document.category}`;

  const cachedEmbedding =
    embeddingCache.get(cacheKey);

  if (cachedEmbedding) {
    return cachedEmbedding;
  }

  const documentText = `
Title: ${document.title}

Category: ${document.category}

${document.content}
`;

  const embedding =
    await generateEmbedding(documentText);

  embeddingCache.set(cacheKey, embedding);

  return embedding;
};

/*
 * Hybrid knowledge retrieval.
 *
 * Combines:
 *
 *   40% keyword relevance
 *   60% semantic similarity
 */
export const searchKnowledge = async (
  query: string
): Promise<KnowledgeDocument[]> => {
  /*
   * Generate embedding for the incident query.
   */
  const queryEmbedding =
    await generateEmbedding(query);

  const scoredDocuments: ScoredDocument[] = [];

  for (const document of knowledgeBase) {
    /*
     * Traditional keyword score.
     */
    const keywordScore =
      calculateKeywordScore(
        query,
        document
      );

    /*
     * Semantic similarity.
     */
    const documentEmbedding =
      await getDocumentEmbedding(document);

    const semanticScore =
      cosineSimilarity(
        queryEmbedding,
        documentEmbedding
      );

    /*
     * Normalize keyword score approximately
     * into the 0-1 range.
     *
     * We cap it because keyword scores can grow
     * depending on query length.
     */
    const normalizedKeywordScore =
      Math.min(keywordScore / 20, 1);

    /*
     * Hybrid score.
     *
     * Semantic similarity receives slightly more
     * weight because semantic relationships are the
     * main reason we're introducing embeddings.
     */
    const finalScore =
      normalizedKeywordScore * 0.4 +
      semanticScore * 0.6;

    scoredDocuments.push({
      document,
      keywordScore,
      semanticScore,
      finalScore,
    });
  }

  /*
   * Highest relevance first.
   */
  scoredDocuments.sort(
    (a, b) =>
      b.finalScore - a.finalScore
  );

  /*
   * Return the top 3 documents.
   */
  return scoredDocuments
    .slice(0, 3)
    .map(
      (item) => item.document
    );
};