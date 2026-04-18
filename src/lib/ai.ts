import Groq from "groq-sdk";
import { ClassificationResult, ComplaintCategory, DEPARTMENT_MAP, SentimentLabel, SentimentResult } from "./types";

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

const SENTIMENT_PROMPT = `You are an empathy-aware NLP sentiment analyzer for a civic grievance platform.

Analyze the emotional tone of the following citizen complaint and return a JSON object with these exact fields:
- "label": one of: POSITIVE, NEUTRAL, FRUSTRATED, DISTRESSED, ANGRY
  * POSITIVE: citizen is cooperative, hopeful, or grateful even while reporting an issue
  * NEUTRAL: calm, factual, no strong emotion
  * FRUSTRATED: mild to moderate irritation, impatience — common in repeat/ignored issues
  * DISTRESSED: anxious, worried, scared, helpless — safety/health concerns
  * ANGRY: very upset, uses strong language, feels ignored or wronged
- "score": confidence float 0.0–1.0
- "emotionTags": array of 2–4 short lowercase emotion words detected (e.g. ["worried", "exhausted", "hopeful", "urgent"])
- "empathyNote": a single, concise sentence written for the municipal officer explaining how to respond empathetically (max 20 words)

Focus ONLY on the emotional tone, not the complaint topic.
Return ONLY the JSON object, no markdown, no extra text.`;

// ===== CLASSIFICATION =====
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

// ===== SENTIMENT ANALYSIS =====
export async function analyzeSentiment(title: string, description: string): Promise<SentimentResult> {
    try {
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: SENTIMENT_PROMPT },
                { role: "user", content: `Complaint Title: ${title}\nComplaint Description: ${description}` },
            ],
            model: "llama-3.3-70b-versatile",
            temperature: 0.3,
            response_format: { type: "json_object" },
        });

        const text = chatCompletion.choices[0]?.message?.content?.trim() || "{}";
        const jsonStr = text.replace(/^```json?\n?/i, "").replace(/\n?```$/i, "").trim();
        const parsed = JSON.parse(jsonStr);

        const validLabels: SentimentLabel[] = ["POSITIVE", "NEUTRAL", "FRUSTRATED", "DISTRESSED", "ANGRY"];

        return {
            label: validLabels.includes(parsed.label) ? parsed.label : "NEUTRAL",
            score: Math.min(1, Math.max(0, Number(parsed.score) || 0.5)),
            emotionTags: Array.isArray(parsed.emotionTags)
                ? parsed.emotionTags.slice(0, 4).map((t: unknown) => String(t).toLowerCase())
                : [],
            empathyNote: parsed.empathyNote
                ? String(parsed.empathyNote).slice(0, 200)
                : "Acknowledge the citizen's concern and provide a clear timeline for resolution.",
        };
    } catch (error) {
        console.error("Groq sentiment analysis failed, using fallback:", error);
        return fallbackSentiment(title, description);
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

function fallbackSentiment(title: string, description: string): SentimentResult {
    const text = `${title} ${description}`.toLowerCase();

    const sentimentKeywords: Record<SentimentLabel, string[]> = {
        ANGRY: ["angry", "furious", "outraged", "disgusting", "unacceptable", "pathetic", "useless", "fed up", "worst", "terrible", "horrible"],
        DISTRESSED: ["scared", "afraid", "dangerous", "help", "urgent", "emergency", "worried", "anxious", "panic", "helpless", "desperate", "fear"],
        FRUSTRATED: ["frustrated", "tired", "again", "still", "months", "weeks", "ignored", "nothing done", "no response", "repeatedly", "keep complaining"],
        POSITIVE: ["thank", "appreciate", "good work", "great", "glad", "hope", "please", "kindly", "request"],
        NEUTRAL: [],
    };

    let bestLabel: SentimentLabel = "NEUTRAL";
    let bestScore = 0;
    for (const [label, keywords] of Object.entries(sentimentKeywords)) {
        let score = 0;
        for (const kw of keywords) { if (text.includes(kw)) score++; }
        if (score > bestScore) {
            bestScore = score;
            bestLabel = label as SentimentLabel;
        }
    }

    const empathyNotes: Record<SentimentLabel, string> = {
        ANGRY: "Respond with immediate acknowledgment and a concrete action timeline to de-escalate.",
        DISTRESSED: "Prioritize this case and reach out proactively — citizen feels unsafe.",
        FRUSTRATED: "Acknowledge the delay and provide a specific updated timeline.",
        POSITIVE: "Thank the citizen and maintain the positive experience with timely updates.",
        NEUTRAL: "Respond professionally with expected resolution steps and timeline.",
    };

    return {
        label: bestLabel,
        score: bestScore > 0 ? Math.min(0.85, 0.55 + bestScore * 0.1) : 0.5,
        emotionTags: [],
        empathyNote: empathyNotes[bestLabel],
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
