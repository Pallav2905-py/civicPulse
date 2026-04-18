import { NextResponse } from "next/server";
import { classifyComplaint, calculatePriorityScore, getDepartment, getEstimatedResolution, analyzeSentiment } from "@/lib/ai";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { title, description } = body;

        if (!title && !description) {
            return NextResponse.json(
                { error: "Title or description required" },
                { status: 400 }
            );
        }

        // Run both in parallel for the real-time preview
        const [classification, sentiment] = await Promise.all([
            classifyComplaint(title || "", description || ""),
            analyzeSentiment(title || "", description || ""),
        ]);

        const priority = calculatePriorityScore(
            classification.urgencyLevel,
            classification.affectedAreaSize,
            classification.estimatedPeopleAffected
        );
        const department = getDepartment(classification.category);
        const estimatedResolution = getEstimatedResolution(priority.level);

        return NextResponse.json({
            classification,
            priority,
            department,
            estimatedResolution,
            sentiment,
        });
    } catch {
        return NextResponse.json(
            { error: "Classification failed" },
            { status: 500 }
        );
    }
}
