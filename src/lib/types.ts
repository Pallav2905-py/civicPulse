export type ComplaintCategory =
    | "POTHOLE"
    | "STREETLIGHT"
    | "WATER_LEAK"
    | "GARBAGE"
    | "DRAINAGE"
    | "ROAD_DAMAGE"
    | "ILLEGAL_CONSTRUCTION"
    | "NOISE_POLLUTION"
    | "OTHER";

export type PriorityLevel = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

export type ComplaintStatus =
    | "SUBMITTED"
    | "ASSIGNED"
    | "IN_PROGRESS"
    | "RESOLVED"
    | "CLOSED";

export type UserRole = "citizen" | "admin" | "dept_officer";

// ===== SENTIMENT TYPES =====
export type SentimentLabel = "POSITIVE" | "NEUTRAL" | "FRUSTRATED" | "DISTRESSED" | "ANGRY";

export interface SentimentResult {
    label: SentimentLabel;
    score: number;           // 0.0–1.0 confidence
    emotionTags: string[];   // e.g. ["worried", "exhausted", "hopeful"]
    empathyNote: string;     // AI-generated one-line empathy suggestion for officer
}

export const SENTIMENT_CONFIG: Record<SentimentLabel, {
    emoji: string;
    color: string;
    bg: string;
    border: string;
    description: string;
}> = {
    POSITIVE: {
        emoji: "😊",
        color: "#10b981",
        bg: "rgba(16, 185, 129, 0.12)",
        border: "rgba(16, 185, 129, 0.35)",
        description: "Citizen is cooperative and hopeful",
    },
    NEUTRAL: {
        emoji: "😐",
        color: "#94a3b8",
        bg: "rgba(148, 163, 184, 0.12)",
        border: "rgba(148, 163, 184, 0.35)",
        description: "Citizen is matter-of-fact and calm",
    },
    FRUSTRATED: {
        emoji: "😤",
        color: "#f97316",
        bg: "rgba(249, 115, 22, 0.12)",
        border: "rgba(249, 115, 22, 0.35)",
        description: "Citizen shows irritation — respond promptly",
    },
    DISTRESSED: {
        emoji: "😰",
        color: "#8b5cf6",
        bg: "rgba(139, 92, 246, 0.12)",
        border: "rgba(139, 92, 246, 0.35)",
        description: "Citizen is anxious or distressed — prioritize empathy",
    },
    ANGRY: {
        emoji: "😡",
        color: "#ef4444",
        bg: "rgba(239, 68, 68, 0.12)",
        border: "rgba(239, 68, 68, 0.35)",
        description: "Citizen is very upset — escalate with care",
    },
};

export interface User {
    id: string;
    name: string;
    email: string;
    phone?: string;
    role: UserRole;
    department?: string;
    avatar?: string;
    createdAt: string;
}

export interface Complaint {
    id: string;
    userId: string;
    userName: string;
    title: string;
    description: string;
    photoUrl?: string;
    latitude: number;
    longitude: number;
    address: string;
    category: ComplaintCategory;
    priority: PriorityLevel;
    priorityScore: number;
    status: ComplaintStatus;
    department: string;
    assignedTo?: string;
    upvoteCount: number;
    upvotedBy: string[];
    estimatedResolution: string;
    createdAt: string;
    updatedAt: string;
    resolvedAt?: string;
    // Sentiment fields
    sentimentLabel?: SentimentLabel;
    sentimentScore?: number;
    emotionTags?: string[];
    empathyNote?: string;
}

export interface StatusUpdate {
    id: string;
    complaintId: string;
    updatedBy: string;
    updatedByName: string;
    oldStatus: ComplaintStatus;
    newStatus: ComplaintStatus;
    comment: string;
    createdAt: string;
}

export interface Feedback {
    id: string;
    complaintId: string;
    userId: string;
    rating: number;
    comment: string;
    createdAt: string;
}

export interface ClassificationResult {
    category: ComplaintCategory;
    confidence: number;
    urgencyLevel: PriorityLevel;
    affectedAreaSize: "SMALL" | "MEDIUM" | "LARGE";
    estimatedPeopleAffected: number;
    summary: string;
}

export interface SentimentAnalyticsData {
    totalAnalyzed: number;
    distribution: { label: SentimentLabel; count: number; percentage: number }[];
    trend: { date: string; POSITIVE: number; NEUTRAL: number; FRUSTRATED: number; DISTRESSED: number; ANGRY: number }[];
    topDistressed: Complaint[];
    avgScore: number;
    dominantEmotion: SentimentLabel;
}

export interface AnalyticsData {
    totalComplaints: number;
    pendingComplaints: number;
    resolvedToday: number;
    avgResolutionDays: number;
    byCategory: { name: string; value: number }[];
    byStatus: { name: string; value: number }[];
    byPriority: { name: string; value: number }[];
    trend: { date: string; count: number }[];
    departmentPerformance: {
        department: string;
        total: number;
        resolved: number;
        avgDays: number;
    }[];
}

export interface Profile {
    id: string;
    full_name: string;
    avatar_url?: string;
    xp: number;
    level: number;
    badges: string[];
    created_at: string;
}

export const BADGES: Record<string, { label: string; icon: string; description: string }> = {
    FIRST_STEP: { label: "First Step", icon: "🌱", description: "Reported your first civic issue" },
    CIVIC_HERO: { label: "Civic Hero", icon: "🦸", description: "Reported 5 civic issues" },
    GUARDIAN: { label: "Guardian", icon: "🛡️", description: "Reported 10 civic issues" },
    PHOTOGRAPHER: { label: "Shutterbug", icon: "📸", description: "Uploaded a photo with a complaint" },
};


export const CATEGORY_LABELS: Record<ComplaintCategory, string> = {
    POTHOLE: "Pothole",
    STREETLIGHT: "Streetlight",
    WATER_LEAK: "Water Leak",
    GARBAGE: "Garbage",
    DRAINAGE: "Drainage",
    ROAD_DAMAGE: "Road Damage",
    ILLEGAL_CONSTRUCTION: "Illegal Construction",
    NOISE_POLLUTION: "Noise Pollution",
    OTHER: "Other",
};

export const CATEGORY_ICONS: Record<ComplaintCategory, string> = {
    POTHOLE: "🕳️",
    STREETLIGHT: "💡",
    WATER_LEAK: "💧",
    GARBAGE: "🗑️",
    DRAINAGE: "🌊",
    ROAD_DAMAGE: "🛣️",
    ILLEGAL_CONSTRUCTION: "🏗️",
    NOISE_POLLUTION: "📢",
    OTHER: "📋",
};

export const DEPARTMENT_MAP: Record<ComplaintCategory, string> = {
    POTHOLE: "Roads & Infrastructure",
    STREETLIGHT: "Electrical Department",
    WATER_LEAK: "Water Supply Department",
    GARBAGE: "Sanitation Department",
    DRAINAGE: "Drainage Department",
    ROAD_DAMAGE: "Roads & Infrastructure",
    ILLEGAL_CONSTRUCTION: "Building & Planning",
    NOISE_POLLUTION: "Local Police",
    OTHER: "General Administration",
};

export const PRIORITY_COLORS: Record<PriorityLevel, string> = {
    CRITICAL: "#ef4444",
    HIGH: "#f97316",
    MEDIUM: "#eab308",
    LOW: "#22c55e",
};

export const STATUS_COLORS: Record<ComplaintStatus, string> = {
    SUBMITTED: "#8b5cf6",
    ASSIGNED: "#3b82f6",
    IN_PROGRESS: "#f59e0b",
    RESOLVED: "#22c55e",
    CLOSED: "#6b7280",
};
