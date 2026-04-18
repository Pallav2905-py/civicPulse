"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
    PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
    LineChart, Line, XAxis, YAxis, CartesianGrid, Legend,
    RadarChart, PolarGrid, PolarAngleAxis, Radar,
} from "recharts";
import { SENTIMENT_CONFIG, CATEGORY_ICONS, CATEGORY_LABELS, type SentimentAnalyticsData, type SentimentLabel, type Complaint } from "@/lib/types";

const SENTIMENT_COLORS: Record<SentimentLabel, string> = {
    POSITIVE: "#10b981",
    NEUTRAL: "#94a3b8",
    FRUSTRATED: "#f97316",
    DISTRESSED: "#8b5cf6",
    ANGRY: "#ef4444",
};

const SEVERITY_ORDER: Record<SentimentLabel, number> = {
    ANGRY: 5, DISTRESSED: 4, FRUSTRATED: 3, NEUTRAL: 2, POSITIVE: 1,
};

const EMPTY_DATA: SentimentAnalyticsData = {
    totalAnalyzed: 0,
    distribution: [],
    trend: [],
    topDistressed: [],
    avgScore: 0,
    dominantEmotion: "NEUTRAL",
};

export default function SentimentPage() {
    const [data, setData] = useState<SentimentAnalyticsData>(EMPTY_DATA);
    const [loading, setLoading] = useState(true);
    const [backfilling, setBackfilling] = useState(false);
    const [backfillResult, setBackfillResult] = useState<string | null>(null);
    const [activeFilter, setActiveFilter] = useState<SentimentLabel | "ALL">("ALL");
    const [generatingResponse, setGeneratingResponse] = useState<string | null>(null);
    const [generatedResponses, setGeneratedResponses] = useState<Record<string, string>>({});
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    const fetchData = useCallback(() => {
        fetch("/api/sentiment")
            .then((res) => res.json())
            .then((d) => { setData(d); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleBackfillAll = async () => {
        setBackfilling(true);
        setBackfillResult(null);
        try {
            const res = await fetch("/api/sentiment", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({}),
            });
            const result = await res.json();
            setBackfillResult(`✅ Analyzed ${result.succeeded} complaints successfully. Charts updated.`);
            fetchData();
        } catch {
            setBackfillResult("❌ Backfill failed. Please try again.");
        } finally {
            setBackfilling(false);
        }
    };

    const generateEmpathyResponse = async (complaint: Complaint) => {
        setGeneratingResponse(complaint.id);
        try {
            const res = await fetch("/api/sentiment/response", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    complaintId: complaint.id,
                    title: complaint.title,
                    description: complaint.description,
                    sentimentLabel: complaint.sentimentLabel,
                    empathyNote: complaint.empathyNote,
                    department: complaint.department,
                }),
            });
            const result = await res.json();
            setGeneratedResponses(prev => ({ ...prev, [complaint.id]: result.response }));
        } catch {
            setGeneratedResponses(prev => ({ ...prev, [complaint.id]: "Failed to generate response. Please try again." }));
        } finally {
            setGeneratingResponse(null);
        }
    };

    const copyToClipboard = async (id: string, text: string) => {
        await navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const exportCSV = () => {
        const rows = [
            ["ID", "Title", "Category", "Sentiment", "Score", "Emotion Tags", "Empathy Note", "Priority", "Status", "Date"],
            ...data.topDistressed.map(c => [
                c.id, c.title, CATEGORY_LABELS[c.category],
                c.sentimentLabel || "", String(Math.round((c.sentimentScore || 0) * 100)) + "%",
                (c.emotionTags || []).join("; "), c.empathyNote || "",
                c.priority, c.status, new Date(c.createdAt).toLocaleDateString("en-IN"),
            ]),
        ];
        const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a"); a.href = url; a.download = "sentiment_report.csv"; a.click();
        URL.revokeObjectURL(url);
    };

    const dominantCfg = data.dominantEmotion ? SENTIMENT_CONFIG[data.dominantEmotion] : null;

    const filteredComplaints = data.topDistressed
        .filter(c => activeFilter === "ALL" || c.sentimentLabel === activeFilter)
        .filter(c => !searchQuery || c.title.toLowerCase().includes(searchQuery.toLowerCase()) || c.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const distressedCount = data.distribution.filter(d => d.label === "DISTRESSED" || d.label === "ANGRY").reduce((s, d) => s + d.count, 0);

    // Radar data for emotion balance
    const radarData = (["POSITIVE", "NEUTRAL", "FRUSTRATED", "DISTRESSED", "ANGRY"] as SentimentLabel[]).map(label => ({
        emotion: SENTIMENT_CONFIG[label].emoji + " " + label,
        count: data.distribution.find(d => d.label === label)?.count || 0,
    }));

    if (loading) {
        return (
            <div className="page-container">
                <div className="loading-spinner"><div className="spinner" /></div>
            </div>
        );
    }

    return (
        <div className="page-container" style={{ maxWidth: "1300px" }}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>

                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem", marginBottom: "2rem" }}>
                    <div className="page-header" style={{ margin: 0 }}>
                        <h1>💬 Sentiment Insights</h1>
                        <p>NLP-powered emotional tone analysis — helping officers respond with empathy</p>
                    </div>
                    <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                        <button className="btn btn-secondary btn-sm" onClick={exportCSV} title="Export CSV">
                            📥 Export CSV
                        </button>
                        <button
                            className="btn btn-secondary btn-sm"
                            onClick={handleBackfillAll}
                            disabled={backfilling}
                        >
                            {backfilling ? <><span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Analyzing...</> : "🧠 Analyze Existing"}
                        </button>
                    </div>
                </div>

                {backfillResult && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                        className="card" style={{ marginBottom: "1.5rem", padding: "0.85rem 1rem", background: "rgba(16,185,129,0.08)", borderColor: "rgba(16,185,129,0.3)", fontSize: "0.9rem", color: "var(--text-secondary)" }}>
                        {backfillResult}
                    </motion.div>
                )}

                {/* KPI Row */}
                <div className="kpi-grid" style={{ marginBottom: "2rem" }}>
                    {[
                        { icon: "📊", label: "Total Analyzed", value: data.totalAnalyzed, color: "#8b5cf6", bg: "rgba(139,92,246,0.12)" },
                        { icon: dominantCfg?.emoji || "😐", label: "Dominant Emotion", value: data.dominantEmotion, color: dominantCfg?.color || "#94a3b8", bg: dominantCfg?.bg || "rgba(148,163,184,0.12)" },
                        { icon: "🎯", label: "Avg. Confidence", value: `${Math.round(data.avgScore * 100)}%`, color: "#3b82f6", bg: "rgba(59,130,246,0.12)" },
                        { icon: "🚨", label: "Distressed / Angry", value: distressedCount, color: "#ef4444", bg: "rgba(239,68,68,0.12)" },
                    ].map((kpi, i) => (
                        <motion.div key={i} className="kpi-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                            <div className="kpi-icon" style={{ background: kpi.bg }}><span style={{ fontSize: "1.4rem" }}>{kpi.icon}</span></div>
                            <div>
                                <div className="kpi-value" style={{ color: kpi.color, fontSize: "1.4rem" }}>{kpi.value}</div>
                                <div className="kpi-label">{kpi.label}</div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Charts Row */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1.7fr 1fr", gap: "1.25rem", marginBottom: "2rem" }}>
                    {/* Pie chart */}
                    <div className="card">
                        <h3 style={{ marginBottom: "1rem", fontSize: "0.95rem" }}>🥧 Distribution</h3>
                        {data.distribution.length === 0 ? (
                            <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                                No data yet.<br />Click &quot;Analyze Existing&quot;.
                            </div>
                        ) : (
                            <>
                                <ResponsiveContainer width="100%" height={180}>
                                    <PieChart>
                                        <Pie data={data.distribution.filter(d => d.count > 0)} dataKey="count" nameKey="label"
                                            cx="50%" cy="50%" outerRadius={72} innerRadius={35} paddingAngle={3}
                                            label={(props: { name?: string; percent?: number }) =>
                                                `${SENTIMENT_CONFIG[props.name as SentimentLabel]?.emoji} ${Math.round((props.percent || 0) * 100)}%`}
                                            labelLine={false}>
                                            {data.distribution.map(entry => <Cell key={entry.label} fill={SENTIMENT_COLORS[entry.label]} />)}
                                        </Pie>
                                        <Tooltip formatter={(v, n) => [`${v} complaints`, `${SENTIMENT_CONFIG[n as SentimentLabel]?.emoji} ${n}`]}
                                            contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "8px", fontSize: "0.8rem" }} />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem", marginTop: "0.5rem" }}>
                                    {data.distribution.map(d => (
                                        <div key={d.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.8rem" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                                                <div style={{ width: 8, height: 8, borderRadius: "50%", background: SENTIMENT_COLORS[d.label] }} />
                                                <span>{SENTIMENT_CONFIG[d.label]?.emoji} {d.label}</span>
                                            </div>
                                            <span style={{ color: "var(--text-muted)", fontWeight: 600 }}>{d.count} ({d.percentage}%)</span>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Line chart */}
                    <div className="card">
                        <h3 style={{ marginBottom: "1rem", fontSize: "0.95rem" }}>📈 7-Day Emotion Trend</h3>
                        <ResponsiveContainer width="100%" height={260}>
                            <LineChart data={data.trend} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "var(--text-muted)" }} tickFormatter={v => v.slice(5)} />
                                <YAxis tick={{ fontSize: 10, fill: "var(--text-muted)" }} allowDecimals={false} />
                                <Tooltip contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "8px", fontSize: "0.78rem" }} />
                                <Legend formatter={v => `${SENTIMENT_CONFIG[v as SentimentLabel]?.emoji} ${v}`} wrapperStyle={{ fontSize: "0.75rem" }} />
                                {(["ANGRY", "DISTRESSED", "FRUSTRATED", "NEUTRAL", "POSITIVE"] as SentimentLabel[]).map(label => (
                                    <Line key={label} type="monotone" dataKey={label} stroke={SENTIMENT_COLORS[label]} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                                ))}
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Radar chart */}
                    <div className="card">
                        <h3 style={{ marginBottom: "1rem", fontSize: "0.95rem" }}>🕸️ Emotion Radar</h3>
                        <ResponsiveContainer width="100%" height={260}>
                            <RadarChart data={radarData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
                                <PolarGrid stroke="var(--border)" />
                                <PolarAngleAxis dataKey="emotion" tick={{ fontSize: 9, fill: "var(--text-muted)" }} />
                                <Radar name="Complaints" dataKey="count" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.25} />
                                <Tooltip contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "8px", fontSize: "0.78rem" }} />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Complaints List */}
                <div className="card" style={{ marginBottom: "2rem" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem", marginBottom: "1.25rem" }}>
                        <h3 style={{ fontSize: "1rem" }}>🚨 All Sentiment-Analyzed Complaints</h3>
                        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="🔍 Search complaints..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                style={{ padding: "0.35rem 0.75rem", fontSize: "0.82rem", width: "180px", borderRadius: "8px" }}
                            />
                            {(["ALL", "ANGRY", "DISTRESSED", "FRUSTRATED", "NEUTRAL", "POSITIVE"] as const).map(f => (
                                <button
                                    key={f}
                                    onClick={() => setActiveFilter(f)}
                                    className={`filter-chip ${activeFilter === f ? "active" : ""}`}
                                    style={f !== "ALL" && activeFilter === f ? {
                                        background: SENTIMENT_COLORS[f as SentimentLabel],
                                        borderColor: SENTIMENT_COLORS[f as SentimentLabel],
                                        color: "white",
                                    } : {}}
                                >
                                    {f === "ALL" ? `All (${data.totalAnalyzed})` : `${SENTIMENT_CONFIG[f]?.emoji} ${f} (${data.distribution.find(d => d.label === f)?.count || 0})`}
                                </button>
                            ))}
                        </div>
                    </div>

                    {data.totalAnalyzed === 0 ? (
                        <div style={{ textAlign: "center", padding: "4rem 2rem", color: "var(--text-muted)" }}>
                            <p style={{ fontSize: "3rem", marginBottom: "1rem" }}>🧠</p>
                            <p style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.5rem" }}>No sentiment data yet</p>
                            <p style={{ fontSize: "0.9rem" }}>Submit complaints or click &quot;Analyze Existing&quot; to start.</p>
                        </div>
                    ) : filteredComplaints.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
                            <p style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🔍</p>
                            <p>No complaints match your filter.</p>
                        </div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                            {filteredComplaints.map((complaint, i) => {
                                const cfg = complaint.sentimentLabel ? SENTIMENT_CONFIG[complaint.sentimentLabel] : null;
                                const severity = SEVERITY_ORDER[complaint.sentimentLabel as SentimentLabel] || 0;
                                const hasResponse = !!generatedResponses[complaint.id];
                                return (
                                    <motion.div key={complaint.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: Math.min(i * 0.04, 0.4) }}
                                        style={{ borderRadius: "12px", border: `1px solid ${cfg?.border || "var(--border)"}`, background: cfg?.bg || "transparent", overflow: "hidden" }}>
                                        <div style={{ display: "flex", gap: "1rem", padding: "1rem", alignItems: "flex-start" }}>
                                            <span style={{ fontSize: "1.8rem", flexShrink: 0 }}>{cfg?.emoji || "😐"}</span>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.3rem" }}>
                                                    <Link href={`/complaint/${complaint.id}`}
                                                        style={{ fontWeight: 600, fontSize: "0.95rem", color: "var(--text-primary)", textDecoration: "none" }}>
                                                        {CATEGORY_ICONS[complaint.category]} {complaint.title}
                                                    </Link>
                                                    <span className="badge" style={{ background: cfg?.bg, color: cfg?.color, border: `1px solid ${cfg?.border}`, fontSize: "0.7rem" }}>
                                                        {complaint.sentimentLabel}
                                                    </span>
                                                    <span className={`badge badge-${complaint.priority.toLowerCase()}`} style={{ fontSize: "0.7rem" }}>{complaint.priority}</span>
                                                    <span className={`badge badge-${complaint.status.toLowerCase()}`} style={{ fontSize: "0.7rem" }}>
                                                        {complaint.status === "IN_PROGRESS" ? "In Progress" : complaint.status}
                                                    </span>
                                                    {severity >= 4 && (
                                                        <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#ef4444", background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "4px", padding: "0.1rem 0.4rem" }}>
                                                            ⚡ HIGH PRIORITY RESPONSE
                                                        </span>
                                                    )}
                                                </div>
                                                <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.4rem", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                                                    {complaint.description}
                                                </p>
                                                {complaint.emotionTags && complaint.emotionTags.length > 0 && (
                                                    <div style={{ display: "flex", gap: "0.3rem", flexWrap: "wrap", marginBottom: "0.4rem" }}>
                                                        {complaint.emotionTags.map(tag => (
                                                            <span key={tag} className="emotion-tag" style={{ color: cfg?.color, borderColor: cfg?.border }}>{tag}</span>
                                                        ))}
                                                    </div>
                                                )}
                                                {complaint.empathyNote && (
                                                    <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontStyle: "italic" }}>
                                                        💬 {complaint.empathyNote}
                                                    </p>
                                                )}
                                            </div>
                                            <div style={{ textAlign: "right", flexShrink: 0 }}>
                                                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Confidence</div>
                                                <div style={{ fontWeight: 700, color: cfg?.color }}>{Math.round((complaint.sentimentScore || 0) * 100)}%</div>
                                                <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>{CATEGORY_LABELS[complaint.category]}</div>
                                                <button
                                                    className="btn btn-secondary btn-sm"
                                                    style={{ marginTop: "0.5rem", fontSize: "0.72rem", padding: "0.25rem 0.6rem", whiteSpace: "nowrap" }}
                                                    onClick={() => generateEmpathyResponse(complaint)}
                                                    disabled={generatingResponse === complaint.id}
                                                >
                                                    {generatingResponse === complaint.id ? <><span className="spinner" style={{ width: 10, height: 10, borderWidth: 1.5 }} /> Generating...</> : "✍️ Draft Reply"}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Generated response */}
                                        <AnimatePresence>
                                            {hasResponse && (
                                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                                                    style={{ borderTop: `1px solid ${cfg?.border || "var(--border)"}`, padding: "0.85rem 1rem", background: "rgba(255,255,255,0.4)" }}>
                                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                                                        <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)" }}>✍️ AI-Drafted Empathy Response</span>
                                                        <button
                                                            className="btn btn-secondary btn-sm"
                                                            style={{ fontSize: "0.72rem", padding: "0.2rem 0.6rem" }}
                                                            onClick={() => copyToClipboard(complaint.id, generatedResponses[complaint.id])}
                                                        >
                                                            {copiedId === complaint.id ? "✅ Copied!" : "📋 Copy"}
                                                        </button>
                                                    </div>
                                                    <p style={{ fontSize: "0.85rem", color: "var(--text-primary)", lineHeight: 1.6, whiteSpace: "pre-wrap", margin: 0 }}>
                                                        {generatedResponses[complaint.id]}
                                                    </p>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Officer Guidelines */}
                <div className="card" style={{ marginBottom: "2rem" }}>
                    <h3 style={{ fontSize: "1rem", marginBottom: "1.25rem" }}>💡 Empathy Response Guidelines for Officers</h3>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem" }}>
                        {(Object.entries(SENTIMENT_CONFIG) as [SentimentLabel, typeof SENTIMENT_CONFIG[SentimentLabel]][]).map(([label, cfg]) => (
                            <div key={label} style={{ padding: "1rem", borderRadius: "10px", background: cfg.bg, border: `1px solid ${cfg.border}` }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                                    <span style={{ fontSize: "1.4rem" }}>{cfg.emoji}</span>
                                    <span style={{ fontWeight: 700, color: cfg.color, fontSize: "0.9rem" }}>{label}</span>
                                </div>
                                <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>{cfg.description}</p>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginTop: "0.5rem" }}>
                                    <div style={{ width: `${data.distribution.find(d => d.label === label)?.percentage || 0}%`, minWidth: "4px", height: "4px", borderRadius: "2px", background: cfg.color, maxWidth: "100%", transition: "width 0.8s ease" }} />
                                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                                        {data.distribution.find(d => d.label === label)?.percentage || 0}% of complaints
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
