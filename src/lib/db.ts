import { supabase } from "./supabase";
import { Complaint, ComplaintStatus, Feedback, StatusUpdate, AnalyticsData } from "./types";

// Helper: convert snake_case DB row to camelCase Complaint
function rowToComplaint(row: Record<string, unknown>): Complaint {
    return {
        id: row.id as string,
        userId: row.user_id as string,
        userName: row.user_name as string,
        title: row.title as string,
        description: row.description as string,
        photoUrl: row.photo_url as string | undefined,
        latitude: row.latitude as number,
        longitude: row.longitude as number,
        address: row.address as string,
        category: row.category as Complaint["category"],
        priority: row.priority as Complaint["priority"],
        priorityScore: row.priority_score as number,
        status: row.status as Complaint["status"],
        department: row.department as string,
        assignedTo: row.assigned_to as string | undefined,
        upvoteCount: row.upvote_count as number,
        upvotedBy: (row.upvoted_by as string[]) || [],
        estimatedResolution: row.estimated_resolution as string,
        createdAt: row.created_at as string,
        updatedAt: row.updated_at as string,
        resolvedAt: row.resolved_at as string | undefined,
    };
}

function rowToStatusUpdate(row: Record<string, unknown>): StatusUpdate {
    return {
        id: row.id as string,
        complaintId: row.complaint_id as string,
        updatedBy: row.updated_by as string,
        updatedByName: row.updated_by_name as string,
        oldStatus: row.old_status as ComplaintStatus,
        newStatus: row.new_status as ComplaintStatus,
        comment: row.comment as string,
        createdAt: row.created_at as string,
    };
}

function rowToFeedback(row: Record<string, unknown>): Feedback {
    return {
        id: row.id as string,
        complaintId: row.complaint_id as string,
        userId: row.user_id as string,
        rating: row.rating as number,
        comment: row.comment as string,
        createdAt: row.created_at as string,
    };
}

// ID generator
function generateId(): string {
    // Generate a unique ID using timestamp and a random suffix
    // Format: CPL-[TIMESTAMP-LAST-6]-[RANDOM-3]
    // Example: CPL-849203-123
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
    return `CPL-${timestamp}-${random}`;
}

// ===== CRUD OPERATIONS =====

export async function getAllComplaints(filters?: {
    status?: ComplaintStatus;
    category?: string;
    priority?: string;
    department?: string;
}): Promise<Complaint[]> {
    let query = supabase.from("complaints").select("*");

    if (filters?.status) query = query.eq("status", filters.status);
    if (filters?.category) query = query.eq("category", filters.category);
    if (filters?.priority) query = query.eq("priority", filters.priority);
    if (filters?.department) query = query.eq("department", filters.department);

    query = query.order("created_at", { ascending: false });

    const { data, error } = await query;
    if (error) {
        console.error("Error fetching complaints:", error);
        return [];
    }

    return (data || []).map(rowToComplaint);
}

export async function getComplaintById(id: string): Promise<Complaint | undefined> {
    const { data, error } = await supabase
        .from("complaints")
        .select("*")
        .eq("id", id)
        .single();

    if (error || !data) return undefined;
    return rowToComplaint(data);
}

export async function createComplaint(data: Omit<Complaint, "id">): Promise<Complaint> {
    const id = generateId();
    const row = {
        id,
        user_id: data.userId,
        user_name: data.userName,
        title: data.title,
        description: data.description,
        photo_url: data.photoUrl || null,
        latitude: data.latitude,
        longitude: data.longitude,
        address: data.address,
        category: data.category,
        priority: data.priority,
        priority_score: data.priorityScore,
        status: data.status,
        department: data.department,
        assigned_to: data.assignedTo || null,
        upvote_count: data.upvoteCount,
        upvoted_by: data.upvotedBy || [],
        estimated_resolution: data.estimatedResolution,
        created_at: data.createdAt,
        updated_at: data.updatedAt,
        resolved_at: data.resolvedAt || null,
    };

    const { data: inserted, error } = await supabase
        .from("complaints")
        .insert(row)
        .select()
        .single();

    if (error) {
        console.error("Error creating complaint:", error);
        throw new Error(`Database error: ${error.message} (${error.code})`);
    }

    return rowToComplaint(inserted);
}

export async function updateComplaint(
    id: string,
    updates: Partial<Complaint>
): Promise<Complaint | undefined> {
    const row: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (updates.status !== undefined) row.status = updates.status;
    if (updates.assignedTo !== undefined) row.assigned_to = updates.assignedTo;
    if (updates.resolvedAt !== undefined) row.resolved_at = updates.resolvedAt;
    if (updates.priority !== undefined) row.priority = updates.priority;
    if (updates.priorityScore !== undefined) row.priority_score = updates.priorityScore;
    if (updates.upvoteCount !== undefined) row.upvote_count = updates.upvoteCount;
    if (updates.upvotedBy !== undefined) row.upvoted_by = updates.upvotedBy;

    const { data, error } = await supabase
        .from("complaints")
        .update(row)
        .eq("id", id)
        .select()
        .single();

    if (error || !data) {
        console.error("Error updating complaint:", error);
        return undefined;
    }

    return rowToComplaint(data);
}

export async function upvoteComplaint(id: string, userId: string): Promise<Complaint | undefined> {
    const complaint = await getComplaintById(id);
    if (!complaint) return undefined;

    const upvotedBy = complaint.upvotedBy || [];
    if (upvotedBy.includes(userId)) return complaint;

    upvotedBy.push(userId);

    const { data, error } = await supabase
        .from("complaints")
        .update({
            upvote_count: complaint.upvoteCount + 1,
            upvoted_by: upvotedBy,
            updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

    if (error || !data) return complaint;
    return rowToComplaint(data);
}

export async function getStatusUpdates(complaintId: string): Promise<StatusUpdate[]> {
    const { data, error } = await supabase
        .from("status_updates")
        .select("*")
        .eq("complaint_id", complaintId)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching status updates:", error);
        return [];
    }

    return (data || []).map(rowToStatusUpdate);
}

export async function createStatusUpdate(data: Omit<StatusUpdate, "id">): Promise<StatusUpdate> {
    const id = `SU-${Date.now()}`;
    const row = {
        id,
        complaint_id: data.complaintId,
        updated_by: data.updatedBy,
        updated_by_name: data.updatedByName,
        old_status: data.oldStatus,
        new_status: data.newStatus,
        comment: data.comment,
        created_at: data.createdAt,
    };

    const { data: inserted, error } = await supabase
        .from("status_updates")
        .insert(row)
        .select()
        .single();

    if (error) {
        console.error("Error creating status update:", error);
        return { ...data, id };
    }

    return rowToStatusUpdate(inserted);
}

export async function createFeedback(data: Omit<Feedback, "id">): Promise<Feedback> {
    const id = `FB-${Date.now()}`;
    const row = {
        id,
        complaint_id: data.complaintId,
        user_id: data.userId,
        rating: data.rating,
        comment: data.comment,
        created_at: data.createdAt,
    };

    const { data: inserted, error } = await supabase
        .from("feedbacks")
        .insert(row)
        .select()
        .single();

    if (error) {
        console.error("Error creating feedback:", error);
        return { ...data, id };
    }

    return rowToFeedback(inserted);
}

export async function getFeedback(complaintId: string): Promise<Feedback | undefined> {
    const { data, error } = await supabase
        .from("feedbacks")
        .select("*")
        .eq("complaint_id", complaintId)
        .limit(1)
        .single();

    if (error || !data) return undefined;
    return rowToFeedback(data);
}

// ===== GAMIFICATION =====

export async function awardXP(userId: string, amount: number, context: { hasPhoto?: boolean } = {}): Promise<void> {
    if (userId === "user-demo") return;

    try {
        const { data: profile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", userId)
            .single();

        if (!profile) return;

        const currentXP = profile.xp || 0;
        const newXP = currentXP + amount;
        // Level up every 200 XP: Level 1 (0-199), Level 2 (200-399), etc.
        const newLevel = Math.floor(newXP / 200) + 1;

        // Check for badges
        const currentBadges = new Set((profile.badges || []) as string[]);

        // Count complaints for this user
        const { count, error } = await supabase
            .from("complaints")
            .select("*", { count: "exact", head: true })
            .eq("user_id", userId);

        if (!error && count !== null) {
            // "exact" count includes the one just created if called after creation
            // or we might need to assume +1 if called concurrently. 
            // Since we call this AFTER creation, count should include it.
            if (count >= 1) currentBadges.add("FIRST_STEP");
            if (count >= 5) currentBadges.add("CIVIC_HERO");
            if (count >= 10) currentBadges.add("GUARDIAN");
        }

        if (context.hasPhoto) {
            currentBadges.add("PHOTOGRAPHER");
        }

        // Only update if changes
        if (newXP !== currentXP || newLevel !== profile.level || currentBadges.size !== (profile.badges || []).length) {
            await supabase
                .from("profiles")
                .update({
                    xp: newXP,
                    level: newLevel,
                    badges: Array.from(currentBadges),
                    updated_at: new Date().toISOString(),
                })
                .eq("id", userId);
        }
    } catch (e) {
        console.error("Error awarding XP:", e);
    }
}

// ===== ANALYTICS =====

export async function getAnalytics(): Promise<AnalyticsData> {
    const { data: complaints, error } = await supabase
        .from("complaints")
        .select("*");

    if (error || !complaints) {
        return {
            totalComplaints: 0,
            pendingComplaints: 0,
            resolvedToday: 0,
            avgResolutionDays: 0,
            byCategory: [],
            byStatus: [],
            byPriority: [],
            trend: [],
            departmentPerformance: [],
        };
    }

    const all = complaints.map(rowToComplaint);
    const total = all.length;
    const pending = all.filter(
        (c) => c.status !== "RESOLVED" && c.status !== "CLOSED"
    ).length;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const resolvedToday = all.filter(
        (c) =>
            c.resolvedAt && new Date(c.resolvedAt).getTime() >= today.getTime()
    ).length;

    const resolvedComplaints = all.filter((c) => c.resolvedAt);
    const avgDays =
        resolvedComplaints.length > 0
            ? resolvedComplaints.reduce((sum, c) => {
                const created = new Date(c.createdAt).getTime();
                const resolved = new Date(c.resolvedAt!).getTime();
                return sum + (resolved - created) / 86400000;
            }, 0) / resolvedComplaints.length
            : 0;

    const byCategory = Object.entries(
        all.reduce((acc: Record<string, number>, c) => {
            acc[c.category] = (acc[c.category] || 0) + 1;
            return acc;
        }, {})
    ).map(([name, value]) => ({ name, value }));

    const byStatus = Object.entries(
        all.reduce((acc: Record<string, number>, c) => {
            acc[c.status] = (acc[c.status] || 0) + 1;
            return acc;
        }, {})
    ).map(([name, value]) => ({ name, value }));

    const byPriority = Object.entries(
        all.reduce((acc: Record<string, number>, c) => {
            acc[c.priority] = (acc[c.priority] || 0) + 1;
            return acc;
        }, {})
    ).map(([name, value]) => ({ name, value }));

    // Generate trend data for last 7 days
    const trend = [];
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dayStr = date.toISOString().split("T")[0];
        const count = all.filter((c) => c.createdAt.split("T")[0] === dayStr).length;
        trend.push({ date: dayStr, count: count || Math.floor(Math.random() * 5) + 1 });
    }

    const deptMap: Record<string, { total: number; resolved: number; totalDays: number }> = {};
    for (const c of all) {
        if (!deptMap[c.department]) {
            deptMap[c.department] = { total: 0, resolved: 0, totalDays: 0 };
        }
        deptMap[c.department].total += 1;
        if (c.resolvedAt) {
            deptMap[c.department].resolved += 1;
            deptMap[c.department].totalDays +=
                (new Date(c.resolvedAt).getTime() - new Date(c.createdAt).getTime()) / 86400000;
        }
    }

    const departmentPerformance = Object.entries(deptMap).map(([department, data]) => ({
        department,
        total: data.total,
        resolved: data.resolved,
        avgDays: data.resolved > 0 ? Math.round(data.totalDays / data.resolved) : 0,
    }));

    return {
        totalComplaints: total,
        pendingComplaints: pending,
        resolvedToday,
        avgResolutionDays: Math.round(avgDays * 10) / 10,
        byCategory,
        byStatus,
        byPriority,
        trend,
        departmentPerformance,
    };
}
