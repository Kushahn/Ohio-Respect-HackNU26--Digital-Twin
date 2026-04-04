import { NavLink } from "react-router-dom";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

const THEME_KEY = "rdt-theme";

function applyTheme(theme: "dark" | "light") {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem(THEME_KEY, theme);
}

interface AppLayoutProps {
  children: React.ReactNode;
  isConnected: boolean;
  isReconnecting: boolean;
}

export default function AppLayout({ children, isConnected, isReconnecting }: AppLayoutProps) {
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    if (typeof localStorage === "undefined") return "dark";
    const s = localStorage.getItem(THEME_KEY);
    return s === "light" ? "light" : "dark";
  });

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const statusLabel = !isConnected
    ? isReconnecting
      ? "Восстановление связи…"
      : "Нет связи с сервером"
    : "Связь установлена";

  const statusClass = isConnected ? "status-normal" : isReconnecting ? "status-warning" : "status-critical";

  return (
    <div className="app-shell">
      <header className="header-nav">
        <div className="header-brand">
          <h1 className="header-title">Цифровой двойник локомотива</h1>
          <p className="header-sub">КТЖ · телеметрия и индекс состояния</p>
        </div>
        <nav className="nav-links" aria-label="Основная навигация">
          <NavLink to="/cab" className={({ isActive }) => (isActive ? "active" : "")}>
            Кабина
          </NavLink>
          <NavLink to="/dispatch" className={({ isActive }) => (isActive ? "active" : "")}>
            Диспетчер
          </NavLink>
        </nav>
        <div className="header-actions">
          <span className={`status-badge ${statusClass}`} title={statusLabel}>
            {statusLabel}
          </span>
          <button
            type="button"
            className="theme-toggle"
            aria-label={theme === "dark" ? "Светлая тема" : "Тёмная тема"}
            onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </header>
      <main className="app-main">{children}</main>
    </div>
  );
}
