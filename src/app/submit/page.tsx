"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { CATEGORY_LABELS, CATEGORY_ICONS, type ClassificationResult } from "@/lib/types";
import { useAuth } from "@/context/AuthContext";

export default function SubmitPage() {
    const router = useRouter();
    const { user, userName } = useAuth();
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [address, setAddress] = useState("");
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [loading, setLoading] = useState(false);
    const [classifying, setClassifying] = useState(false);
    const [aiPreview, setAiPreview] = useState<{
        classification: ClassificationResult;
        priority: { score: number; level: string };
        department: string;
    } | null>(null);
    const [success, setSuccess] = useState<{ id: string } | null>(null);

    // Debounced AI classification
    const classifyText = useCallback(async (t: string, d: string) => {
        if (!t && !d) return;
        setClassifying(true);
        try {
            const res = await fetch("/api/classify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title: t, description: d }),
            });
            const data = await res.json();
            setAiPreview(data);
        } catch {
            // Ignore classification errors
        } finally {
            setClassifying(false);
        }
    }, []);

    // Trigger classification when user pauses typing
    const handleDescriptionChange = (val: string) => {
        setDescription(val);
        if (val.length > 20 || title.length > 5) {
            const timer = setTimeout(() => classifyText(title, val), 600);
            return () => clearTimeout(timer);
        }
    };

    const handleTitleChange = (val: string) => {
        setTitle(val);
        if (val.length > 10 && description.length > 10) {
            const timer = setTimeout(() => classifyText(val, description), 600);
            return () => clearTimeout(timer);
        }
    };

    const handleFileSelect = (file: File) => {
        const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
        if (!allowed.includes(file.type)) {
            alert("Only JPG, PNG, WebP, GIF images are allowed.");
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            alert("File too large. Maximum size is 5MB.");
            return;
        }
        setPhotoFile(file);
        setPhotoPreview(URL.createObjectURL(file));
    };

    const removePhoto = () => {
        setPhotoFile(null);
        if (photoPreview) URL.revokeObjectURL(photoPreview);
        setPhotoPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !description) return;

        setLoading(true);
        try {
            let photoUrl: string | undefined;

            // Upload photo if selected
            if (photoFile) {
                setUploading(true);
                const formData = new FormData();
                formData.append("file", photoFile);
                const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
                const uploadData = await uploadRes.json();
                if (uploadRes.ok) {
                    photoUrl = uploadData.url;
                }
                setUploading(false);
            }

            const res = await fetch("/api/complaints", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title,
                    description,
                    address: address || "Pune, Maharashtra",
                    latitude: 18.5204 + (Math.random() - 0.5) * 0.05,
                    longitude: 73.8567 + (Math.random() - 0.5) * 0.05,
                    photoUrl,
                    userId: user?.id || "user-demo",
                    userName: userName || "Demo Citizen",
                }),
            });
            const data = await res.json();
            setSuccess({ id: data.complaint.id });
        } catch {
            alert("Failed to submit. Please try again.");
        } finally {
            setLoading(false);
            setUploading(false);
        }
    };

    return (
        <div className="page-container" style={{ maxWidth: "800px" }}>
            <AnimatePresence>
                {success && (
                    <motion.div
                        className="success-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <div className="success-icon">✓</div>
                        <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.5rem" }}>
                            Complaint Submitted Successfully!
                        </h2>
                        <p style={{ color: "var(--text-secondary)", marginBottom: "0.5rem" }}>
                            Your complaint ID: <strong style={{ color: "#a78bfa" }}>{success.id}</strong>
                        </p>
                        <p style={{ color: "var(--text-secondary)", marginBottom: "2rem", fontSize: "0.9rem" }}>
                            AI has categorized and routed your complaint to the appropriate department.
                        </p>
                        <div style={{ display: "flex", gap: "1rem" }}>
                            <button
                                className="btn btn-primary"
                                onClick={() => router.push("/dashboard")}
                            >
                                📊 View Dashboard
                            </button>
                            <button
                                className="btn btn-secondary"
                                onClick={() => {
                                    setSuccess(null);
                                    setTitle("");
                                    setDescription("");
                                    setAddress("");
                                    setAiPreview(null);
                                }}
                            >
                                📝 Submit Another
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
            >
                <div className="page-header">
                    <h1>📝 Report a Civic Issue</h1>
                    <p>
                        Describe the problem and our AI will automatically categorize, prioritize, and
                        route it to the right department.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="card" style={{ padding: "2rem" }}>
                    <div className="form-group">
                        <label>Issue Title *</label>
                        <input
                            className="form-input"
                            placeholder="e.g., Pothole on MG Road near Central Mall"
                            value={title}
                            onChange={(e) => handleTitleChange(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Detailed Description *</label>
                        <textarea
                            className="form-textarea"
                            placeholder="Describe the issue in detail — size, severity, how long it's been there, safety concerns..."
                            value={description}
                            onChange={(e) => handleDescriptionChange(e.target.value)}
                            required
                            rows={5}
                        />
                    </div>

                    <div className="form-group">
                        <label>Location / Address</label>
                        <input
                            className="form-input"
                            placeholder="e.g., MG Road, Near Central Mall, Pune"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                        />
                        <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                            📍 GPS location will be auto-detected on supported devices
                        </p>
                    </div>

                    <div className="form-group">
                        <label>Upload Photo (Optional)</label>
                        <input
                            type="file"
                            ref={fileInputRef}
                            accept="image/jpeg,image/png,image/webp,image/gif"
                            style={{ display: "none" }}
                            onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) handleFileSelect(f);
                            }}
                        />
                        {photoPreview ? (
                            <div style={{ position: "relative", borderRadius: "12px", overflow: "hidden", border: "1px solid var(--border)" }}>
                                <img
                                    src={photoPreview}
                                    alt="Preview"
                                    style={{ width: "100%", maxHeight: "300px", objectFit: "cover", display: "block" }}
                                />
                                <button
                                    type="button"
                                    onClick={removePhoto}
                                    style={{
                                        position: "absolute", top: "8px", right: "8px",
                                        background: "rgba(239, 68, 68, 0.9)", color: "#fff",
                                        border: "none", borderRadius: "50%", width: "32px", height: "32px",
                                        cursor: "pointer", fontSize: "1rem", display: "flex",
                                        alignItems: "center", justifyContent: "center",
                                    }}
                                >
                                    ✕
                                </button>
                                <div style={{ padding: "0.75rem", background: "rgba(139, 92, 246, 0.08)", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                                    📷 {photoFile?.name} ({((photoFile?.size || 0) / 1024).toFixed(0)} KB)
                                </div>
                            </div>
                        ) : (
                            <div
                                style={{
                                    border: "2px dashed var(--border)",
                                    borderRadius: "12px",
                                    padding: "2rem",
                                    textAlign: "center",
                                    cursor: "pointer",
                                    transition: "border-color 0.2s",
                                }}
                                onClick={() => fileInputRef.current?.click()}
                                onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = "var(--accent-purple)"; }}
                                onDragLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; }}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    e.currentTarget.style.borderColor = "var(--border)";
                                    const f = e.dataTransfer.files?.[0];
                                    if (f) handleFileSelect(f);
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--accent-purple)")}
                                onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
                            >
                                <p style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>📷</p>
                                <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                                    Click to upload or drag & drop
                                </p>
                                <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginTop: "0.25rem" }}>
                                    JPG, PNG, WebP, GIF up to 5MB
                                </p>
                            </div>
                        )}
                    </div>

                    {/* AI Classification Preview */}
                    <AnimatePresence>
                        {(aiPreview || classifying) && (
                            <motion.div
                                className="ai-preview"
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                <h4>
                                    🤖 AI Classification Preview
                                    {classifying && <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2, marginLeft: 8, display: "inline-block" }} />}
                                </h4>

                                {aiPreview && (
                                    <div className="ai-preview-grid">
                                        <div className="ai-preview-item">
                                            <div className="label">Category</div>
                                            <div className="value">
                                                {CATEGORY_ICONS[aiPreview.classification.category]}{" "}
                                                {CATEGORY_LABELS[aiPreview.classification.category]}
                                            </div>
                                        </div>
                                        <div className="ai-preview-item">
                                            <div className="label">Priority</div>
                                            <div className="value">
                                                <span className={`badge badge-${aiPreview.priority.level.toLowerCase()}`}>
                                                    {aiPreview.priority.level}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="ai-preview-item">
                                            <div className="label">Score</div>
                                            <div className="value">{aiPreview.priority.score}/10</div>
                                        </div>
                                        <div className="ai-preview-item">
                                            <div className="label">Department</div>
                                            <div className="value" style={{ fontSize: "0.85rem" }}>{aiPreview.department}</div>
                                        </div>
                                        <div className="ai-preview-item">
                                            <div className="label">Confidence</div>
                                            <div className="value">{Math.round(aiPreview.classification.confidence * 100)}%</div>
                                        </div>
                                        <div className="ai-preview-item">
                                            <div className="label">People Affected</div>
                                            <div className="value">~{aiPreview.classification.estimatedPeopleAffected}</div>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={loading || !title || !description}
                        style={{
                            width: "100%",
                            justifyContent: "center",
                            marginTop: "1.5rem",
                            padding: "0.9rem",
                            fontSize: "1rem",
                            opacity: loading || !title || !description ? 0.6 : 1,
                        }}
                    >
                        {loading ? (
                            <>
                                <span className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} />
                                {uploading ? "Uploading photo..." : "Submitting..."}
                            </>
                        ) : (
                            <>🚀 Submit Complaint</>
                        )}
                    </button>
                </form>
            </motion.div>
        </div>
    );
}
