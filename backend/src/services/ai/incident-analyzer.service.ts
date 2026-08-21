import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("GEMINI_API_KEY is not configured");
}

const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({
  model: "gemini-3.6-flash",
});

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

export const analyzeIncident = async (
  log: string
): Promise<IncidentAnalysis> => {
  const prompt = `
You are an expert DevOps and Site Reliability Engineer.

Analyze the following DevOps incident log.

Return ONLY valid JSON.
Do not include markdown.
Do not include code fences.
Do not add explanations outside the JSON.

Required JSON structure:

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

1. severity must be one of:
   LOW, MEDIUM, HIGH, CRITICAL.

2. Identify the most likely error type.

3. Give a concise summary.

4. Explain the most likely root cause based only on the provided log.

5. List plausible causes.

6. Give practical remediation steps.

7. Explain how the incident could be prevented.

8. Do not invent information.
   If the log does not provide enough information,
   explicitly state that the root cause is uncertain.

9. confidence must be a number between 0.0 and 1.0.

10. Confidence represents how strongly the provided log supports
    the identified root cause.

11. Use high confidence only when the log provides strong evidence.

12. If the log is ambiguous or lacks sufficient information,
    use a lower confidence score and explicitly state that the
    root cause is uncertain.

13. Never increase confidence simply because a particular cause
    is common in DevOps incidents.

DevOps log:

${log}
`;

  const result = await model.generateContent(prompt);

  const response = result.response.text().trim();

  try {
  const parsed = JSON.parse(response);

  return validateIncidentAnalysis(parsed);
} catch (error) {
  console.error("Invalid Gemini response:");
  console.error(response);

  throw new Error("AI returned an invalid analysis format");
}
};