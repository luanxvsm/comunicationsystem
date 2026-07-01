"use client";
// src/components/Sidebar.tsx
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Dashboard", icon: "📊" },
  { href: "/messages", label: "Mensagens", icon: "✉️" },
  { href: "/templates", label: "Templates", icon: "📋" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">📡</div>
        <div>
          <div className="sidebar-logo-text">CommHub</div>
          <div className="sidebar-logo-sub">Multi-Canal</div>
        </div>
      </div>

      <nav className="sidebar-nav" aria-label="Navegação principal">
        <p className="sidebar-section-label">Principal</p>
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            id={`nav-${item.label.toLowerCase()}`}
            className={`nav-link ${pathname === item.href ? "active" : ""}`}
          >
            <span className="nav-link-icon">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>

      <div style={{ marginTop: "auto", padding: "0.75rem", borderTop: "1px solid var(--border-card)" }}>
        <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", textAlign: "center" }}>
          CommHub v1.0
        </p>
      </div>
    </aside>
  );
}
