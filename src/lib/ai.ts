import Groq from "groq-sdk";
import { ClassificationResult, ComplaintCategory, DEPARTMENT_MAP } from "./types";

// Initialize Groq
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || "" });

const CLASSIFICATION_PROMPT = `You are a civic complaint classification AI for an Indian city municipal system.

Analyze the following citizen complaint and return a JSON object with these exact fields:
- "category": one of: POTHOLE, STREETLIGHT, WATER_LEAK, GARBAGE, DRAINAGE, ROAD_DAMAGE, ILLEGAL_CONSTRUCTION, NOISE_POLLUTION, OTHER
- "confidence": a number between 0.0 and 1.0 indicating how confident you are
- "urgencyLevel": one of: CRITICAL, HIGH, MEDIUM, LOW
- "affectedAreaSize": one of: SMALL, MEDIUM, LARGE
- "estimatedPeopleAffected": estimated number of people affected (integer)
- "summary": a one-sentence summary of the issue and its severity

Guidelines for urgency (IMPORTANT - follow these closely):

- CRITICAL: Immediate threat to life or property
  Examples: fire, gas leak, building collapse, open manhole, exposed electrical wires, major flooding, bridge damage, dangerous structural failure, toxic spill

- HIGH: Serious safety hazard or severe disruption
  Examples: large pothole on main road, burst water pipe, multiple non-working streetlights in dark area, overflowing sewage, fallen tree blocking road, severe road damage

- MEDIUM: Ongoing inconvenience or minor safety concern
  Examples: single broken streetlight, small pothole, garbage not collected for 2-3 days, drainage blockage, minor water leak

- LOW: Minor cosmetic issue or general suggestion
  Examples: paint peeling, small cracks, noise complaint (one-time), request for new installation, minor graffiti

Return ONLY the JSON object, no markdown, no extra text.`;

export async function classifyComplaint(title: string, description: string): Promise<ClassificationResult> {
    try {
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: CLASSIFICATION_PROMPT },
                { role: "user", content: `Complaint Title: ${title}\nComplaint Description: ${description}` },
            ],
            model: "llama-3.3-70b-versatile",
            temperature: 0.2,
            response_format: { type: "json_object" },
        });

        const text = chatCompletion.choices[0]?.message?.content?.trim() || "{}";

        // Strip markdown code fences if present
        const jsonStr = text.replace(/^```json?\n?/i, "").replace(/\n?```$/i, "").trim();
        const parsed = JSON.parse(jsonStr);

        // Validate and sanitize
        const validCategories: ComplaintCategory[] = [
            "POTHOLE", "STREETLIGHT", "WATER_LEAK", "GARBAGE", "DRAINAGE",
            "ROAD_DAMAGE", "ILLEGAL_CONSTRUCTION", "NOISE_POLLUTION", "OTHER",
        ];
        const validUrgency = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];
        const validArea = ["SMALL", "MEDIUM", "LARGE"];

        return {
            category: validCategories.includes(parsed.category) ? parsed.category : "OTHER",
            confidence: Math.min(1, Math.max(0, Number(parsed.confidence) || 0.7)),
            urgencyLevel: validUrgency.includes(parsed.urgencyLevel) ? parsed.urgencyLevel : "MEDIUM",
            affectedAreaSize: validArea.includes(parsed.affectedAreaSize) ? parsed.affectedAreaSize : "MEDIUM",
            estimatedPeopleAffected: Math.max(1, Math.round(Number(parsed.estimatedPeopleAffected) || 50)),
            summary: parsed.summary || `Detected civic issue: ${title}`,
        };
    } catch (error) {
        console.error("Groq classification failed, using fallback:", error);
        return fallbackClassify(title, description);
    }
}

// ===== KEYWORD FALLBACK (used if Groq API fails) =====
function fallbackClassify(title: string, description: string): ClassificationResult {
    const text = `${title} ${description}`.toLowerCase();

    const CATEGORY_KEYWORDS: Record<ComplaintCategory, string[]> = {
        POTHOLE: ["pothole", "pot hole", "hole in road", "road hole", "crater"],
        STREETLIGHT: ["streetlight", "street light", "lamp", "light not working", "dark street", "no light", "bulb"],
        WATER_LEAK: ["water leak", "pipe burst", "broken pipe", "water flowing", "leaking pipe", "flooding"],
        GARBAGE: ["garbage", "trash", "waste", "dustbin", "rubbish", "dump", "litter", "foul smell"],
        DRAINAGE: ["drain", "drainage", "sewer", "gutter", "clogged drain", "blocked drain", "manhole"],
        ROAD_DAMAGE: ["road damage", "broken road", "crack", "road crack", "road repair", "damaged road"],
        ILLEGAL_CONSTRUCTION: ["illegal construction", "unauthorized", "encroachment"],
        NOISE_POLLUTION: ["noise", "loud", "music", "honking", "disturbance"],
        OTHER: [],
    };

    let bestCategory: ComplaintCategory = "OTHER";
    let bestScore = 0;
    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
        let score = 0;
        for (const keyword of keywords) {
            if (text.includes(keyword)) score += keyword.split(" ").length;
        }
        if (score > bestScore) {
            bestScore = score;
            bestCategory = category as ComplaintCategory;
        }
    }

    const urgencyMap: Record<string, string[]> = {
        CRITICAL: ["urgent", "emergency", "dangerous", "accident", "burst", "flood", "collapse"],
        HIGH: ["serious", "broken", "weeks", "safety", "unsafe", "multiple"],
        MEDIUM: ["days", "problem", "issue", "complaint", "needs repair"],
        LOW: ["minor", "small", "cosmetic", "suggestion"],
    };

    let urgencyLevel: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" = "MEDIUM";
    let urgencyScore = 0;
    for (const [level, keywords] of Object.entries(urgencyMap)) {
        let score = 0;
        for (const kw of keywords) { if (text.includes(kw)) score++; }
        if (score > urgencyScore) {
            urgencyScore = score;
            urgencyLevel = level as "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
        }
    }

    const peopleMap = { SMALL: 10, MEDIUM: 50, LARGE: 200 };
    const affectedAreaSize = "MEDIUM" as const;

    return {
        category: bestCategory,
        confidence: Math.min(0.95, 0.6 + bestScore * 0.1),
        urgencyLevel,
        affectedAreaSize,
        estimatedPeopleAffected: peopleMap[affectedAreaSize],
        summary: `Detected ${bestCategory.replace("_", " ").toLowerCase()} issue with ${urgencyLevel.toLowerCase()} urgency.`,
    };
}

export function calculatePriorityScore(
    urgencyLevel: string,
    affectedAreaSize: string,
    estimatedPeopleAffected: number,
    upvoteCount: number = 0
): { score: number; level: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" } {
    const urgencyMap: Record<string, number> = { CRITICAL: 10, HIGH: 7, MEDIUM: 5, LOW: 2 };
    const areaMap: Record<string, number> = { LARGE: 10, MEDIUM: 6, SMALL: 3 };

    const urgencyValue = urgencyMap[urgencyLevel] || 5;
    const impactValue = Math.min(10, estimatedPeopleAffected / 20);
    const spreadValue = areaMap[affectedAreaSize] || 5;
    const votesValue = Math.min(10, upvoteCount / 5);

    const score =
        urgencyValue * 0.4 + impactValue * 0.3 + spreadValue * 0.2 + votesValue * 0.1;

    let level: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
    if (score >= 8) level = "CRITICAL";
    else if (score >= 6) level = "HIGH";
    else if (score >= 4) level = "MEDIUM";
    else level = "LOW";

    return { score: Math.round(score * 10) / 10, level };
}

export function getEstimatedResolution(priority: string): string {
    const now = new Date();
    const daysMap: Record<string, number> = {
        CRITICAL: 1,
        HIGH: 3,
        MEDIUM: 7,
        LOW: 14,
    };
    const days = daysMap[priority] || 7;
    now.setDate(now.getDate() + days);
    return now.toISOString();
}

export function getDepartment(category: ComplaintCategory): string {
    return DEPARTMENT_MAP[category] || "General Administration";
}
