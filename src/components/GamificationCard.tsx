"use client";

import { useAuth } from "@/context/AuthContext";
import { BADGES } from "@/lib/types";
import { motion } from "framer-motion";

export function GamificationCard() {
    const { profile, user } = useAuth();

    // Fallback if profile not yet created or fetched
    const xp = profile?.xp || 0;
    const level = profile?.level || 1;
    const badges = profile?.badges || [];

    // If not logged in, show a teaser
    if (!user) {
        return (
            <div className="card" style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                boxShadow: "var(--shadow-lg)",
                textAlign: "center",
                padding: "2rem"
            }}>
                <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>🏆</div>
                <h3 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "0.5rem" }}>Earn Rewards</h3>
                <p style={{ color: "var(--text-secondary)", marginBottom: "1rem" }}>
                    Track your civic impact, level up, and earn badges by reporting issues.
                </p>
                <a href="/auth" className="btn btn-primary btn-sm">Sign In to Earn XP</a>
            </div>
        );
    }

    // Simplistic Level Logic:
    // L1: 0-199 XP
    // L2: 200-399 XP
    // L3: 400-599 XP ...
    const nextLevelXp = level * 200;
    const currentLevelStartXp = (level - 1) * 200;
    const levelProgress = xp - currentLevelStartXp;
    const progressPercent = Math.min(100, Math.max(0, (levelProgress / 200) * 100));

    return (
        <div className="card" style={{
            background: "var(--gradient-hero)", // subtle light gradient
            border: "1px solid var(--border)",
            boxShadow: "var(--shadow-card)",
            height: "100%",
            borderRadius: "16px",
            padding: "1.5rem"
        }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                <div>
                    <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "0.25rem", color: "var(--text-primary)" }}>
                        🏆 Your Civic Impact
                    </h3>
                    <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                        Level {level} Citizen
                    </p>
                </div>
                <div style={{
                    background: "linear-gradient(135deg, var(--accent-purple), var(--accent-blue))",
                    width: "48px",
                    height: "48px",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.5rem",
                    boxShadow: "0 4px 12px rgba(139, 92, 246, 0.4)"
                }}>
                    ⭐
                </div>
            </div>

            {/* XP Bar */}
            <div style={{ marginBottom: "1.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginBottom: "0.5rem", color: "var(--text-muted)" }}>
                    <span>{xp} XP</span>
                    <span>{nextLevelXp} XP</span>
                </div>
                <div style={{ height: "8px", background: "var(--bg-secondary)", borderRadius: "4px", overflow: "hidden", border: "1px solid var(--border)" }}>
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPercent}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        style={{ height: "100%", background: "var(--accent-purple)", borderRadius: "4px" }}
                    />
                </div>
                <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.5rem", textAlign: "right" }}>
                    {200 - levelProgress} XP for Level {level + 1}
                </p>
            </div>

            {/* Badges */}
            <div>
                <h4 style={{ fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "0.75rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Badges ({badges.length})
                </h4>
                {badges.length > 0 ? (
                    <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                        {badges.map((badgeId, idx) => {
                            const badge = BADGES[badgeId];
                            if (!badge) return null;
                            return (
                                <div key={idx} title={badge.description} style={{
                                    background: "var(--bg-card)",
                                    padding: "0.5rem",
                                    borderRadius: "8px",
                                    textAlign: "center",
                                    minWidth: "70px",
                                    border: "1px solid var(--border)",
                                    boxShadow: "var(--shadow-sm)"
                                }}>
                                    <div style={{ fontSize: "1.5rem", marginBottom: "0.25rem" }}>{badge.icon}</div>
                                    <div style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>{badge.label}</div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div style={{ padding: "1rem", textAlign: "center", background: "var(--bg-secondary)", borderRadius: "8px", border: "1px dashed var(--border)" }}>
                        <p style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>
                            Report issues to earn your first badge!
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
