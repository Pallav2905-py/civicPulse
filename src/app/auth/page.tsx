"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";

export default function AuthPage() {
    const router = useRouter();
    const { signIn, signUp, user } = useAuth();
    const [mode, setMode] = useState<"login" | "signup">("login");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Redirect if already logged in
    if (user) {
        router.push("/dashboard");
        return null;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        setLoading(true);

        if (mode === "signup") {
            if (!name.trim()) {
                setError("Please enter your full name.");
                setLoading(false);
                return;
            }
            const result = await signUp(email, password, name);
            if (result.error) {
                setError(result.error);
            } else {
                setSuccess("Account created! You can now sign in.");
                setMode("login");
                setPassword("");
            }
        } else {
            const result = await signIn(email, password);
            if (result.error) {
                setError(result.error);
            } else {
                router.push("/dashboard");
            }
        }

        setLoading(false);
    };

    return (
        <div className="page-container" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh" }}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                style={{ width: "100%", maxWidth: "440px" }}
            >
                <div style={{ textAlign: "center", marginBottom: "2rem" }}>
                    <p style={{ fontSize: "3rem", marginBottom: "0.5rem" }}>
                        {mode === "login" ? "🔐" : "🚀"}
                    </p>
                    <h1 style={{ fontSize: "1.8rem", fontWeight: 800 }}>
                        {mode === "login" ? "Welcome Back" : "Create Account"}
                    </h1>
                    <p style={{ color: "var(--text-secondary)", marginTop: "0.5rem" }}>
                        {mode === "login"
                            ? "Sign in to track your complaints"
                            : "Join CivicPulse to report civic issues"
                        }
                    </p>
                </div>

                <div className="card" style={{ padding: "2rem" }}>
                    {/* Tab Switcher */}
                    <div style={{
                        display: "flex",
                        background: "var(--bg-card-hover)",
                        borderRadius: "10px",
                        padding: "4px",
                        marginBottom: "1.5rem",
                    }}>
                        <button
                            onClick={() => { setMode("login"); setError(""); setSuccess(""); }}
                            style={{
                                flex: 1,
                                padding: "0.6rem",
                                borderRadius: "8px",
                                border: "none",
                                cursor: "pointer",
                                fontWeight: 600,
                                fontSize: "0.9rem",
                                transition: "all 0.2s",
                                background: mode === "login"
                                    ? "linear-gradient(135deg, var(--accent-purple), var(--accent-blue))"
                                    : "transparent",
                                color: mode === "login" ? "#fff" : "var(--text-secondary)",
                            }}
                        >
                            Login
                        </button>
                        <button
                            onClick={() => { setMode("signup"); setError(""); setSuccess(""); }}
                            style={{
                                flex: 1,
                                padding: "0.6rem",
                                borderRadius: "8px",
                                border: "none",
                                cursor: "pointer",
                                fontWeight: 600,
                                fontSize: "0.9rem",
                                transition: "all 0.2s",
                                background: mode === "signup"
                                    ? "linear-gradient(135deg, var(--accent-purple), var(--accent-blue))"
                                    : "transparent",
                                color: mode === "signup" ? "#fff" : "var(--text-secondary)",
                            }}
                        >
                            Sign Up
                        </button>
                    </div>

                    {error && (
                        <div style={{
                            background: "#fef2f2",
                            border: "1px solid #fecaca",
                            borderRadius: "8px",
                            padding: "0.75rem 1rem",
                            marginBottom: "1rem",
                            color: "#f87171",
                            fontSize: "0.85rem",
                        }}>
                            ⚠️ {error}
                        </div>
                    )}

                    {success && (
                        <div style={{
                            background: "#f0fdf4",
                            border: "1px solid #bbf7d0",
                            borderRadius: "8px",
                            padding: "0.75rem 1rem",
                            marginBottom: "1rem",
                            color: "#4ade80",
                            fontSize: "0.85rem",
                        }}>
                            ✅ {success}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        {mode === "signup" && (
                            <div className="form-group">
                                <label>Full Name *</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="e.g., Atharv Chougule"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                />
                            </div>
                        )}

                        <div className="form-group">
                            <label>Email *</label>
                            <input
                                type="email"
                                className="form-input"
                                placeholder="your@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Password *</label>
                            <input
                                type="password"
                                className="form-input"
                                placeholder={mode === "signup" ? "Min 6 characters" : "Enter your password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                minLength={6}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={loading}
                            style={{
                                width: "100%",
                                marginTop: "0.5rem",
                                padding: "0.85rem",
                                fontSize: "1rem",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "0.5rem",
                            }}
                        >
                            {loading ? (
                                <>
                                    <span className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} />
                                    {mode === "login" ? "Signing in..." : "Creating account..."}
                                </>
                            ) : (
                                <>
                                    {mode === "login" ? "🔐 Sign In" : "🚀 Create Account"}
                                </>
                            )}
                        </button>
                    </form>
                </div>

                <p style={{
                    textAlign: "center",
                    marginTop: "1.5rem",
                    color: "var(--text-muted)",
                    fontSize: "0.85rem",
                }}>
                    {mode === "login" ? (
                        <>Don&apos;t have an account?{" "}
                            <button
                                onClick={() => { setMode("signup"); setError(""); }}
                                style={{ color: "var(--accent-purple)", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}
                            >
                                Sign up
                            </button>
                        </>
                    ) : (
                        <>Already have an account?{" "}
                            <button
                                onClick={() => { setMode("login"); setError(""); }}
                                style={{ color: "var(--accent-purple)", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}
                            >
                                Sign in
                            </button>
                        </>
                    )}
                </p>
            </motion.div>
        </div>
    );
}
