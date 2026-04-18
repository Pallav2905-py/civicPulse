"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend,
} from "recharts";
import {
    CATEGORY_LABELS, CATEGORY_ICONS,
    PRIORITY_COLORS, STATUS_COLORS,
    type Complaint, type AnalyticsData,
} from "@/lib/types";

const CHART_COLORS = ["#8b5cf6", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#ec4899", "#06b6d4", "#84cc16"];

export default function AdminPage() {
    const [complaints, setComplaints] = useState<Complaint[]>([]);
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"overview" | "complaints" | "departments">("overview");
    const [statusFilter, setStatusFilter] = useState("ALL");

    useEffect(() => {
        const fetchData = () => {
            Promise.all([
                fetch("/api/complaints").then((r) => r.json()),
                fetch("/api/analytics").then((r) => r.json()),
            ])
                .then(([c, a]) => {
                    setComplaints(c);
                    setAnalytics(a);
                    setLoading(false);
                })
                .catch(() => setLoading(false));
        };

        fetchData();
        // Refresh every 5 seconds to get new status
        const interval = setInterval(fetchData, 5000);

        // Force re-render for timer every second
        const timerInterval = setInterval(() => {
            setComplaints(prev => [...prev]);
        }, 1000);

        return () => {
            clearInterval(interval);
            clearInterval(timerInterval);
        };
    }, []);

    const updateStatus = async (id: string, newStatus: string) => {
        try {
            const res = await fetch(`/api/complaints/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    status: newStatus,
                    updatedBy: "admin",
                    updatedByName: "Admin Officer",
                    comment: `Status updated to ${newStatus}`,
                }),
            });
            const updated = await res.json();
            setComplaints((prev) => prev.map((c) => (c.id === id ? { ...c, ...updated } : c)));
        } catch {
            // ignore
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
        });
    };

    const filteredComplaints = statusFilter === "ALL"
        ? complaints
        : complaints.filter((c) => c.status === statusFilter);

    if (loading) {
        return (
            <div className="page-container">
                <div className="loading-spinner"><div className="spinner" /></div>
            </div>
        );
    }

    const customTooltipStyle = {
        backgroundColor: "#1a1f35",
        border: "1px solid #2a3050",
        borderRadius: "8px",
        padding: "8px 12px",
        fontSize: "0.85rem",
        color: "#e6edf3",
    };

    return (
        <div className="page-container" style={{ maxWidth: "1400px" }}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
            >
                <div className="page-header">
                    <h1>🏛️ Admin Dashboard</h1>
                    <p>Government department management panel</p>
                </div>

                {/* Tabs */}
                <div className="filters-bar" style={{ marginBottom: "2rem" }}>
                    {(["overview", "complaints", "departments"] as const).map((tab) => (
                        <button
                            key={tab}
                            className={`filter-chip ${activeTab === tab ? "active" : ""}`}
                            onClick={() => setActiveTab(tab)}
                            style={{ fontSize: "0.95rem", padding: "0.5rem 1.2rem" }}
                        >
                            {tab === "overview" ? "📊 Overview" : tab === "complaints" ? "📋 All Complaints" : "🏢 Departments"}
                        </button>
                    ))}
                </div>

                {/* ===== OVERVIEW TAB ===== */}
                {activeTab === "overview" && analytics && (
                    <>
                        {/* KPI Cards */}
                        <div className="kpi-grid">
                            <motion.div className="kpi-card" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.05 }}>
                                <div className="kpi-icon" style={{ background: "rgba(139, 92, 246, 0.15)", color: "#a78bfa" }}>📋</div>
                                <div>
                                    <div className="kpi-value">{analytics.totalComplaints}</div>
                                    <div className="kpi-label">Total Complaints</div>
                                </div>
                            </motion.div>
                            <motion.div className="kpi-card" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}>
                                <div className="kpi-icon" style={{ background: "rgba(245, 158, 11, 0.15)", color: "#fbbf24" }}>⏳</div>
                                <div>
                                    <div className="kpi-value">{analytics.pendingComplaints}</div>
                                    <div className="kpi-label">Pending</div>
                                </div>
                            </motion.div>
                            <motion.div className="kpi-card" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15 }}>
                                <div className="kpi-icon" style={{ background: "rgba(16, 185, 129, 0.15)", color: "#34d399" }}>✅</div>
                                <div>
                                    <div className="kpi-value">{analytics.resolvedToday}</div>
                                    <div className="kpi-label">Resolved Today</div>
                                </div>
                            </motion.div>
                            <motion.div className="kpi-card" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>
                                <div className="kpi-icon" style={{ background: "rgba(59, 130, 246, 0.15)", color: "#60a5fa" }}>⏱️</div>
                                <div>
                                    <div className="kpi-value">{analytics.avgResolutionDays}d</div>
                                    <div className="kpi-label">Avg. Resolution</div>
                                </div>
                            </motion.div>
                        </div>

                        {/* Charts */}
                        <div className="charts-grid">
                            {/* Complaints by Category */}
                            <div className="chart-card">
                                <h3>📊 Complaints by Category</h3>
                                <ResponsiveContainer width="100%" height={280}>
                                    <BarChart data={analytics.byCategory.map((d) => ({
                                        ...d,
                                        name: CATEGORY_LABELS[d.name as keyof typeof CATEGORY_LABELS] || d.name,
                                    }))}>
                                        <XAxis dataKey="name" tick={{ fill: "#8b949e", fontSize: 11 }} angle={-20} textAnchor="end" height={60} />
                                        <YAxis tick={{ fill: "#8b949e", fontSize: 12 }} />
                                        <Tooltip contentStyle={customTooltipStyle} />
                                        <Bar dataKey="value" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Status Distribution */}
                            <div className="chart-card">
                                <h3>📈 Status Distribution</h3>
                                <ResponsiveContainer width="100%" height={280}>
                                    <PieChart>
                                        <Pie
                                            data={analytics.byStatus}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={100}
                                            labelLine={true}
                                            label={({ name, value }) => `${name} (${value})`}
                                            dataKey="value"
                                        >
                                            {analytics.byStatus.map((entry, index) => (
                                                <Cell
                                                    key={index}
                                                    fill={STATUS_COLORS[entry.name as keyof typeof STATUS_COLORS] || CHART_COLORS[index]}
                                                />
                                            ))}
                                        </Pie>
                                        <Tooltip contentStyle={customTooltipStyle} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Complaint Trend */}
                            <div className="chart-card">
                                <h3>📉 7-Day Complaint Trend</h3>
                                <ResponsiveContainer width="100%" height={280}>
                                    <LineChart data={analytics.trend}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#2a3050" />
                                        <XAxis dataKey="date" tick={{ fill: "#8b949e", fontSize: 11 }} />
                                        <YAxis tick={{ fill: "#8b949e", fontSize: 12 }} />
                                        <Tooltip contentStyle={customTooltipStyle} />
                                        <Line type="monotone" dataKey="count" stroke="#8b5cf6" strokeWidth={3} dot={{ fill: "#8b5cf6", r: 5 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Priority Distribution */}
                            <div className="chart-card">
                                <h3>🎯 Priority Distribution</h3>
                                <ResponsiveContainer width="100%" height={280}>
                                    <PieChart>
                                        <Pie
                                            data={analytics.byPriority}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={100}
                                            label={({ name, value }) => `${name} (${value})`}
                                            dataKey="value"
                                        >
                                            {analytics.byPriority.map((entry, index) => (
                                                <Cell
                                                    key={index}
                                                    fill={PRIORITY_COLORS[entry.name as keyof typeof PRIORITY_COLORS] || CHART_COLORS[index]}
                                                />
                                            ))}
                                        </Pie>
                                        <Tooltip contentStyle={customTooltipStyle} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </>
                )}

                {/* ===== COMPLAINTS TAB ===== */}
                {activeTab === "complaints" && (
                    <>
                        <div className="filters-bar">
                            {["ALL", "SUBMITTED", "ASSIGNED", "IN_PROGRESS", "RESOLVED"].map((s) => (
                                <button
                                    key={s}
                                    className={`filter-chip ${statusFilter === s ? "active" : ""}`}
                                    onClick={() => setStatusFilter(s)}
                                >
                                    {s === "ALL" ? `All (${complaints.length})` : `${s.replace("_", " ")} (${complaints.filter((c) => c.status === s).length})`}
                                </button>
                            ))}
                        </div>

                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Title</th>
                                        <th>Category</th>
                                        <th>Priority</th>
                                        <th>Status</th>
                                        <th>Assigned To</th>
                                        <th>Escalation</th>
                                        <th>Date</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredComplaints.map((c) => {
                                        // Demo Escalation Logic
                                        const now = Date.now();
                                        const created = new Date(c.createdAt).getTime();
                                        const resolved = c.resolvedAt ? new Date(c.resolvedAt).getTime() : now;
                                        const elapsedMinutes = Math.floor((resolved - created) / 60000); // 1 minute = 1 level

                                        let level = 1;
                                        if (elapsedMinutes >= 1) level = 2;
                                        if (elapsedMinutes >= 2) level = 3;

                                        const isResolved = c.status === "RESOLVED" || c.status === "CLOSED";

                                        // Mock Names based on Level
                                        const juniorNames = ["Rahul (Jr.)", "Amit (Jr.)", "Sneha (Jr.)"];
                                        const midNames = ["Vikram (Sr.)", "Priya (Sr.)", "Arjun (Sr.)"];
                                        const seniorNames = ["Chief Officer Sharma", "Director Verma", "Comm. Singh"];

                                        const nameIndex = c.id.charCodeAt(c.id.length - 1) % 3;
                                        let assignee = juniorNames[nameIndex];
                                        if (level === 2) assignee = midNames[nameIndex];
                                        if (level === 3) assignee = seniorNames[nameIndex];

                                        // Timer for next level
                                        const nextLevelTime = created + (level * 60000);
                                        const secondsLeft = Math.max(0, Math.floor((nextLevelTime - now) / 1000));

                                        return (
                                            <tr key={c.id}>
                                                <td>
                                                    <Link href={`/complaint/${c.id}`} style={{ color: "#a78bfa", textDecoration: "none" }}>
                                                        {c.id}
                                                    </Link>
                                                </td>
                                                <td style={{ maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis" }}>
                                                    {CATEGORY_ICONS[c.category]} {c.title}
                                                </td>
                                                <td>
                                                    <span className="badge badge-category">{CATEGORY_LABELS[c.category]}</span>
                                                </td>
                                                <td>
                                                    <span className={`badge badge-${c.priority.toLowerCase()}`}>
                                                        {c.priority}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className={`badge badge-${c.status.toLowerCase()}`}>
                                                        {c.status === "IN_PROGRESS" ? "In Progress" : c.status}
                                                    </span>
                                                </td>
                                                <td style={{ fontSize: "0.85rem", fontWeight: 500 }}>
                                                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                                        <span style={{
                                                            width: "8px", height: "8px", borderRadius: "50%",
                                                            background: level === 1 ? "#10b981" : level === 2 ? "#f59e0b" : "#ef4444"
                                                        }} />
                                                        {assignee}
                                                    </div>
                                                    <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                                                        {level === 1 ? "Junior Engineer" : level === 2 ? "Senior Engineer" : "Chief Officer"}
                                                    </div>
                                                </td>
                                                <td style={{ fontSize: "0.85rem" }}>
                                                    {isResolved ? (
                                                        <span style={{ color: "#10b981" }}>Resolved at L{level}</span>
                                                    ) : level < 3 ? (
                                                        <div style={{ color: "#f59e0b", fontWeight: 600 }}>
                                                            Escalating in {secondsLeft}s
                                                            <div style={{ width: "100%", height: "4px", background: "var(--bg-secondary)", marginTop: "4px", borderRadius: "2px" }}>
                                                                <div style={{ width: `${(1 - secondsLeft / 60) * 100}%`, height: "100%", background: "#f59e0b", borderRadius: "2px" }} />
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span style={{ color: "#ef4444", fontWeight: 700 }}>MAX LEVEL REACHED</span>
                                                    )}
                                                </td>
                                                <td style={{ fontSize: "0.85rem" }}>{formatDate(c.createdAt)}</td>
                                                <td>
                                                    <select
                                                        className="form-select"
                                                        value={c.status}
                                                        onChange={(e) => updateStatus(c.id, e.target.value)}
                                                        style={{ padding: "0.3rem 0.5rem", fontSize: "0.8rem", minWidth: "120px" }}
                                                    >
                                                        <option value="SUBMITTED">Submitted</option>
                                                        <option value="ASSIGNED">Assigned</option>
                                                        <option value="IN_PROGRESS">In Progress</option>
                                                        <option value="RESOLVED">Resolved</option>
                                                        <option value="CLOSED">Closed</option>
                                                    </select>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}

                {/* ===== DEPARTMENTS TAB ===== */}
                {activeTab === "departments" && analytics && (
                    <>
                        <div className="card-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))" }}>
                            {analytics.departmentPerformance.map((dept, i) => (
                                <motion.div
                                    key={dept.department}
                                    className="card"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.08 }}
                                >
                                    <h3 style={{ marginBottom: "1rem" }}>🏢 {dept.department}</h3>

                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem", textAlign: "center" }}>
                                        <div>
                                            <div style={{ fontSize: "1.5rem", fontWeight: 800 }}>{dept.total}</div>
                                            <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Total</div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--accent-green)" }}>{dept.resolved}</div>
                                            <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Resolved</div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#a78bfa" }}>{dept.avgDays}d</div>
                                            <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Avg. Days</div>
                                        </div>
                                    </div>

                                    {/* Progress bar */}
                                    <div style={{ marginTop: "1rem" }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "0.3rem" }}>
                                            <span>Resolution Rate</span>
                                            <span>{dept.total > 0 ? Math.round((dept.resolved / dept.total) * 100) : 0}%</span>
                                        </div>
                                        <div style={{ height: "6px", background: "var(--bg-secondary)", borderRadius: "3px", overflow: "hidden" }}>
                                            <div
                                                style={{
                                                    height: "100%",
                                                    width: `${dept.total > 0 ? (dept.resolved / dept.total) * 100 : 0}%`,
                                                    background: "var(--gradient-2)",
                                                    borderRadius: "3px",
                                                    transition: "width 0.5s ease",
                                                }}
                                            />
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </>
                )}
            </motion.div>
        </div>
    );
}
