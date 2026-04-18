import { NextResponse } from "next/server";
import { classifyComplaint, calculatePriorityScore, getDepartment, getEstimatedResolution } from "@/lib/ai";

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

        const classification = await classifyComplaint(title || "", description || "");
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
        });
    } catch {
        return NextResponse.json(
            { error: "Classification failed" },
            { status: 500 }
        );
    }
}
