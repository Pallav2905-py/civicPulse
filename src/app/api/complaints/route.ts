import { NextRequest, NextResponse } from "next/server";
import { getAllComplaints, createComplaint, awardXP } from "@/lib/db";
import { classifyComplaint, calculatePriorityScore, getEstimatedResolution, getDepartment } from "@/lib/ai";
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

        // AI Classification
        const classification = await classifyComplaint(title, description);

        // Priority Scoring
        const priority = calculatePriorityScore(
            classification.urgencyLevel,
            classification.affectedAreaSize,
            classification.estimatedPeopleAffected
        );

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
        }, { status: 201 });
    } catch {
        return NextResponse.json(
            { error: "Failed to create complaint" },
            { status: 500 }
        );
    }
}
