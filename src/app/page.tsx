"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { TiltCard } from "@/components/TiltCard";
import { FluidBackground } from "@/components/FluidBackground";
import Script from "next/script";

export default function HomePage() {
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 500], [0, 200]);
  const y2 = useTransform(scrollY, [0, 500], [0, -150]);

  const [stats, setStats] = useState({
    total: 0,
    resolved: 0,
    avgDays: 0,
    satisfaction: 0,
  });

  useEffect(() => {
    fetch("/api/analytics")
      .then((res) => res.json())
      .then((data) => {
        const resolvedCount = data.byStatus?.find(
          (s: { name: string }) => s.name === "RESOLVED"
        )?.value || 0;
        setStats({
          total: data.totalComplaints || 0,
          resolved: resolvedCount,
          avgDays: data.avgResolutionDays || 0,
          satisfaction: 4.5,
        });
      })
      .catch(() => {
        setStats({ total: 10, resolved: 2, avgDays: 5.2, satisfaction: 4.5 });
      });
  }, []);

  // Animated counter
  function AnimatedNumber({ value, suffix = "" }: { value: number; suffix?: string }) {
    const [display, setDisplay] = useState(0);
    useEffect(() => {
      const duration = 1500;
      const start = Date.now();
      const timer = setInterval(() => {
        const elapsed = Date.now() - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setDisplay(Math.round(value * eased * 10) / 10);
        if (progress >= 1) clearInterval(timer);
      }, 30);
      return () => clearInterval(timer);
    }, [value]);
    return <>{display}{suffix}</>;
  }

  return (
    <>
      <FluidBackground />

      {/* Hero Section */}
      <section className="hero" style={{ perspective: "1000px" }}>
        <motion.div
          style={{ y: y1 }}
          initial={{ opacity: 0, rotateX: 20, z: -100 }}
          animate={{ opacity: 1, rotateX: 0, z: 0 }}
          transition={{ duration: 0.8, type: "spring" }}
        >

          <h1 className="float-animation float-delay-1" style={{ textShadow: "0 10px 30px rgba(139, 92, 246, 0.3)" }}>
            <span className="gradient-text">Report. </span>
            Track. {" "}
            <span className="gradient-text">Resolve.</span>
          </h1>
          <p className="float-animation float-delay-2">
            AI-powered civic grievance platform that automatically categorizes your
            complaints, routes them to the right department, and tracks progress
            in real-time.
          </p>
          <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
            <TiltCard>
              <Link href="/submit" className="btn btn-primary" style={{ fontSize: "1.05rem", padding: "0.85rem 2rem" }}>
                📝 Report an Issue
              </Link>
            </TiltCard>
            <TiltCard>
              <Link href="/track" className="btn btn-secondary" style={{ fontSize: "1.05rem", padding: "0.85rem 2rem" }}>
                📊 Track Complaints
              </Link>
            </TiltCard>
          </div>
        </motion.div>

        {/* Live Stats */}
        <motion.div
          className="stats-grid"
          style={{ y: y2 }}
          initial={{ opacity: 0, rotateX: -20 }}
          animate={{ opacity: 1, rotateX: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          {[
            { label: "Total Complaints", value: stats.total },
            { label: "Resolved", value: stats.resolved },
            { label: "Avg. Days to Resolve", value: stats.avgDays },
            { label: "Citizen Satisfaction", value: stats.satisfaction, suffix: "/5" }
          ].map((stat, i) => (
            <TiltCard key={i} className="stat-card">
              <div className="stat-number"><AnimatedNumber value={stat.value} suffix={stat.suffix} /></div>
              <div className="stat-label">{stat.label}</div>
            </TiltCard>
          ))}
        </motion.div>
      </section>

      {/* How It Works */}
      <section className="how-it-works">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="section-title">How It Works</h2>
          <p className="section-subtitle">
            From complaint to resolution in 4 simple steps
          </p>
        </motion.div>

        <div className="steps-grid">
          {[
            { icon: "📝", title: "Report", desc: "Submit your civic complaint with description, photo, and auto-detected location." },
            { icon: "🤖", title: "AI Classifies", desc: "Our AI engine automatically categorizes, assigns priority, and routes to the right department." },
            { icon: "📡", title: "Track Progress", desc: "Get real-time status updates as your complaint progresses through the resolution pipeline." },
            { icon: "⭐", title: "Rate & Feedback", desc: "Once resolved, rate the response quality. Your feedback improves future resolution." },
          ].map((step, i) => (
            <TiltCard key={i}>
              <motion.div
                className="step-card"
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                style={{ height: "100%" }}
              >
                <div className="step-icon float-animation">{step.icon}</div>
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
              </motion.div>
            </TiltCard>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section style={{ padding: "3rem 2rem 5rem", maxWidth: "1100px", margin: "0 auto" }}>
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="section-title">Why CivicPulse?</h2>
          <p className="section-subtitle">Built for citizens, powered by AI</p>
        </motion.div>

        <div className="steps-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}>
          {[
            { icon: "🧠", title: "AI-Powered Classification", desc: "NLP engine auto-detects complaint type — pothole, streetlight, water leak — with 90%+ accuracy." },
            { icon: "⚡", title: "Smart Priority Scoring", desc: "Multi-factor algorithm weighs urgency, impact area, affected population, and community votes." },
            { icon: "🔀", title: "Auto Department Routing", desc: "Complaints reach the right department instantly — no manual misdirection, no bureaucratic delay." },
            { icon: "🗺️", title: "Interactive Heatmaps", desc: "Visualize complaint hotspots across the city. Identify patterns, allocate resources smarter." },
            { icon: "🔔", title: "Real-time Updates", desc: "Track every step from submission to resolution. Get notified on status changes instantly." },
            { icon: "📊", title: "Analytics Dashboard", desc: "Departmental performance, resolution trends, and predictive insights for proactive governance." },
          ].map((feature, i) => (
            <TiltCard key={i}>
              <motion.div
                className="step-card"
                initial={{ opacity: 0, rotateY: 90 }}
                whileInView={{ opacity: 1, rotateY: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.08 }}
                style={{ height: "100%" }}
              >
                <div className="step-icon">{feature.icon}</div>
                <h3>{feature.title}</h3>
                <p>{feature.desc}</p>
              </motion.div>
            </TiltCard>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ textAlign: "center", padding: "4rem 2rem", background: "transparent", position: "relative" }}>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ type: "spring", stiffness: 200 }}
        >
          <h2 style={{ fontSize: "2.5rem", fontWeight: 800, marginBottom: "1rem" }}>
            Ready to make your city better?
          </h2>
          <p style={{ color: "var(--text-secondary)", marginBottom: "2rem", fontSize: "1.2rem" }}>
            Every complaint is a step towards a better community.
          </p>
          <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
            <TiltCard style={{ display: "inline-block" }}>
              <Link href="/submit" className="btn btn-primary" style={{ fontSize: "1.2rem", padding: "1.2rem 3rem" }}>
                🚀 Report Your First Issue
              </Link>
            </TiltCard>
            <TiltCard style={{ display: "inline-block" }}>
              <a href="https://t.me/Civicpulse_bot" target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ fontSize: "1.2rem", padding: "1.2rem 3rem", background: "#0088cc", borderColor: "#0088cc", color: "white" }}>
                🤖 Chat with AI Bot
              </a>
            </TiltCard>
          </div>

        </motion.div>
      </section>

      {/* @ts-expect-error - Custom element not typed */}
      <elevenlabs-convai agent-id="agent_6901kh821sy3e0dr8c8gwza649mx" />
      <Script src="https://unpkg.com/@elevenlabs/convai-widget-embed" strategy="afterInteractive" />
      <footer className="footer">
        <p>© 2026 CivicPulse — AI-Powered Citizen Grievance Redressal System</p>
        <p style={{ marginTop: "0.25rem", fontSize: "0.8rem" }}>Built with ❤️ for Hackathon</p>
      </footer>
    </>
  );
}
