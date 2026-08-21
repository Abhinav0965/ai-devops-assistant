import { GoogleGenerativeAI } from "@google/generative-ai";
import { searchKnowledge } from "../../knowledge/knowledge.service";

export interface IncidentAnalysis {
  severity: string;
  errorType: string;
  summary: string;
  rootCause: string;
  possibleCauses: string[];
  solution: string;
  prevention: string;
  confidence: number;
}

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("GEMINI_API_KEY is not configured");
}

const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({
  model: "gemini-3.6-flash",
});

/**
 * Remove markdown code fences if Gemini returns JSON
 * wrapped inside ```json ... ```
 */
const cleanJsonResponse = (text: string): string => {
  return text
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
};

/**
 * Validate and normalize Gemini's response.
 */
const normalizeAnalysis = (
  data: Partial<IncidentAnalysis>
): IncidentAnalysis => {
  const severity = String(
    data.severity || "MEDIUM"
  ).toUpperCase();

  const allowedSeverities = [
    "LOW",
    "MEDIUM",
    "HIGH",
    "CRITICAL",
  ];

  const normalizedSeverity = allowedSeverities.includes(
    severity
  )
    ? severity
    : "MEDIUM";

  const possibleCauses = Array.isArray(
    data.possibleCauses
  )
    ? data.possibleCauses.map((cause) =>
        String(cause)
      )
    : [];

  let confidence = Number(
    data.confidence ?? 0.5
  );

  if (Number.isNaN(confidence)) {
    confidence = 0.5;
  }

  confidence = Math.max(
    0,
    Math.min(1, confidence)
  );

  return {
    severity: normalizedSeverity,

    errorType: String(
      data.errorType ||
        "Unknown Error"
    ),

    summary: String(
      data.summary ||
        "The incident could not be fully summarized from the available log information."
    ),

    rootCause: String(
      data.rootCause ||
        "The root cause could not be determined with the available information."
    ),

    possibleCauses,

    solution: String(
      data.solution ||
        "Inspect application logs, metrics, dependencies, and configuration to identify the underlying failure."
    ),

    prevention: String(
      data.prevention ||
        "Improve monitoring, logging, health checks, and automated alerting for this type of failure."
    ),

    confidence,
  };
};

/**
 * Analyze a DevOps incident using:
 *
 * 1. Hybrid knowledge retrieval
 * 2. Gemini
 * 3. Structured JSON output
 */
export const analyzeIncident = async (
  log: string
): Promise<IncidentAnalysis> => {
  try {
    if (
      !log ||
      typeof log !== "string" ||
      log.trim().length === 0
    ) {
      throw new Error(
        "Incident log is required"
      );
    }

    /*
     * --------------------------------------------------
     * STEP 1: Retrieve relevant knowledge
     * --------------------------------------------------
     *
     * searchKnowledge() is asynchronous because it
     * generates embeddings.
     *
     * IMPORTANT:
     * We must use await here.
     */
    const relevantKnowledge =
      await searchKnowledge(log);

    /*
     * --------------------------------------------------
     * STEP 2: Convert retrieved knowledge into context
     * --------------------------------------------------
     */
    const knowledgeContext =
      relevantKnowledge.length > 0
        ? relevantKnowledge
            .map(
              (document, index) => `
KNOWLEDGE DOCUMENT ${index + 1}

Title:
${document.title}

Category:
${document.category}

Content:
${document.content}
`
            )
            .join("\n-----------------------------\n")
        : "No relevant knowledge documents were found.";

    /*
     * --------------------------------------------------
     * STEP 3: Build the AI prompt
     * --------------------------------------------------
     */
    const prompt = `
You are an expert AI DevOps incident analysis assistant.

Your job is to analyze the provided DevOps log and produce
a technically accurate incident diagnosis.

You have access to a small internal DevOps knowledge base.
Use it as supporting technical context.

IMPORTANT RULES:

1. Analyze the actual log carefully.
2. Use the retrieved knowledge when it is relevant.
3. Do not blindly copy the knowledge base.
4. Do not invent facts that are not supported by the log
   or reasonable DevOps knowledge.
5. If the log does not contain enough information to
   determine the exact root cause, explicitly say that
   the exact root cause is uncertain.
6. Distinguish between confirmed facts and possible causes.
7. Give practical remediation steps.
8. Consider Docker/container networking when the log
   indicates that services are running in containers.
9. Confidence must be between 0 and 1.
10. Return ONLY valid JSON.

REQUIRED JSON STRUCTURE:

{
  "severity": "LOW | MEDIUM | HIGH | CRITICAL",
  "errorType": "string",
  "summary": "string",
  "rootCause": "string",
  "possibleCauses": [
    "string",
    "string"
  ],
  "solution": "string",
  "prevention": "string",
  "confidence": 0.0
}

SEVERITY GUIDELINES:

LOW:
Minor issue with little or no user impact.

MEDIUM:
Service degradation, timeout, or recoverable issue.

HIGH:
Important service failure, database failure,
deployment failure, or significant user impact.

CRITICAL:
Major production outage, data loss, security incident,
or widespread system failure.

--------------------------------
RETRIEVED KNOWLEDGE
--------------------------------

${knowledgeContext}

--------------------------------
INCIDENT LOG
--------------------------------

${log}

--------------------------------
ANALYSIS
--------------------------------

Return only the JSON object.
`;

    /*
     * --------------------------------------------------
     * STEP 4: Call Gemini
     * --------------------------------------------------
     */
    const result =
      await model.generateContent({
        contents: [
          {
            role: "user",
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],

        generationConfig: {
          temperature: 0.2,
          responseMimeType: "application/json",
        },
      });

    /*
     * --------------------------------------------------
     * STEP 5: Extract Gemini response
     * --------------------------------------------------
     */
    const response =
      result.response;

    const text =
      response.text();

    if (!text) {
      throw new Error(
        "Gemini returned an empty response"
      );
    }

    /*
     * --------------------------------------------------
     * STEP 6: Parse JSON
     * --------------------------------------------------
     */
    const cleanedResponse =
      cleanJsonResponse(text);

    let parsedAnalysis: Partial<IncidentAnalysis>;

    try {
      parsedAnalysis =
        JSON.parse(
          cleanedResponse
        );
    } catch (parseError) {
      console.error(
        "Failed to parse Gemini JSON response:"
      );

      console.error(
        cleanedResponse
      );

      throw new Error(
        "Gemini returned invalid JSON"
      );
    }

    /*
     * --------------------------------------------------
     * STEP 7: Normalize and validate
     * --------------------------------------------------
     */
    const analysis =
      normalizeAnalysis(
        parsedAnalysis
      );

    console.log(
      "AI incident analysis completed"
    );

    console.log(
      `Severity: ${analysis.severity}`
    );

    console.log(
      `Error Type: ${analysis.errorType}`
    );

    console.log(
      `Confidence: ${analysis.confidence}`
    );

    console.log(
      `Knowledge Documents Used: ${relevantKnowledge.length}`
    );

    return analysis;
  } catch (error) {
    console.error(
      "AI analysis error:",
      error
    );

    throw new Error(
      "Failed to analyze incident"
    );
  }
};