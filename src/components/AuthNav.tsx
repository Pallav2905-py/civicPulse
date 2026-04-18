"use client";

import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function AuthNav() {
    const { user, userName, signOut, loading } = useAuth();
    const router = useRouter();
    const [signingOut, setSigningOut] = useState(false);

    if (loading) {
        return (
            <li style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>...</span>
            </li>
        );
    }

    if (!user) {
        return (
            <li>
                <Link
                    href="/auth"
                    style={{
                        background: "linear-gradient(135deg, var(--accent-purple), var(--accent-blue))",
                        padding: "0.4rem 1rem",
                        borderRadius: "8px",
                        color: "#fff",
                        fontWeight: 600,
                        fontSize: "0.85rem",
                        transition: "opacity 0.2s",
                    }}
                >
                    🔐 Login
                </Link>
            </li>
        );
    }

    return (
        <li style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    background: "var(--bg-card)",
                    padding: "0.35rem 0.75rem",
                    borderRadius: "8px",
                    border: "1px solid var(--border)",
                    boxShadow: "var(--shadow-sm)",
                }}
            >
                <span style={{ fontSize: "0.95rem" }}>👤</span>
                <span style={{ color: "var(--text-primary)", fontSize: "0.85rem", fontWeight: 500 }}>
                    {userName}
                </span>
            </div>
            <button
                onClick={async () => {
                    setSigningOut(true);
                    await signOut();
                    setSigningOut(false);
                    router.push("/");
                }}
                style={{
                    background: "#fef2f2",
                    border: "1px solid #fecaca",
                    color: "#f87171",
                    padding: "0.35rem 0.75rem",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontSize: "0.8rem",
                    fontWeight: 500,
                    transition: "all 0.2s",
                }}
            >
                {signingOut ? "..." : "Logout"}
            </button>
        </li>
    );
}
