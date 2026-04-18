import { NextResponse } from "next/server";
import { classifyComplaint, calculatePriorityScore, getDepartment, getEstimatedResolution } from "@/lib/ai";
import { createComplaint } from "@/lib/db";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { from, subject, text, html } = body;

        // 1. Validation
        if (!from || (!text && !html)) {
            return NextResponse.json(
                { error: "Missing required fields: from, and either text or html" },
                { status: 400 }
            );
        }

        // 2. Sanitization / Cleaning
        // Prefer plain text, otherwise strip HTML tags
        let content = text || "";
        if (!content && html) {
            // Basic regex to strip HTML tags. 
            // Note: In production, consider a library like 'sanitize-html' or 'jsdom'
            content = html.replace(/<[^>]*>?/gm, " ")
                .replace(/\s+/g, " ") // normalize whitespace
                .trim();
        }

        if (content.length < 10) {
            return NextResponse.json(
                { error: "Content too short to allow processing" },
                { status: 400 }
            );
        }

        const title = subject || "Email Complaint";

        // 3. AI Classification
        const classification = await classifyComplaint(title, content);

        // 4. Calculate Priority & Metadata
        const { score, level } = calculatePriorityScore(
            classification.urgencyLevel,
            classification.affectedAreaSize,
            classification.estimatedPeopleAffected
        );

        const department = getDepartment(classification.category);
        const estimatedResolution = getEstimatedResolution(level);

        // 5. Database Storage
        // Default location to Pune/City Center since email doesn't have geolocation
        const DEFAULT_LAT = 18.5204;
        const DEFAULT_LNG = 73.8567;

        const complaint = await createComplaint({
            userId: "email-bot", // Virtual user for email submissions
            userName: from, // Use the sender's email as the name
            title: title,
            description: content,
            photoUrl: undefined, // Email attachments not handled in this simple version
            latitude: DEFAULT_LAT,
            longitude: DEFAULT_LNG,
            address: "Reported via Email",
            category: classification.category,
            priority: level,
            priorityScore: score,
            status: "SUBMITTED",
            department: department,
            upvoteCount: 0,
            upvotedBy: [],
            estimatedResolution: estimatedResolution,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        });

        return NextResponse.json({
            success: true,
            message: "Complaint created successfully",
            id: complaint.id,
            data: {
                category: classification.category,
                priority: level,
                department: department
            }
        }, { status: 201 });

    } catch (error) {
        console.error("Error processing email complaint:", error);
        return NextResponse.json(
            { error: "Internal processing error" },
            { status: 500 }
        );
    }
}
