import { GoogleGenAI, Type } from "@google/genai";
import { Artifact, AuditFinding, AuditReport } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const AUDIT_SYSTEM_PROMPT = `You are Trace, an expert macOS security engineer. Your task is to audit macOS security posture based on provided artifacts (command outputs, plists, logs).

Guidelines:
1. CITATION: For every finding, you MUST cite the exact artifact and include the relevant snippet of text.
2. SEVERITY: Categorize findings as Critical, High, Medium, or Low.
3. REMEDIATION: Provide copy-pasteable terminal commands or configuration profile snippets for remediation.
4. DATA: Analyze Gatekeeper (spctl), SIP (csrutil), FileVault (fdesetup), MDM Profiles, TCC, and system configurations.
5. FORMAT: Respond with a structured analysis. If multiple artifacts are provided, look for cross-artifact correlations.

Your goal is to harden the macOS endpoint to industry standards like CIS macOS Benchmark.`;

export async function runAuditStream(
  artifacts: Artifact[],
  workflow: string,
  onChunk: (chunk: string) => void
): Promise<string> {
  const artifactContext = artifacts.map(a => 
    `--- ARTIFACT: ${a.name} (${a.type}) ---\n${a.content}\n--- END ARTIFACT ---`
  ).join('\n\n');

  const prompt = `Workflow: ${workflow}\n\nPlease audit the following macOS artifacts and provide a comprehensive report.\n\n${artifactContext}`;

  try {
    const stream = await ai.models.generateContentStream({
      model: "gemini-3.1-pro-preview",
      contents: prompt,
      config: {
        systemInstruction: AUDIT_SYSTEM_PROMPT,
        temperature: 0.7,
      },
    });

    let fullText = "";
    for await (const chunk of stream) {
      const text = chunk.text;
      if (text) {
        fullText += text;
        onChunk(text);
      }
    }
    return fullText;
  } catch (error) {
    console.error("Audit Stream Error:", error);
    throw error;
  }
}

export async function parseAuditReport(auditText: string): Promise<Partial<AuditReport>> {
  // This helper would use Gemini to turn the markdown report into structured data if needed
  // For now, we'll rely on the markdown rendering for the UI
  return {
    summary: auditText,
    findings: [],
    score: 0
  };
}
