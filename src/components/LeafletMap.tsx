"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Complaint, CATEGORY_ICONS, CATEGORY_LABELS, PRIORITY_COLORS } from "@/lib/types";

// Fix default marker icon path issue in Next.js/webpack
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

function getPriorityColor(priority: string): string {
    return PRIORITY_COLORS[priority as keyof typeof PRIORITY_COLORS] || "#8b5cf6";
}

function createCustomIcon(priority: string): L.DivIcon {
    const color = getPriorityColor(priority);
    return L.divIcon({
        className: "custom-marker",
        html: `
      <div style="
        width: 28px;
        height: 28px;
        border-radius: 50% 50% 50% 0;
        background: ${color};
        transform: rotate(-45deg);
        border: 2px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.4);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          transform: rotate(45deg);
          font-size: 12px;
          color: white;
          font-weight: bold;
        ">!</div>
      </div>
    `,
        iconSize: [28, 36],
        iconAnchor: [14, 36],
        popupAnchor: [0, -36],
    });
}

interface LeafletMapProps {
    complaints: Complaint[];
}

export default function LeafletMap({ complaints }: LeafletMapProps) {
    const mapRef = useRef<L.Map | null>(null);
    const markersRef = useRef<L.LayerGroup | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Initialize map once
    useEffect(() => {
        if (!containerRef.current || mapRef.current) return;

        const map = L.map(containerRef.current, {
            center: [18.5204, 73.8567], // Pune center
            zoom: 13,
            zoomControl: true,
            scrollWheelZoom: true,
        });

        // Dark theme map tiles
        L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
            attribution: '&copy; <a href="https://www.openstreetmap.org/">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
            maxZoom: 19,
        }).addTo(map);

        mapRef.current = map;
        markersRef.current = L.layerGroup().addTo(map);

        return () => {
            map.remove();
            mapRef.current = null;
        };
    }, []);

    // Update markers when complaints change
    useEffect(() => {
        if (!mapRef.current || !markersRef.current) return;

        markersRef.current.clearLayers();

        complaints.forEach((complaint) => {
            const icon = createCustomIcon(complaint.priority);
            const categoryLabel = CATEGORY_LABELS[complaint.category] || complaint.category;
            const categoryIcon = CATEGORY_ICONS[complaint.category] || "📋";

            const statusColors: Record<string, string> = {
                SUBMITTED: "#8b5cf6",
                ASSIGNED: "#3b82f6",
                IN_PROGRESS: "#f59e0b",
                RESOLVED: "#22c55e",
                CLOSED: "#6b7280",
            };
            const statusColor = statusColors[complaint.status] || "#8b5cf6";

            const popup = L.popup({
                className: "dark-popup",
                maxWidth: 280,
            }).setContent(`
        <div style="
          font-family: 'Inter', sans-serif;
          padding: 4px;
        ">
          <h4 style="
            font-size: 0.9rem;
            font-weight: 700;
            margin: 0 0 8px 0;
            color: #e6edf3;
            line-height: 1.3;
          ">${categoryIcon} ${complaint.title}</h4>
          
          <div style="display: flex; gap: 6px; margin-bottom: 8px; flex-wrap: wrap;">
            <span style="
              background: ${getPriorityColor(complaint.priority)}22;
              color: ${getPriorityColor(complaint.priority)};
              border: 1px solid ${getPriorityColor(complaint.priority)}44;
              padding: 2px 8px;
              border-radius: 4px;
              font-size: 0.7rem;
              font-weight: 600;
            ">${complaint.priority}</span>
            <span style="
              background: ${statusColor}22;
              color: ${statusColor};
              border: 1px solid ${statusColor}44;
              padding: 2px 8px;
              border-radius: 4px;
              font-size: 0.7rem;
              font-weight: 600;
            ">${complaint.status.replace("_", " ")}</span>
          </div>

          <p style="
            font-size: 0.8rem;
            color: #8b949e;
            margin: 0 0 6px 0;
            line-height: 1.4;
          ">${complaint.description.slice(0, 120)}${complaint.description.length > 120 ? "..." : ""}</p>

          <div style="
            font-size: 0.75rem;
            color: #6b7280;
            display: flex;
            justify-content: space-between;
            border-top: 1px solid #2a3050;
            padding-top: 6px;
            margin-top: 4px;
          ">
            <span>📍 ${complaint.address.slice(0, 30)}</span>
            <span>▲ ${complaint.upvoteCount}</span>
          </div>
          
          <a href="/complaint/${complaint.id}" style="
            display: block;
            text-align: center;
            margin-top: 8px;
            padding: 6px;
            background: rgba(139, 92, 246, 0.15);
            color: #a78bfa;
            border-radius: 6px;
            font-size: 0.8rem;
            font-weight: 600;
            text-decoration: none;
          ">View Details →</a>
        </div>
      `);

            L.marker([complaint.latitude, complaint.longitude], { icon })
                .bindPopup(popup)
                .addTo(markersRef.current!);
        });

        // Fit bounds if there are markers
        if (complaints.length > 0) {
            const bounds = L.latLngBounds(
                complaints.map((c) => [c.latitude, c.longitude] as [number, number])
            );
            mapRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
        }
    }, [complaints]);

    return (
        <div
            ref={containerRef}
            style={{
                height: "500px",
                borderRadius: "16px",
                overflow: "hidden",
                border: "1px solid var(--border)",
            }}
        />
    );
}
