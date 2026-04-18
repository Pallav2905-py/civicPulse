"use client";

import { useEffect, useState } from "react";
import { Complaint, CATEGORY_ICONS, CATEGORY_LABELS } from "@/lib/types";

export default function MapPage() {
    const [complaints, setComplaints] = useState<Complaint[]>([]);
    const [MapComponent, setMapComponent] = useState<React.ComponentType<{ complaints: Complaint[] }> | null>(null);
    const [filter, setFilter] = useState<string>("ALL");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/complaints")
            .then((res) => res.json())
            .then((data) => {
                setComplaints(data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    // Dynamic import for Leaflet (requires window)
    useEffect(() => {
        import("@/components/LeafletMap").then((mod) => {
            setMapComponent(() => mod.default);
        });
    }, []);

    const filteredComplaints =
        filter === "ALL"
            ? complaints
            : complaints.filter((c) => c.category === filter);

    const categories = ["ALL", ...new Set(complaints.map((c) => c.category))];

    // Category stats
    const categoryStats = complaints.reduce((acc: Record<string, number>, c) => {
        acc[c.category] = (acc[c.category] || 0) + 1;
        return acc;
    }, {});

    const priorityStats = complaints.reduce((acc: Record<string, number>, c) => {
        acc[c.priority] = (acc[c.priority] || 0) + 1;
        return acc;
    }, {});

    return (
        <div className="page-container" style={{ paddingTop: "5.5rem" }}>
            <div className="page-header">
                <h1>🗺️ Complaint Hotspot Map</h1>
                <p>Visualize civic issues across the city in real-time</p>
            </div>

            {/* Filter Chips */}
            <div className="filters-bar">
                {categories.map((cat) => (
                    <button
                        key={cat}
                        className={`filter-chip ${filter === cat ? "active" : ""}`}
                        onClick={() => setFilter(cat)}
                    >
                        {cat === "ALL"
                            ? `📍 All (${complaints.length})`
                            : `${CATEGORY_ICONS[cat as keyof typeof CATEGORY_ICONS] || "📋"} ${CATEGORY_LABELS[cat as keyof typeof CATEGORY_LABELS] || cat} (${categoryStats[cat] || 0})`}
                    </button>
                ))}
            </div>

            {/* Map */}
            <div className="map-wrapper">
                {loading ? (
                    <div className="loading-spinner" style={{ height: "500px" }}>
                        <div className="spinner" />
                    </div>
                ) : MapComponent ? (
                    <MapComponent complaints={filteredComplaints} />
                ) : (
                    <div className="loading-spinner" style={{ height: "500px" }}>
                        <div className="spinner" />
                    </div>
                )}
            </div>

            {/* Map Legend + Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginTop: "1.5rem" }}>
                {/* Priority Legend */}
                <div className="card">
                    <h3 style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: "1rem" }}>
                        🎯 Priority Legend
                    </h3>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                        {[
                            { level: "CRITICAL", color: "#ef4444", count: priorityStats["CRITICAL"] || 0 },
                            { level: "HIGH", color: "#f97316", count: priorityStats["HIGH"] || 0 },
                            { level: "MEDIUM", color: "#eab308", count: priorityStats["MEDIUM"] || 0 },
                            { level: "LOW", color: "#22c55e", count: priorityStats["LOW"] || 0 },
                        ].map((p) => (
                            <div key={p.level} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                <div
                                    style={{
                                        width: "12px",
                                        height: "12px",
                                        borderRadius: "50%",
                                        background: p.color,
                                        boxShadow: `0 0 8px ${p.color}50`,
                                    }}
                                />
                                <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                                    {p.level} ({p.count})
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Category Breakdown */}
                <div className="card">
                    <h3 style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: "1rem" }}>
                        📊 Issues by Category
                    </h3>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                        {Object.entries(categoryStats).map(([cat, count]) => (
                            <div
                                key={cat}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "0.4rem",
                                    fontSize: "0.85rem",
                                    color: "var(--text-secondary)",
                                }}
                            >
                                <span>{CATEGORY_ICONS[cat as keyof typeof CATEGORY_ICONS] || "📋"}</span>
                                <span>
                                    {CATEGORY_LABELS[cat as keyof typeof CATEGORY_LABELS] || cat}: <strong style={{ color: "var(--text-primary)" }}>{count}</strong>
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
