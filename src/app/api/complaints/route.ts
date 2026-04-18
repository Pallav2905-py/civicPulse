import { NextRequest, NextResponse } from "next/server";
import { getAllComplaints, createComplaint, awardXP } from "@/lib/db";
import { classifyComplaint, calculatePriorityScore, getEstimatedResolution, getDepartment, analyzeSentiment } from "@/lib/ai";
import { ComplaintCategory } from "@/lib/types";

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);

    const filters = {
        status: searchParams.get("status") as any,
        category: searchParams.get("category") || undefined,
        priority: searchParams.get("priority") || undefined,
        department: searchParams.get("department") || undefined,
    };

    const complaints = await getAllComplaints(filters);
    return NextResponse.json(complaints);
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { title, description, latitude, longitude, address, photoUrl, userId, userName } = body;

        if (!title || !description) {
            return NextResponse.json(
                { error: "Title and description are required" },
                { status: 400 }
            );
        }

        // Run AI classification and sentiment analysis in parallel
        const [classification, sentiment] = await Promise.all([
            classifyComplaint(title, description),
            analyzeSentiment(title, description),
        ]);

        // Priority Scoring — with sentiment boost for ANGRY/DISTRESSED citizens
        let priority = calculatePriorityScore(
            classification.urgencyLevel,
            classification.affectedAreaSize,
            classification.estimatedPeopleAffected
        );

        // Sentiment-based priority boost: distressed/angry citizens get escalated faster
        if (sentiment.label === "ANGRY" || sentiment.label === "DISTRESSED") {
            const boostedScore = Math.min(10, priority.score + 1.5);
            let boostedLevel: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" = priority.level;
            if (boostedScore >= 8) boostedLevel = "CRITICAL";
            else if (boostedScore >= 6) boostedLevel = "HIGH";
            else if (boostedScore >= 4) boostedLevel = "MEDIUM";
            else boostedLevel = "LOW";
            priority = { score: Math.round(boostedScore * 10) / 10, level: boostedLevel };
        }

        // Department Routing
        const department = getDepartment(classification.category);

        // Estimated Resolution
        const estimatedResolution = getEstimatedResolution(priority.level);

        const complaint = await createComplaint({
            userId: userId || "user-demo",
            userName: userName || "Demo Citizen",
            title,
            description,
            photoUrl: photoUrl || undefined,
            latitude: latitude || 18.5204,
            longitude: longitude || 73.8567,
            address: address || "Pune, Maharashtra",
            category: classification.category as ComplaintCategory,
            priority: priority.level,
            priorityScore: priority.score,
            status: "SUBMITTED",
            department,
            upvoteCount: 0,
            upvotedBy: [],
            estimatedResolution,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            // Sentiment data
            sentimentLabel: sentiment.label,
            sentimentScore: sentiment.score,
            emotionTags: sentiment.emotionTags,
            empathyNote: sentiment.empathyNote,
        });

        // Award XP (fire and forget)
        if (userId && userId !== "user-demo") {
            awardXP(userId, 50, { hasPhoto: !!photoUrl }).catch(err =>
                console.error("Failed to award XP:", err)
            );
        }

        return NextResponse.json({
            complaint,
            classification,
            priority,
            department,
            sentiment,
        }, { status: 201 });
    } catch {
        return NextResponse.json(
            { error: "Failed to create complaint" },
            { status: 500 }
        );
    }
}
