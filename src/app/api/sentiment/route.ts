import { NextRequest, NextResponse } from "next/server";
import { getSentimentAnalytics, getAllComplaints, updateComplaintSentiment } from "@/lib/db";
import { analyzeSentiment } from "@/lib/ai";

// GET /api/sentiment — aggregate sentiment analytics
export async function GET() {
    try {
        const data = await getSentimentAnalytics();
        return NextResponse.json(data);
    } catch {
        return NextResponse.json({ error: "Failed to fetch sentiment analytics" }, { status: 500 });
    }
}

// POST /api/sentiment — backfill sentiment for existing complaints (no sentiment_label yet)
export async function POST(request: NextRequest) {
    try {
        const body = await request.json().catch(() => ({}));
        const { id } = body; // optional: single complaint ID

        if (id) {
            // Backfill single complaint
            const complaints = await getAllComplaints();
            const complaint = complaints.find((c) => c.id === id);
            if (!complaint) {
                return NextResponse.json({ error: "Complaint not found" }, { status: 404 });
            }
            const sentiment = await analyzeSentiment(complaint.title, complaint.description);
            await updateComplaintSentiment(
                id,
                sentiment.label,
                sentiment.score,
                sentiment.emotionTags,
                sentiment.empathyNote
            );
            return NextResponse.json({ success: true, id, sentiment });
        }

        // Batch backfill: analyze complaints missing sentiment_label or with NEUTRAL default
        const complaints = await getAllComplaints();
        const toAnalyze = complaints.filter(
            (c) => !c.sentimentLabel || c.sentimentLabel === "NEUTRAL"
        ).slice(0, 20); // Process max 20 at a time to avoid rate limits

        const results = await Promise.allSettled(
            toAnalyze.map(async (complaint) => {
                const sentiment = await analyzeSentiment(complaint.title, complaint.description);
                await updateComplaintSentiment(
                    complaint.id,
                    sentiment.label,
                    sentiment.score,
                    sentiment.emotionTags,
                    sentiment.empathyNote
                );
                return { id: complaint.id, sentiment };
            })
        );

        const succeeded = results.filter((r) => r.status === "fulfilled").length;
        const failed = results.filter((r) => r.status === "rejected").length;

        return NextResponse.json({
            success: true,
            processed: toAnalyze.length,
            succeeded,
            failed,
        });
    } catch {
        return NextResponse.json({ error: "Backfill failed" }, { status: 500 });
    }
}
