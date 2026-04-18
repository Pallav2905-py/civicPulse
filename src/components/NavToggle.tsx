"use client";

import { useState } from "react";

export function NavToggle() {
    const [open, setOpen] = useState(false);

    return (
        <button
            className="nav-toggle"
            onClick={() => {
                setOpen(!open);
                const links = document.getElementById("nav-links");
                if (links) {
                    links.classList.toggle("nav-open");
                }
            }}
            aria-label="Toggle navigation"
        >
            <span className={`hamburger ${open ? "open" : ""}`}>
                <span />
                <span />
                <span />
            </span>
        </button>
    );
}
