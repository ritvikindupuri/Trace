import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

// Helper to extract JSON from a string that might contain markdown or extra text
function extractJSON(text: string) {
  try {
    // Try simple parse first
    return JSON.parse(text);
  } catch (e) {
    // Try to find JSON block
    const jsonMatch = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (innerError) {
        // If it still fails, try to clean up more aggressively
        const cleaned = text
          .replace(/```json/g, "")
          .replace(/```/g, "")
          .trim();
        
        // Find first { or [ and last } or ]
        const firstBrace = cleaned.indexOf('{');
        const firstBracket = cleaned.indexOf('[');
        const lastBrace = cleaned.lastIndexOf('}');
        const lastBracket = cleaned.lastIndexOf(']');
        
        let start = -1;
        let end = -1;
        
        if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
          start = firstBrace;
          end = lastBrace;
        } else if (firstBracket !== -1) {
          start = firstBracket;
          end = lastBracket;
        }
        
        if (start !== -1 && end !== -1 && end > start) {
          try {
            return JSON.parse(cleaned.substring(start, end + 1));
          } catch (finalError) {
            throw finalError;
          }
        }
        throw innerError;
      }
    }
    throw e;
  }
}

// Helper for exponential backoff
async function callGeminiWithRetry(prompt: string, retries = 3, delay = 1000): Promise<string | null> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });
      return response.text;
    } catch (error: any) {
      const errorMessage = error?.message || String(error);
      const isRateLimit = error?.status === 429 || errorMessage.includes('429');
      const isTransientError = error?.status === 500 || 
                               errorMessage.includes('500') || 
                               errorMessage.includes('xhr error') || 
                               errorMessage.includes('Rpc failed') ||
                               errorMessage.includes('UNKNOWN');

      if (isRateLimit || isTransientError) {
        if (i === retries - 1) throw error;
        // Wait longer for 500 errors
        const waitTime = isTransientError ? delay * 2 * Math.pow(2, i) : delay * Math.pow(2, i);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
      throw error;
    }
  }
  return null;
}

export async function chatAboutVisibilityMatrix(scores: any, message: string, history: { role: 'user' | 'model', parts: string }[]) {
  try {
    const chat = ai.chats.create({
      model: "gemini-3-flash-preview",
      config: {
        systemInstruction: `You are a macOS Telemetry Visibility Expert. You are discussing the Visibility Matrix with a security engineer.
            
            Current Visibility Scores: ${JSON.stringify(scores)}
            
            The visibility score is calculated based on:
            - Base Score (85): The theoretical maximum visibility for a well-instrumented macOS system.
            - Gaps (-X): Points deducted for identified telemetry gaps (e.g., missing ESF events, unified log noise).
            - Signals (+X): Points added for high-fidelity signals and proactive detections found during simulations.
            
            When explaining a score:
            1. Be 100% accurate based on the provided scores and simulation data.
            2. Explain what the score means for that specific attack vector.
            3. Detail how it was calculated, referencing exact processes and findings from current simulations.
            4. Use clear headers, bold text for emphasis, and proper spacing.
            5. Keep the tone professional, authoritative, and easy to understand.`
      },
      history: history.map(h => ({ role: h.role, content: { parts: [{ text: h.parts }] } }))
    });

    const result = await chat.sendMessage({ message });
    return result.text;
  } catch (error) {
    console.error("Gemini API Error chatting about visibility matrix:", error);
    return "I'm having trouble connecting to the visibility intelligence engine right now. Please try again in a moment.";
  }
}

export async function chatAboutSurfaceItem(name: string, category: string, description: string, message: string, history: { role: 'user' | 'model', parts: string }[]) {
  try {
    const chat = ai.chats.create({
      model: "gemini-3-flash-preview",
      config: {
        systemInstruction: `You are a macOS security research lead. You are discussing a specific attack surface item with a security engineer.
            
            Item Name: ${name}
            Category: ${category}
            Description: ${description}
            
            Provide deep technical insights, explain tradecraft, and suggest hardening steps. Keep the tone professional, authoritative, and research-oriented. Use proper spacing and bolding for readability.`
      },
      history: history.map(h => ({ role: h.role, content: { parts: [{ text: h.parts }] } }))
    });

    const result = await chat.sendMessage({ message });
    return result.text;
  } catch (error) {
    console.error("Gemini API Error chatting about surface item:", error);
    return "I'm having trouble connecting to the intelligence engine right now. Please try again in a moment.";
  }
}

export async function analyzeSurfaceItem(name: string, category: string, description: string) {
  try {
    const prompt = `You are a macOS security research lead. Provide a professional, deep technical analysis of the following attack surface item.
      
      Item Name: ${name}
      Category: ${category}
      Description: ${description}
      
      Structure your response with the following sections:
      
      ### 1. Technical Overview
      Provide a high-level technical summary of what this component is and its role in the macOS ecosystem. Use bold text for key terms.
      
      ### 2. Security Implications
      Explain the potential risks associated with this item. Why is it being monitored? What could an adversary do if they compromised or leveraged this component?
      
      ### 3. Adversary Tradecraft
      Detail how a sophisticated threat actor might target this specific area. Mention relevant MITRE ATT&CK techniques if applicable.
      
      ### 4. Verification & Hardening
      Provide 2-3 actionable, professional steps for a security engineer to verify the integrity of this item and harden it against potential abuse.
      
      Use professional language, proper spacing, and bolding for readability. Keep the tone authoritative and research-oriented.`;

    const text = await callGeminiWithRetry(prompt);
    return text;
  } catch (error) {
    console.error("Gemini API Error analyzing surface item:", error);
    return "Technical analysis is currently unavailable. Please check your connection or try again later.";
  }
}

export async function explainAttackScenario(scenarioName: string, description: string) {
  try {
    const prompt = `You are a macOS security research assistant. Explain the following attack scenario in detail, focusing on the tradecraft and expected telemetry signals.
      
      Scenario: ${scenarioName}
      Description: ${description}
      
      Structure your response using the following format:
      ### 1. Attack Summary
      Provide a concise, human-readable summary of the attack vector and its objectives.
      
      ### 2. Adversary Workflow
      Use a bulleted list to describe the step-by-step technical workflow an adversary would follow.
      
      ### 3. Telemetry & Detection Signals
      Use a bulleted list to specify exactly what an analyst should look for in telemetry logs:
      * **Process Events**: (e.g., specific process names, parent-child relationships)
      * **File System**: (e.g., sensitive file paths, unusual extensions)
      * **Network Activity**: (e.g., C2 patterns, non-standard ports)
      * **macOS Specifics**: (e.g., TCC, XProtect, Gatekeeper overrides)
      
      ### 4. Hardening Recommendations
      Provide 2-3 actionable steps to mitigate this specific threat.
      
      Use bold text for emphasis and ensure proper spacing between sections. Keep the tone professional and research-oriented.`;

    const text = await callGeminiWithRetry(prompt);
    return text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "AI Analysis is currently unavailable due to rate limits. Please try again in a few minutes.";
  }
}

export async function analyzeTelemetryGap(gapReason: string, impact: string) {
  try {
    const prompt = `As a detection engineer, provide a brief analyst-facing reasoning for the following telemetry gap:
      
      Reason: ${gapReason}
      Impact: ${impact}
      
      Explain why this gap is critical and what alternative signals might be used if this primary signal is missing.`;

    const text = await callGeminiWithRetry(prompt);
    return text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Gap analysis unavailable.";
  }
}

export async function generateAttackScenario(prompt: string) {
  try {
    const aiPrompt = `You are a macOS security research assistant. Based on the user's prompt, generate a structured macOS attack scenario in JSON format.
      
      Prompt: ${prompt}
      
      The JSON must follow this structure:
      {
        "name": "Scenario Name",
        "description": "Brief description",
        "severity": "low" | "medium" | "high" | "critical",
        "steps": [
          {
            "order": 1,
            "description": "Step description",
            "mitre_mapping": { "tactic": "Tactic Name", "technique_id": "TXXXX", "technique_name": "Technique Name" },
            "expected_signals": [
              { "event_type": "type", "category": "execution|persistence|file_system|network|privilege|tcc|sip|xprotect", "description": "Signal description", "process_name": "optional", "command_line": "optional", "file_path": "optional" }
            ]
          }
        ]
      }
      
      Ensure the scenario is technically accurate for macOS. Return ONLY the JSON object.`;

    const text = await callGeminiWithRetry(aiPrompt);
    if (!text) throw new Error("No response from Gemini");
    return extractJSON(text);
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to generate scenario. Rate limit reached.");
  }
}

export async function scanAttackSurface() {
  try {
    const prompt = `You are a macOS security auditor. Generate a realistic security posture report for a modern macOS developer machine.
      
      Return a JSON object with two arrays:
      1. "surface": 5-7 items following this structure:
         {
           "id": "surf-X",
           "category": "sip_config" | "tcc_permission" | "launch_item" | "system_extension" | "gatekeeper" | "xprotect",
           "name": "Human readable name",
           "status": "secure" | "warning" | "vulnerable",
           "description": "Detailed description of the finding",
           "last_checked": "ISO timestamp",
           "tactic": "MITRE Tactic (e.g., Persistence, Defense Evasion)"
         }
      2. "recommendations": 3-4 items following this structure:
         {
           "title": "Short title",
           "desc": "Actionable description",
           "insight": "Security research context"
         }
      
      Ensure the findings are diverse and reflect common real-world configurations.
      Return ONLY the JSON object.`;

    const text = await callGeminiWithRetry(prompt);
    if (!text) return getFallbackSurface();
    return extractJSON(text);
  } catch (error) {
    console.error("Gemini API Error:", error);
    return getFallbackSurface();
  }
}

function getFallbackSurface() {
  return {
    surface: [
      {
        id: "surf-1",
        category: "sip_config",
        name: "System Integrity Protection",
        status: "secure",
        description: "SIP is enabled and protecting system directories from unauthorized modification.",
        last_checked: new Date().toISOString()
      },
      {
        id: "surf-2",
        category: "tcc_permission",
        name: "Full Disk Access: Terminal",
        status: "warning",
        description: "Terminal.app has Full Disk Access, which could be leveraged by malicious scripts.",
        last_checked: new Date().toISOString()
      },
      {
        id: "surf-3",
        category: "launch_item",
        name: "Unsigned LaunchAgent",
        status: "vulnerable",
        description: "Detected an unsigned LaunchAgent in ~/Library/LaunchAgents/com.sys.update.plist.",
        last_checked: new Date().toISOString()
      }
    ],
    recommendations: [
      {
        title: "Audit TCC Permissions",
        desc: "Review applications with Full Disk Access and remove unnecessary entries.",
        insight: "TCC bypasses are a common goal for macOS malware to access user data."
      },
      {
        title: "Enable Gatekeeper",
        desc: "Ensure Gatekeeper is set to 'App Store and identified developers'.",
        insight: "Gatekeeper prevents the execution of unsigned or unnotarized code."
      }
    ]
  };
}

export async function bootstrapSystem() {
  try {
    const prompt = `You are a macOS security research lead. Generate a complete initial state for a security intelligence platform.
      
      Return a JSON object with the following structure:
      {
        "scenarios": [
          {
            "id": "scenario-X",
            "name": "Scenario Name",
            "description": "Description",
            "severity": "low" | "medium" | "high" | "critical",
            "steps": [
              {
                "id": "step-X",
                "order": 1,
                "description": "Step description",
                "mitre_mapping": { "tactic": "Tactic", "technique_id": "TXXXX", "technique_name": "Technique" },
                "expected_signals": [
                  { "event_type": "type", "category": "execution|persistence|file_system|network|privilege|tcc|sip|xprotect", "description": "Signal description", "process_name": "optional", "command_line": "optional", "file_path": "optional" }
                ]
              }
            ]
          }
        ],
        "anomalies": [
          {
            "id": "anom-X",
            "title": "Anomaly Title",
            "description": "Brief description",
            "time": "e.g., 2m ago",
            "severity": "info" | "warning" | "critical",
            "details": "Deep technical details"
          }
        ],
        "surface": [
          {
            "id": "surf-X",
            "category": "sip_config" | "tcc_permission" | "launch_item" | "system_extension" | "gatekeeper" | "xprotect",
            "name": "Name",
            "status": "secure" | "warning" | "vulnerable",
            "description": "Description",
            "last_checked": "ISO timestamp",
            "tactic": "MITRE Tactic"
          }
        ],
        "recommendations": [
          { "title": "Title", "desc": "Description", "insight": "Insight" }
        ],
        "researchAlignment": {
          "headline": "Current Research Focus",
          "description": "Detailed alignment with emerging threats",
          "analystTip": "Actionable tip",
          "researchFocus": "Specific technical focus area"
        }
      }
      
      Generate exactly 10 unique scenarios, 10 anomalies, 8 surface items, 5 recommendations, and 1 research alignment object.
      IMPORTANT: Each attack scenario MUST have at least 3-5 sequential steps to model a complete adversary workflow (e.g., Initial Access -> Execution -> Persistence -> Exfiltration).
      Ensure all content is technically accurate for macOS security research.
      Return ONLY the JSON object.`;

    const text = await callGeminiWithRetry(prompt);
    if (!text) return getFallbackBootstrap();
    return extractJSON(text);
  } catch (error) {
    console.error("Gemini API Error during bootstrap:", error);
    return getFallbackBootstrap();
  }
}

function getFallbackBootstrap() {
  return {
    scenarios: [], // TelemetryContext will use PREDEFINED_SCENARIOS
    anomalies: [
      {
        id: "anom-1",
        title: "Suspicious LaunchAgent Creation",
        description: "An unsigned plist was written to a persistence directory.",
        time: "5m ago",
        severity: "warning",
        details: "Process 'curl' spawned a child process that wrote to ~/Library/LaunchAgents."
      }
    ],
    surface: getFallbackSurface().surface,
    recommendations: getFallbackSurface().recommendations,
    researchAlignment: {
      headline: "macOS Persistence Trends",
      description: "Adversaries are increasingly using non-standard persistence mechanisms like Periodic Scripts and Folder Actions.",
      analystTip: "Monitor for changes in /etc/periodic/ and ~/Library/Scripts/Folder Action Scripts.",
      researchFocus: "Persistence Evasion"
    }
  };
}

export async function analyzeAdversaryAction(stepDescription: string, previousOutput: string) {
  try {
    const prompt = `You are a macOS adversary emulation expert. Analyze the output of a previous command and provide a brief, dynamic description of the next adversary action.
      
      Next Step Goal: ${stepDescription}
      Previous Command Output: ${previousOutput}
      
      Provide a concise (1 sentence) description of what the adversary is doing right now, taking into account the context of the previous output. For example, if the previous output showed a successful file discovery, the next action might be "Leveraging the discovered configuration file to extract credentials."
      
      Return ONLY the text of the description.`;

    const text = await callGeminiWithRetry(prompt, 2, 500); // Fewer retries for real-time simulation
    return text || stepDescription;
  } catch (error) {
    console.error("Gemini API Error analyzing action:", error);
    return stepDescription; // Fallback
  }
}

export async function generateSimulationGaps(scenarioName: string, steps: any[]) {
  try {
    const prompt = `You are a detection engineer. Analyze the following macOS attack scenario and identify 0-2 realistic telemetry gaps that might exist in a standard corporate environment.
      
      Scenario: ${scenarioName}
      Steps: ${JSON.stringify(steps)}
      
      Return a JSON array of gap objects:
      [
        {
          "scenario_id": "string",
          "step_id": "string",
          "missing_signal": "Signal name",
          "reason": "Why is this missing? (e.g., Unified Log noise, ESF limitation)",
          "impact": "Security impact"
        }
      ]
      
      Return ONLY the JSON array. If no gaps are identified, return [].`;

    const text = await callGeminiWithRetry(prompt);
    if (!text) return [];
    return extractJSON(text);
  } catch (error) {
    console.error("Gemini API Error identifying gaps:", error);
    return [];
  }
}

export async function fetchLatestMacOSThreats() {
  try {
    const prompt = `You are a macOS threat intelligence researcher. Fetch and summarize the latest macOS-specific security threats, malware campaigns, and zero-day vulnerabilities.
      
      Return a JSON object with:
      {
        "researchAlignment": {
          "headline": "Current Research Focus",
          "description": "Detailed alignment with emerging threats",
          "analystTip": "Actionable tip",
          "researchFocus": "Specific technical focus area"
        },
        "newThreats": [
          {
            "id": "string",
            "title": "Threat Title",
            "summary": "Brief summary of the detection",
            "severity": "info" | "warning" | "critical"
          }
        ]
      }
      
      Ensure the threats are realistic and reflect the current macOS landscape (e.g., XCSSET, Shlayer, Silver Sparrow, or new TCC bypasses).
      Return ONLY the JSON object.`;

    const text = await callGeminiWithRetry(prompt);
    if (!text) return getFallbackThreats();
    return extractJSON(text);
  } catch (error) {
    console.error("Gemini API Error fetching threats:", error);
    return getFallbackThreats();
  }
}

export async function getSimulationAdvisorNotification(scenarioName: string, runCount: number) {
  try {
    const prompt = `You are a macOS security simulation advisor. A security engineer has run the attack scenario "${scenarioName}" ${runCount} times. 
      
      Your goal is to decide if the user has run this simulation enough times to understand the attack's evolution. 
      Usually, 3-5 runs are sufficient for most scenarios, but it depends on the complexity.
      
      Return a JSON object:
      {
        "shouldNotify": boolean,
        "message": "A brief, professional notification message advising them if they have enough data."
      }
      
      If shouldNotify is true, the message should explain that enough data has been collected to understand the tradecraft evolution.
      If shouldNotify is false, the message can be empty or a brief encouragement.
      
      Return ONLY the JSON object.`;

    const text = await callGeminiWithRetry(prompt);
    if (!text) return { shouldNotify: false, message: "" };
    return extractJSON(text);
  } catch (error) {
    console.error("Gemini API Error getting advisor notification:", error);
    return { shouldNotify: false, message: "" };
  }
}

function getFallbackThreats() {
  return {
    researchAlignment: {
      headline: "Emerging macOS Tradecraft",
      description: "Recent research highlights new bypasses for System Integrity Protection (SIP) via third-party kernel extensions.",
      analystTip: "Audit all third-party kernel extensions and their entitlements.",
      researchFocus: "Kernel Security"
    },
    newThreats: [
      {
        id: "threat-1",
        title: "New Shlayer Variant",
        summary: "A new variant of Shlayer adware has been observed using novel obfuscation techniques to bypass XProtect.",
        severity: "warning"
      }
    ]
  };
}
