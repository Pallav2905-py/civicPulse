"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { TiltCard } from "@/components/TiltCard";
import { AnimatedBackground } from "@/components/AnimatedBackground";

export default function TrackPage() {
    const [complaintId, setComplaintId] = useState("");
    const router = useRouter();

    const handleTrack = (e: React.FormEvent) => {
        e.preventDefault();
        if (complaintId.trim()) {
            router.push(`/complaint/${complaintId.trim()}`);
        }
    };

    return (
        <>
            <AnimatedBackground />
            <div className="page-container" style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <TiltCard>
                    <motion.div
                        className="card"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                        style={{ padding: "3rem", width: "100%", maxWidth: "500px", textAlign: "center" }}
                    >
                        <h1 style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>📡 Track Complaint</h1>
                        <p style={{ color: "var(--text-secondary)", marginBottom: "2rem" }}>
                            Enter your Complaint ID (e.g., CPL-123456-789) to check its real-time status.
                        </p>

                        <form onSubmit={handleTrack} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                            <input
                                type="text"
                                placeholder="Enter Complaint ID"
                                value={complaintId}
                                onChange={(e) => setComplaintId(e.target.value)}
                                className="form-input"
                                style={{
                                    padding: "1rem",
                                    fontSize: "1.1rem",
                                    textAlign: "center",
                                    letterSpacing: "1px",
                                    background: "var(--bg-secondary)",
                                    border: "2px solid var(--border)",
                                    borderRadius: "12px",
                                }}
                            />
                            <button
                                type="submit"
                                className="btn btn-primary"
                                style={{ padding: "1rem", fontSize: "1.1rem" }}
                            >
                                🔍 Track Status
                            </button>
                        </form>
                    </motion.div>
                </TiltCard>
            </div>
        </>
    );
}
