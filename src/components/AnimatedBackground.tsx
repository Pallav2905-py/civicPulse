"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useEffect, useState } from "react";

export function AnimatedBackground() {
    const [mounted, setMounted] = useState(false);

    // Mouse position state for spring animation
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    // Smooth spring animation for fluid movement
    const springConfig = { damping: 25, stiffness: 150 };
    const springX = useSpring(mouseX, springConfig);
    const springY = useSpring(mouseY, springConfig);

    // Parallax transforms for different layers
    // Layer 1 moves opposite to mouse
    const x1 = useTransform(springX, [-0.5, 0.5], [-50, 50]);
    const y1 = useTransform(springY, [-0.5, 0.5], [-50, 50]);

    // Layer 2 moves more drastically
    const x2 = useTransform(springX, [-0.5, 0.5], [80, -80]);
    const y2 = useTransform(springY, [-0.5, 0.5], [80, -80]);

    useEffect(() => {
        setMounted(true);

        const handleMouseMove = (e: MouseEvent) => {
            // Normalize mouse position to range -0.5 to 0.5
            const { innerWidth, innerHeight } = window;
            const x = (e.clientX / innerWidth) - 0.5;
            const y = (e.clientY / innerHeight) - 0.5;

            mouseX.set(x);
            mouseY.set(y);
        };

        window.addEventListener("mousemove", handleMouseMove);
        return () => window.removeEventListener("mousemove", handleMouseMove);
    }, []);

    if (!mounted) return null;

    return (
        <div className="animated-background">
            <motion.div
                className="orb orb-1"
                style={{ x: x1, y: y1 }}
                animate={{
                    scale: [1, 1.1, 1],
                }}
                transition={{
                    scale: { duration: 10, repeat: Infinity, ease: "easeInOut" }
                }}
            />
            <motion.div
                className="orb orb-2"
                style={{ x: x2, y: y2 }}
                animate={{
                    scale: [1, 1.2, 1],
                }}
                transition={{
                    scale: { duration: 15, repeat: Infinity, ease: "easeInOut" }
                }}
            />
            <div className="grid-overlay" />
        </div>
    );
}
