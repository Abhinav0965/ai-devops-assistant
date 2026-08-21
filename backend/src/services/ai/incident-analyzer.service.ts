import { GoogleGenerativeAI } from "@google/generative-ai";
import { searchKnowledge } from "../../knowledge/knowledge.service";

export interface IncidentAnalysis {
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  confidence: number;
  errorType: string;
  summary: string;
  rootCause: string;
  possibleCauses: string[];
  recommendedSolution: string;
  prevention: string;
}

const validateIncidentAnalysis = (
  data: unknown
): IncidentAnalysis => {
  if (!data || typeof data !== "object") {
    throw new Error("AI response is not an object");
  }

  const analysis = data as Record<string, unknown>;

  const validSeverities = [
    "LOW",
    "MEDIUM",
    "HIGH",
    "CRITICAL",
  ];

  if (
    typeof analysis.severity !== "string" ||
    !validSeverities.includes(analysis.severity)
  ) {
    throw new Error("AI returned an invalid severity");
  }

  if (
    typeof analysis.confidence !== "number" ||
    analysis.confidence < 0 ||
    analysis.confidence > 1
  ) {
    throw new Error("AI returned invalid confidence");
  }

  if (
    typeof analysis.errorType !== "string" ||
    analysis.errorType.trim() === ""
  ) {
    throw new Error("AI returned invalid error type");
  }

  if (
    typeof analysis.summary !== "string" ||
    analysis.summary.trim() === ""
  ) {
    throw new Error("AI returned invalid summary");
  }

  if (
    typeof analysis.rootCause !== "string" ||
    analysis.rootCause.trim() === ""
  ) {
    throw new Error("AI returned invalid root cause");
  }

  if (
    !Array.isArray(analysis.possibleCauses) ||
    !analysis.possibleCauses.every(
      (cause) => typeof cause === "string"
    )
  ) {
    throw new Error("AI returned invalid possible causes");
  }

  if (
    typeof analysis.recommendedSolution !== "string" ||
    analysis.recommendedSolution.trim() === ""
  ) {
    throw new Error("AI returned invalid recommended solution");
  }

  if (
    typeof analysis.prevention !== "string" ||
    analysis.prevention.trim() === ""
  ) {
    throw new Error("AI returned invalid prevention");
  }

  return {
    severity: analysis.severity as IncidentAnalysis["severity"],
    confidence: analysis.confidence,
    errorType: analysis.errorType,
    summary: analysis.summary,
    rootCause: analysis.rootCause,
    possibleCauses: analysis.possibleCauses as string[],
    recommendedSolution: analysis.recommendedSolution,
    prevention: analysis.prevention,
  };
};

const extractJson = (text: string): string => {
  let cleaned = text.trim();

  // Remove Markdown code fences if Gemini returns them.
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "");
    cleaned = cleaned.replace(/\s*```$/, "");
  }

  return cleaned.trim();
};

export const analyzeIncident = async (
  log: string
): Promise<IncidentAnalysis> => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    /*
     * STEP 1:
     * Retrieve relevant DevOps knowledge.
     */
    const relevantKnowledge = searchKnowledge(log);

    /*
     * STEP 2:
     * Convert retrieved documents into context for Gemini.
     */
    const knowledgeContext =
      relevantKnowledge.length > 0
        ? relevantKnowledge
            .map(
              (document) => `
### ${document.title}

Category: ${document.category}

${document.content}
`
            )
            .join("\n\n")
        : "No relevant DevOps knowledge was found.";

    /*
     * STEP 3:
     * Initialize Gemini.
     */
    const genAI = new GoogleGenerativeAI(apiKey);

    const model = genAI.getGenerativeModel({
      model: "gemini-3.6-flash",
    });

    /*
     * STEP 4:
     * Build the RAG-enhanced prompt.
     */
    const prompt = `
You are an AI DevOps incident analysis assistant.

Your job is to analyze a DevOps incident log and provide
a structured diagnosis.

You have access to a DevOps knowledge base retrieved
specifically for this incident.

IMPORTANT:
- Use the provided DevOps knowledge as supporting evidence.
- Do not blindly assume that every statement in the knowledge
  base applies to this incident.
- Do not invent facts that are not supported by the incident
  log or the provided knowledge.
- Clearly distinguish confirmed causes from possible causes.
- If the evidence is insufficient to determine the exact root
  cause, explicitly state that the root cause is uncertain.
- Reduce confidence when the evidence is weak or ambiguous.

DEVOPS KNOWLEDGE:

${knowledgeContext}

--------------------------------------------------

INCIDENT LOG:

${log}

--------------------------------------------------

Return ONLY valid JSON.

The response MUST follow exactly this structure:

{
  "severity": "LOW | MEDIUM | HIGH | CRITICAL",
  "confidence": 0.0,
  "errorType": "string",
  "summary": "string",
  "rootCause": "string",
  "possibleCauses": ["string"],
  "recommendedSolution": "string",
  "prevention": "string"
}

Rules:

1. severity must be exactly one of:
   LOW, MEDIUM, HIGH, CRITICAL.

2. confidence must be a number between 0.0 and 1.0.

3. Confidence represents how strongly the provided evidence
   supports the identified root cause.

4. Use high confidence only when the incident log provides
   strong evidence.

5. If the incident is ambiguous, use a lower confidence score.

6. Do not increase confidence simply because a particular
   cause is common in DevOps incidents.

7. possibleCauses must be an array of strings.

8. The rootCause must explain the most likely cause based
   on the available evidence.

9. If the exact root cause cannot be determined, explicitly
   say that the root cause is uncertain.

10. recommendedSolution must contain practical troubleshooting
    or remediation steps.

11. prevention must contain practical steps to reduce the
    likelihood of the incident happening again.

12. Return JSON only. Do not include Markdown, explanations,
    or code fences outside the JSON object.
`;

    /*
     * STEP 5:
     * Ask Gemini for the analysis.
     */
    let result;
let lastError: unknown;

for (let attempt = 1; attempt <= 3; attempt++) {
  try {
    result = await model.generateContent(prompt);
    break;
  } catch (error: any) {
    lastError = error;

    const status = error?.status;

    const retryable =
      status === 429 ||
      status === 500 ||
      status === 502 ||
      status === 503 ||
      status === 504;

    if (!retryable || attempt === 3) {
      throw error;
    }

    const delay = attempt * 1000;

    console.log(
      `Gemini request failed with ${status}. ` +
      `Retrying in ${delay}ms...`
    );

    await new Promise((resolve) =>
      setTimeout(resolve, delay)
    );
  }
}

if (!result) {
  throw lastError ?? new Error("Gemini request failed");
}

const responseText = result.response.text();

    /*
     * STEP 6:
     * Clean the response and parse JSON.
     */
    const cleanedResponse = extractJson(responseText);

    let parsedResponse: unknown;

    try {
      parsedResponse = JSON.parse(cleanedResponse);
    } catch (error) {
      console.error("Failed to parse Gemini JSON response.");
      console.error("Gemini response:");
      console.error(responseText);

      throw new Error(
        "AI returned an invalid JSON response"
      );
    }

    /*
     * STEP 7:
     * Validate the AI response at runtime.
     */
    const validatedAnalysis =
      validateIncidentAnalysis(parsedResponse);

    /*
     * STEP 8:
     * Return validated analysis.
     */
    return validatedAnalysis;
  } catch (error) {
    console.error("AI analysis error:", error);

    throw new Error("Failed to analyze incident");
  }
};