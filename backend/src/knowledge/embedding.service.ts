import { GoogleGenerativeAI } from "@google/generative-ai";

const EMBEDDING_MODEL = "gemini-embedding-001";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("GEMINI_API_KEY is not configured");
}

const genAI = new GoogleGenerativeAI(apiKey);

const embeddingModel = genAI.getGenerativeModel({
  model: EMBEDDING_MODEL,
});

/**
 * Generate a numerical embedding vector for text.
 */
export const generateEmbedding = async (
  text: string
): Promise<number[]> => {
  const result = await embeddingModel.embedContent(text);

  /*
   * Gemini returns a ContentEmbedding object.
   *
   * The actual numerical vector is inside:
   *
   * result.embedding.values
   */
  return result.embedding.values;
};

/**
 * Calculate cosine similarity between two vectors.
 *
 * Result:
 *
 *  1  -> very similar
 *  0  -> unrelated
 * -1  -> opposite direction
 */
export const cosineSimilarity = (
  vectorA: number[],
  vectorB: number[]
): number => {
  if (vectorA.length !== vectorB.length) {
    throw new Error(
      "Cannot calculate similarity for vectors of different dimensions"
    );
  }

  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (let i = 0; i < vectorA.length; i++) {
    dotProduct += vectorA[i] * vectorB[i];

    magnitudeA += vectorA[i] * vectorA[i];

    magnitudeB += vectorB[i] * vectorB[i];
  }

  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  }

  return (
    dotProduct /
    (Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB))
  );
};