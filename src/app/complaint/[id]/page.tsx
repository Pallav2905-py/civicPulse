"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
    CATEGORY_LABELS,
    CATEGORY_ICONS,
    SENTIMENT_CONFIG,
    type Complaint,
    type StatusUpdate,
    type Feedback,
} from "@/lib/types";

export default function ComplaintDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = use(params);
    const router = useRouter();
    const [complaint, setComplaint] = useState<Complaint | null>(null);
    const [updates, setUpdates] = useState<StatusUpdate[]>([]);
    const [feedback, setFeedback] = useState<Feedback | null>(null);
    const [loading, setLoading] = useState(true);
    const [backfilling, setBackfilling] = useState(false);

    // Feedback form state
    const [showFeedback, setShowFeedback] = useState(false);
    const [rating, setRating] = useState(0);
    const [feedbackComment, setFeedbackComment] = useState("");
    const [submittingFeedback, setSubmittingFeedback] = useState(false);

    useEffect(() => {
        fetch(`/api/complaints/${id}`)
            .then((res) => res.json())
            .then((data) => {
                setComplaint(data.complaint);
                setUpdates(data.updates || []);
                setFeedback(data.feedback || null);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [id]);

    const submitFeedback = async () => {
        if (!rating) return;
        setSubmittingFeedback(true);
        try {
            await fetch(`/api/complaints/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ rating, feedbackComment }),
            });
            setFeedback({
                id: "new",
                complaintId: id,
                userId: "user-demo",
                rating,
                comment: feedbackComment,
                createdAt: new Date().toISOString(),
            });
            setShowFeedback(false);
        } catch {
            alert("Failed to submit feedback");
        } finally {
            setSubmittingFeedback(false);
        }
    };

    const handleBackfillSentiment = async () => {
        setBackfilling(true);
        try {
            const res = await fetch("/api/sentiment", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id }),
            });
            const data = await res.json();
            if (data.success && complaint) {
                setComplaint({
                    ...complaint,
                    sentimentLabel: data.sentiment.label,
                    sentimentScore: data.sentiment.score,
                    emotionTags: data.sentiment.emotionTags,
                    empathyNote: data.sentiment.empathyNote,
                });
            }
        } catch {
            alert("Failed to analyze sentiment");
        } finally {
            setBackfilling(false);
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const getTimeRemaining = (dateStr: string) => {
        const diff = new Date(dateStr).getTime() - Date.now();
        if (diff <= 0) return "Overdue";
        const hours = Math.floor(diff / 3600000);
        if (hours < 24) return `${hours} hours`;
        return `${Math.floor(hours / 24)} days`;
    };

    if (loading) {
        return (
            <div className="page-container">
                <div className="loading-spinner">
                    <div className="spinner" />
                </div>
            </div>
        );
    }

    if (!complaint) {
        return (
            <div className="page-container" style={{ textAlign: "center", paddingTop: "8rem" }}>
                <p style={{ fontSize: "3rem" }}>🔍</p>
                <h2>Complaint not found</h2>
                <p style={{ color: "var(--text-secondary)", margin: "1rem 0" }}>
                    The complaint ID &quot;{id}&quot; does not exist.
                </p>
                <button className="btn btn-primary" onClick={() => router.push("/dashboard")}>
                    ← Back to Dashboard
                </button>
            </div>
        );
    }

    const sentimentCfg = complaint.sentimentLabel ? SENTIMENT_CONFIG[complaint.sentimentLabel] : null;

    return (
        <div className="page-container">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
            >
                {/* Back button */}
                <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => router.back()}
                    style={{ marginBottom: "1.5rem" }}
                >
                    ← Back
                </button>

                <div className="detail-grid">
                    {/* Main content */}
                    <div>
                        {/* Header */}
                        <div className="card" style={{ marginBottom: "1rem" }}>
                            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", marginBottom: "1rem" }}>
                                <h1 style={{ fontSize: "1.4rem", fontWeight: 700, lineHeight: 1.3, display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                                    {CATEGORY_ICONS[complaint.category]} {complaint.title}
                                    {sentimentCfg && (
                                        <span
                                            title={`Sentiment: ${complaint.sentimentLabel}`}
                                            style={{ fontSize: "1.2rem", cursor: "default" }}
                                        >
                                            {sentimentCfg.emoji}
                                        </span>
                                    )}
                                </h1>
                                <span style={{ color: "var(--text-muted)", fontSize: "0.85rem", whiteSpace: "nowrap" }}>
                                    {complaint.id}
                                </span>
                            </div>

                            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1.25rem" }}>
                                <span className={`badge badge-${complaint.priority.toLowerCase()}`}>
                                    {complaint.priority} Priority
                                </span>
                                <span className={`badge badge-${complaint.status.toLowerCase()}`}>
                                    {complaint.status === "IN_PROGRESS" ? "In Progress" : complaint.status.charAt(0) + complaint.status.slice(1).toLowerCase()}
                                </span>
                                <span className="badge badge-category">
                                    {CATEGORY_LABELS[complaint.category]}
                                </span>
                                {sentimentCfg && (
                                    <span
                                        className="badge"
                                        style={{
                                            background: sentimentCfg.bg,
                                            color: sentimentCfg.color,
                                            border: `1px solid ${sentimentCfg.border}`,
                                        }}
                                    >
                                        {sentimentCfg.emoji} {complaint.sentimentLabel}
                                    </span>
                                )}
                            </div>

                            <p style={{ color: "var(--text-secondary)", lineHeight: 1.7 }}>
                                {complaint.description}
                            </p>

                            {complaint.photoUrl && (
                                <div style={{ marginTop: "1.25rem", borderRadius: "12px", overflow: "hidden", border: "1px solid var(--border)" }}>
                                    <img
                                        src={complaint.photoUrl}
                                        alt="Complaint photo"
                                        style={{ width: "100%", maxHeight: "400px", objectFit: "cover", display: "block" }}
                                    />
                                    <div style={{ padding: "0.5rem 0.75rem", background: "rgba(139, 92, 246, 0.08)", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                                        📷 Attached photograph
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Status Timeline */}
                        <div className="card" style={{ marginBottom: "1rem" }}>
                            <h3 style={{ marginBottom: "1rem", fontSize: "1rem" }}>📋 Status Timeline</h3>

                            <div className="timeline">
                                {/* Current status */}
                                <div className="timeline-item">
                                    <div className="time">Current</div>
                                    <div className="content" style={{ fontWeight: 600 }}>
                                        <span className={`badge badge-${complaint.status.toLowerCase()}`}>
                                            {complaint.status === "IN_PROGRESS" ? "In Progress" : complaint.status}
                                        </span>
                                    </div>
                                </div>

                                {updates.map((update) => (
                                    <div key={update.id} className="timeline-item">
                                        <div className="time">{formatDate(update.createdAt)}</div>
                                        <div className="content">
                                            {update.oldStatus} → <strong>{update.newStatus}</strong>
                                        </div>
                                        <div className="author">
                                            {update.updatedByName}: {update.comment}
                                        </div>
                                    </div>
                                ))}

                                {/* Submitted */}
                                <div className="timeline-item">
                                    <div className="time">{formatDate(complaint.createdAt)}</div>
                                    <div className="content">Complaint submitted by {complaint.userName}</div>
                                </div>
                            </div>
                        </div>

                        {/* Feedback Section */}
                        <div className="card">
                            <h3 style={{ marginBottom: "1rem", fontSize: "1rem" }}>⭐ Feedback</h3>

                            {feedback ? (
                                <div>
                                    <div className="stars" style={{ marginBottom: "0.5rem" }}>
                                        {[1, 2, 3, 4, 5].map((s) => (
                                            <span key={s} className={`star ${s <= feedback.rating ? "active" : ""}`}>
                                                ★
                                            </span>
                                        ))}
                                    </div>
                                    <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                                        {feedback.comment}
                                    </p>
                                    <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginTop: "0.5rem" }}>
                                        Submitted on {formatDate(feedback.createdAt)}
                                    </p>
                                </div>
                            ) : complaint.status === "RESOLVED" || complaint.status === "CLOSED" ? (
                                showFeedback ? (
                                    <div>
                                        <p style={{ color: "var(--text-secondary)", marginBottom: "0.75rem", fontSize: "0.9rem" }}>
                                            How satisfied are you with the resolution?
                                        </p>
                                        <div className="stars" style={{ marginBottom: "1rem" }}>
                                            {[1, 2, 3, 4, 5].map((s) => (
                                                <span
                                                    key={s}
                                                    className={`star ${s <= rating ? "active" : ""}`}
                                                    onClick={() => setRating(s)}
                                                >
                                                    ★
                                                </span>
                                            ))}
                                        </div>
                                        <textarea
                                            className="form-textarea"
                                            placeholder="Share your experience (optional)"
                                            value={feedbackComment}
                                            onChange={(e) => setFeedbackComment(e.target.value)}
                                            rows={3}
                                            style={{ marginBottom: "0.75rem" }}
                                        />
                                        <div style={{ display: "flex", gap: "0.5rem" }}>
                                            <button
                                                className="btn btn-primary btn-sm"
                                                onClick={submitFeedback}
                                                disabled={!rating || submittingFeedback}
                                            >
                                                {submittingFeedback ? "Submitting..." : "Submit Feedback"}
                                            </button>
                                            <button
                                                className="btn btn-secondary btn-sm"
                                                onClick={() => setShowFeedback(false)}
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <button
                                        className="btn btn-primary btn-sm"
                                        onClick={() => setShowFeedback(true)}
                                    >
                                        ⭐ Rate Resolution
                                    </button>
                                )
                            ) : (
                                <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
                                    Feedback is available once the complaint is resolved.
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="detail-sidebar">
                        {/* Quick Info */}
                        <div className="card">
                            <h3 style={{ marginBottom: "1rem", fontSize: "1rem" }}>📌 Details</h3>

                            <div className="detail-field">
                                <label>Priority Score</label>
                                <div className="value" style={{ fontSize: "1.5rem", fontWeight: 800 }}>
                                    {complaint.priorityScore}/10
                                </div>
                            </div>

                            <div className="detail-field">
                                <label>Department</label>
                                <div className="value">{complaint.department}</div>
                            </div>

                            <div className="detail-field">
                                <label>Location</label>
                                <div className="value" style={{ fontSize: "0.9rem" }}>{complaint.address}</div>
                            </div>

                            <div className="detail-field">
                                <label>Reported By</label>
                                <div className="value">{complaint.userName}</div>
                            </div>

                            <div className="detail-field">
                                <label>Reported On</label>
                                <div className="value" style={{ fontSize: "0.9rem" }}>
                                    {formatDate(complaint.createdAt)}
                                </div>
                            </div>

                            <div className="detail-field">
                                <label>Community Upvotes</label>
                                <div className="value">▲ {complaint.upvoteCount}</div>
                            </div>
                        </div>

                        {/* ETA */}
                        <div className="card" style={{ background: "rgba(139, 92, 246, 0.08)", borderColor: "rgba(139, 92, 246, 0.25)" }}>
                            <h3 style={{ marginBottom: "0.5rem", fontSize: "1rem" }}>⏱️ Estimated Resolution</h3>
                            {complaint.resolvedAt ? (
                                <div>
                                    <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--accent-green)" }}>
                                        ✅ Resolved
                                    </div>
                                    <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
                                        {formatDate(complaint.resolvedAt)}
                                    </p>
                                </div>
                            ) : (
                                <div>
                                    <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "#a78bfa" }}>
                                        {getTimeRemaining(complaint.estimatedResolution)}
                                    </div>
                                    <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
                                        Target: {formatDate(complaint.estimatedResolution)}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Sentiment Card */}
                        <div
                            className="card"
                            style={sentimentCfg ? {
                                background: sentimentCfg.bg,
                                borderColor: sentimentCfg.border,
                            } : {}}
                        >
                            <h3 style={{ marginBottom: "0.75rem", fontSize: "1rem" }}>💬 Sentiment Analysis</h3>

                            {sentimentCfg && complaint.sentimentLabel ? (
                                <div>
                                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
                                        <span style={{ fontSize: "2rem" }}>{sentimentCfg.emoji}</span>
                                        <div>
                                            <div style={{ fontWeight: 700, color: sentimentCfg.color, fontSize: "1rem" }}>
                                                {complaint.sentimentLabel}
                                            </div>
                                            <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                                                {sentimentCfg.description}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Score bar */}
                                    {complaint.sentimentScore !== undefined && (
                                        <div style={{ marginBottom: "0.75rem" }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: "0.3rem" }}>
                                                <span>Confidence</span>
                                                <span>{Math.round(complaint.sentimentScore * 100)}%</span>
                                            </div>
                                            <div className="sentiment-bar">
                                                <div
                                                    className="sentiment-bar-fill"
                                                    style={{
                                                        width: `${Math.round(complaint.sentimentScore * 100)}%`,
                                                        background: sentimentCfg.color,
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Emotion tags */}
                                    {complaint.emotionTags && complaint.emotionTags.length > 0 && (
                                        <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap", marginBottom: "0.75rem" }}>
                                            {complaint.emotionTags.map((tag) => (
                                                <span
                                                    key={tag}
                                                    className="emotion-tag"
                                                    style={{ borderColor: sentimentCfg.border, color: sentimentCfg.color }}
                                                >
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    {/* Empathy note */}
                                    {complaint.empathyNote && (
                                        <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", fontStyle: "italic", borderTop: `1px solid ${sentimentCfg.border}`, paddingTop: "0.6rem", margin: 0 }}>
                                            💬 {complaint.empathyNote}
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <div>
                                    <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "0.75rem" }}>
                                        Sentiment not yet analyzed for this complaint.
                                    </p>
                                    <button
                                        className="btn btn-secondary btn-sm"
                                        onClick={handleBackfillSentiment}
                                        disabled={backfilling}
                                        style={{ width: "100%", justifyContent: "center" }}
                                    >
                                        {backfilling ? (
                                            <><span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Analyzing...</>
                                        ) : (
                                            "🧠 Analyze Sentiment"
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
