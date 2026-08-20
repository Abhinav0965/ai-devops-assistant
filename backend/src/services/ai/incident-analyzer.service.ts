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
  errorType: string;
  summary: string;
  rootCause: string;
  possibleCauses: string[];
  recommendedSolution: string;
  prevention: string;
}

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

DevOps log:

${log}
`;

  const result = await model.generateContent(prompt);

  const response = result.response.text().trim();

  try {
    return JSON.parse(response) as IncidentAnalysis;
  } catch (error) {
    console.error("Invalid Gemini response:");
    console.error(response);

    throw new Error("AI returned an invalid analysis format");
  }
};