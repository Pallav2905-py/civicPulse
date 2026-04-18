"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { CATEGORY_LABELS, CATEGORY_ICONS, type Complaint } from "@/lib/types";
import { GamificationCard } from "@/components/GamificationCard";

export default function DashboardPage() {
    const [complaints, setComplaints] = useState<Complaint[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<string>("ALL");
    const [categoryFilter, setCategoryFilter] = useState<string>("ALL");

    useEffect(() => {
        fetch("/api/complaints")
            .then((res) => res.json())
            .then((data) => {
                setComplaints(data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    const handleUpvote = async (id: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        try {
            const res = await fetch(`/api/complaints/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "upvote", userId: "user-demo" }),
            });
            const updated = await res.json();
            setComplaints((prev) =>
                prev.map((c) => (c.id === id ? { ...c, upvoteCount: updated.upvoteCount } : c))
            );
        } catch {
            // ignore
        }
    };

    const filtered = complaints.filter((c) => {
        if (statusFilter !== "ALL" && c.status !== statusFilter) return false;
        if (categoryFilter !== "ALL" && c.category !== categoryFilter) return false;
        return true;
    });

    const [now, setNow] = useState(Date.now());

    useEffect(() => {
        // Update time every minute to keep "time ago" fresh
        const interval = setInterval(() => setNow(Date.now()), 60000);
        return () => clearInterval(interval);
    }, []);

    const timeAgo = (dateStr: string) => {
        const diff = now - new Date(dateStr).getTime();
        const hours = Math.floor(diff / 3600000);
        if (hours < 1) return "Just now";
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
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

    return (
        <div className="page-container">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
            >
                <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", marginBottom: "1.5rem" }}>
                    <div>
                        <h1>📊 Citizen Dashboard</h1>
                        <p>{complaints.length} total complaints tracked</p>
                    </div>
                    <Link href="/submit" className="btn btn-primary">
                        + Report New Issue
                    </Link>
                </div>

                <div style={{ marginBottom: "2rem" }}>
                    <GamificationCard />
                </div>

                {/* Status Filters */}
                <div className="filters-bar">
                    {["ALL", "SUBMITTED", "ASSIGNED", "IN_PROGRESS", "RESOLVED", "CLOSED"].map((s) => (
                        <button
                            key={s}
                            className={`filter-chip ${statusFilter === s ? "active" : ""}`}
                            onClick={() => setStatusFilter(s)}
                        >
                            {s === "ALL" ? "All" : s === "IN_PROGRESS" ? "In Progress" : s.charAt(0) + s.slice(1).toLowerCase()}
                        </button>
                    ))}
                </div>

                {/* Category Filters */}
                <div className="filters-bar" style={{ marginTop: "-0.5rem" }}>
                    <button
                        className={`filter-chip ${categoryFilter === "ALL" ? "active" : ""}`}
                        onClick={() => setCategoryFilter("ALL")}
                    >
                        All Categories
                    </button>
                    {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                        <button
                            key={key}
                            className={`filter-chip ${categoryFilter === key ? "active" : ""}`}
                            onClick={() => setCategoryFilter(key)}
                        >
                            {CATEGORY_ICONS[key as keyof typeof CATEGORY_ICONS]} {label}
                        </button>
                    ))}
                </div>

                {/* Complaints Grid */}
                {filtered.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "4rem 2rem" }}>
                        <p style={{ fontSize: "3rem", marginBottom: "1rem" }}>📭</p>
                        <p style={{ color: "var(--text-secondary)" }}>No complaints found matching your filters.</p>
                    </div>
                ) : (
                    <div className="card-grid">
                        {filtered.map((complaint, i) => (
                            <motion.div
                                key={complaint.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: i * 0.05 }}
                            >
                                <Link
                                    href={`/complaint/${complaint.id}`}
                                    className="complaint-card"
                                >
                                    <div className="complaint-card-header">
                                        <h3>
                                            {CATEGORY_ICONS[complaint.category]} {complaint.title}
                                        </h3>
                                        <span className={`badge badge-${complaint.priority.toLowerCase()}`}>
                                            {complaint.priority}
                                        </span>
                                    </div>

                                    <p className="complaint-card-body">{complaint.description}</p>

                                    <div className="complaint-card-footer">
                                        <div className="complaint-meta">
                                            <span className={`badge badge-${complaint.status.toLowerCase()}`}>
                                                {complaint.status === "IN_PROGRESS" ? "In Progress" : complaint.status.charAt(0) + complaint.status.slice(1).toLowerCase()}
                                            </span>
                                            <span className="badge badge-category">
                                                {CATEGORY_LABELS[complaint.category]}
                                            </span>
                                            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                                                {timeAgo(complaint.createdAt)}
                                            </span>
                                        </div>

                                        <button
                                            className="upvote-btn"
                                            onClick={(e) => handleUpvote(complaint.id, e)}
                                        >
                                            ▲ {complaint.upvoteCount}
                                        </button>
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                )}
            </motion.div>
        </div>
    );
}
