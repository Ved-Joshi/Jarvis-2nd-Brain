"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const path = usePathname();
  const isDocs = path === "/" || path.startsWith("/doc");
  const isTasks = path.startsWith("/tasks");

  return (
    <div className="navbar">
      <div className="brand">
        <span className="logo">🛰️</span>
        <span>Mission Control</span>
      </div>
      <div className="nav-tabs">
        <Link className={`nav-tab ${isDocs ? "active" : ""}`} href="/">
          Docs
        </Link>
        <Link className={`nav-tab ${isTasks ? "active" : ""}`} href="/tasks">
          Tasks
        </Link>
      </div>
      <div className="nav-actions">
        <kbd className="kbd">⌘K</kbd>
      </div>
    </div>
  );
}
