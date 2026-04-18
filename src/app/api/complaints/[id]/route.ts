import { NextRequest, NextResponse } from "next/server";
import { getComplaintById, updateComplaint, upvoteComplaint, getStatusUpdates, createStatusUpdate, getFeedback, createFeedback } from "@/lib/db";
import { sendResolutionEmail } from "@/lib/mail";
import { isTelegramUser, notifyTelegramStatusUpdate } from "@/lib/telegram";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const complaint = await getComplaintById(id);

    if (!complaint) {
        return NextResponse.json({ error: "Complaint not found" }, { status: 404 });
    }

    const updates = await getStatusUpdates(id);
    const feedback = await getFeedback(id);

    return NextResponse.json({ complaint, updates, feedback });
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const body = await request.json();

    const complaint = await getComplaintById(id);
    if (!complaint) {
        return NextResponse.json({ error: "Complaint not found" }, { status: 404 });
    }

    // Handle upvote
    if (body.action === "upvote") {
        const updated = await upvoteComplaint(id, body.userId || "user-demo");
        return NextResponse.json(updated);
    }

    // Handle status update
    if (body.status && body.status !== complaint.status) {
        await createStatusUpdate({
            complaintId: id,
            updatedBy: body.updatedBy || "admin",
            updatedByName: body.updatedByName || "Admin",
            oldStatus: complaint.status,
            newStatus: body.status,
            comment: body.comment || `Status changed to ${body.status}`,
            createdAt: new Date().toISOString(),
        });

        const updates: any = { status: body.status };
        if (body.status === "RESOLVED") {
            updates.resolvedAt = new Date().toISOString();
            // Trigger email notification for web users
            if (complaint.userName && complaint.userName.includes("@")) {
                await sendResolutionEmail(complaint.userName, id, complaint.title);
            }
        }

        // Notify Telegram users on every status change
        if (complaint.userId && isTelegramUser(complaint.userId)) {
            await notifyTelegramStatusUpdate({
                chatId: complaint.userId,
                complaintId: id,
                complaintTitle: complaint.title,
                oldStatus: complaint.status,
                newStatus: body.status,
                comment: body.comment,
                updatedByName: body.updatedByName || "Admin",
            });
        }

        const updated = await updateComplaint(id, updates);
        return NextResponse.json(updated);
    }

    // Handle feedback
    if (body.rating) {
        const feedback = await createFeedback({
            complaintId: id,
            userId: body.userId || "user-demo",
            rating: body.rating,
            comment: body.feedbackComment || "",
            createdAt: new Date().toISOString(),
        });
        return NextResponse.json(feedback);
    }

    const updated = await updateComplaint(id, body);
    return NextResponse.json(updated);
}
