"use client";

interface StreetViewProps {
    latitude: number;
    longitude: number;
    width?: string | number;
    height?: string | number;
}

export default function StreetView({
    latitude,
    longitude,
    width = "100%",
    height = 450,
}: StreetViewProps) {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
        return (
            <div 
                style={{ 
                    width, 
                    height, 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center", 
                    background: "rgba(139, 92, 246, 0.05)",
                    borderRadius: "12px",
                    border: "1px solid var(--border)",
                    color: "var(--text-muted)",
                    fontSize: "0.9rem",
                    textAlign: "center",
                    padding: "2rem"
                }}
            >
                <div style={{ maxWidth: "300px" }}>
                    <p style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>🗺️</p>
                    <p>Google Maps API key missing. Please add <code>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> to your .env file to enable Street View.</p>
                </div>
            </div>
        );
    }

    const src = `https://www.google.com/maps/embed/v1/streetview?key=${apiKey}&location=${latitude},${longitude}&heading=230&pitch=0&fov=90`;

    return (
        <div style={{ borderRadius: "12px", overflow: "hidden", border: "1px solid var(--border)", background: "var(--bg-card)" }}>
            <iframe
                width={width}
                height={height}
                style={{ border: 0, display: "block" }}
                loading="lazy"
                allowFullScreen
                src={src}
            />
            <div style={{ padding: "0.5rem 0.75rem", background: "rgba(139, 92, 246, 0.08)", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                📍 Street View Context
            </div>
        </div>
    );
}
