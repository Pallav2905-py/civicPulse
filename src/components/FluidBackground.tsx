"use client";

import { useEffect, useRef } from "react";

/**
 * FluidBackground Component
 * Renders an interactive, liquid-like particle system.
 * Creates a "gooey" or "metaball" effect where particles merge and flow.
 */
export function FluidBackground() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let width = (canvas.width = window.innerWidth);
        let height = (canvas.height = window.innerHeight);
        let animationFrameId: number;

        // Simulation params
        const particles: Particle[] = [];
        const particleCount = 40; // Fewer, larger blobs for better merging

        // Mouse state
        let mouse = { x: width / 2, y: height / 2 };
        let isMoving = false;

        class Particle {
            x: number;
            y: number;
            vx: number;
            vy: number;
            size: number;
            color: string;
            originalSize: number;

            constructor() {
                this.x = Math.random() * width;
                this.y = Math.random() * height;
                this.vx = (Math.random() - 0.5) * 0.5;
                this.vy = (Math.random() - 0.5) * 0.5;
                this.originalSize = Math.random() * 250 + 150; // Huge, soft blobs
                this.size = this.originalSize;

                // Colors: Soft, pastel gradients
                const colors = [
                    "rgba(167, 139, 250, 0.4)", // Purple
                    "rgba(96, 165, 250, 0.4)",  // Blue
                    "rgba(52, 211, 153, 0.3)",  // Green
                    "rgba(251, 113, 133, 0.3)"  // Rose
                ];
                this.color = colors[Math.floor(Math.random() * colors.length)];
            }

            update() {
                // Base movement
                this.x += this.vx;
                this.y += this.vy;

                // Interaction logic: Swirling / Stirring
                const dx = mouse.x - this.x;
                const dy = mouse.y - this.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const force = Math.max(0, 500 - distance) / 500; // Stronger force closer to mouse

                if (force > 0) {
                    // Gentle swirl + attraction
                    const angle = Math.atan2(dy, dx);
                    // Perpendicular force for swirl
                    const swirlX = Math.cos(angle - Math.PI / 2);
                    const swirlY = Math.sin(angle - Math.PI / 2);

                    this.vx += (dx * 0.0005) + (swirlX * 0.002);
                    this.vy += (dy * 0.0005) + (swirlY * 0.002);
                }

                // Boundary bounce
                if (this.x < -this.size) this.x = width + this.size;
                if (this.x > width + this.size) this.x = -this.size;
                if (this.y < -this.size) this.y = height + this.size;
                if (this.y > height + this.size) this.y = -this.size;

                // Friction to prevent infinite acceleration
                this.vx *= 0.99;
                this.vy *= 0.99;

                // Dynamic sizing based on speed (stretch effect)
                const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
                // this.size = this.originalSize * (1 + speed * 0.05); 
            }

            draw() {
                if (!ctx) return;
                ctx.beginPath();
                // Super soft radial gradient
                const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size);
                gradient.addColorStop(0, this.color);
                gradient.addColorStop(1, "rgba(255, 255, 255, 0)"); // Transparent edge

                ctx.fillStyle = gradient;
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.closePath();
            }
        }

        // Initialize particles
        for (let i = 0; i < particleCount; i++) {
            particles.push(new Particle());
        }

        const animate = () => {
            ctx.clearRect(0, 0, width, height);

            // Using 'hard-light' or 'overlay' for liquid blending
            // Then blur heavily to merge
            // ctx.filter = 'blur(60px)'; // Canvas filter API (modern browsers)

            // Since filters can be slow, let's use globalCompositeOperation
            ctx.globalCompositeOperation = "hard-light"; // Mixes colors vibrantly

            particles.forEach((p) => {
                p.update();
                p.draw();
            });

            // Reset
            ctx.globalCompositeOperation = "source-over";
            // ctx.filter = 'none';

            animationFrameId = requestAnimationFrame(animate);
        };

        animate();

        const handleResize = () => {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        };

        // Mouse Interaction
        const handleMouseMove = (e: MouseEvent) => {
            mouse.x = e.clientX;
            mouse.y = e.clientY;
            isMoving = true;
            // Reset movement flag after inactivity
            setTimeout(() => isMoving = false, 100);
        };

        // Touch Interaction
        const handleTouchMove = (e: TouchEvent) => {
            if (e.touches.length > 0) {
                mouse.x = e.touches[0].clientX;
                mouse.y = e.touches[0].clientY;
                isMoving = true;
            }
        };

        window.addEventListener("resize", handleResize);
        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("touchmove", handleTouchMove, { passive: false });
        window.addEventListener("touchstart", handleTouchMove, { passive: false });

        return () => {
            window.removeEventListener("resize", handleResize);
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("touchmove", handleTouchMove);
            window.removeEventListener("touchstart", handleTouchMove);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <div className="fluid-container">
            <canvas
                ref={canvasRef}
                style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    zIndex: -1,
                    pointerEvents: "none",
                    // CSS Filter for the "Gooey" liquid merging effect
                    filter: "blur(60px) contrast(1.5) brightness(1.2)",
                    // Transparency handled by particle alpha
                    opacity: 0.7,
                }}
            />
        </div>
    );
}
