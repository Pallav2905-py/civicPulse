"use client";

import { AuthNav } from "./AuthNav";
import Link from "next/link";
import { NavToggle } from "./NavToggle";

export function Navbar() {
    return (
        <nav className="navbar">
            <Link href="/" className="nav-logo">
                ⚡ <span>CivicPulse</span>
            </Link>
            <NavToggle />
            <ul className="nav-links" id="nav-links">
                <li><Link href="/">Home</Link></li>
                <li><Link href="/submit">Report Issue</Link></li>
                <li><Link href="/map">🗺️ Map</Link></li>
                <li><Link href="/sentiment">💬 Sentiment</Link></li>
                <li><Link href="/dashboard">My Complaints</Link></li>
                <li><Link href="/admin">Admin Panel</Link></li>
                <AuthNav />
            </ul>
        </nav>
    );
}
