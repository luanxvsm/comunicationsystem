"use client";
// src/components/Sidebar.tsx
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "@/components/ThemeProvider";

const navItems = [
  { href: "/", label: "Dashboard", icon: "📊" },
  { href: "/messages", label: "Mensagens", icon: "✉️" },
  { href: "/templates", label: "Templates", icon: "📋" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();

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

      <div className="sidebar-footer">
        <button
          id="theme-toggle-btn"
          className="theme-toggle-btn"
          onClick={toggleTheme}
          aria-label={theme === "dark" ? "Ativar tema claro" : "Ativar tema escuro"}
          title={theme === "dark" ? "Tema claro" : "Tema escuro"}
        >
          <span className="theme-toggle-track">
            <span className="theme-toggle-thumb">
              {theme === "dark" ? "🌙" : "☀️"}
            </span>
          </span>
          <span className="theme-toggle-label">
            {theme === "dark" ? "Tema escuro" : "Tema claro"}
          </span>
        </button>

        <p className="sidebar-version">CommHub v1.0</p>
      </div>
    </aside>
  );
}
