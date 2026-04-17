import { useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Router,
  ScrollText,
  BarChart3,
  Shield,
  Menu,
  X,
  Users,
  Ghost,
} from "lucide-react";

const NAV = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard", group: "Asosiy" },
  { to: "/devices", icon: Router, label: "Qurilmalar", group: "Asosiy" },
  { to: "/logs", icon: ScrollText, label: "Loglar", group: "Ma'lumotlar" },
  { to: "/users", icon: Users, label: "Foydalanuvchilar", group: "Ma'lumotlar" },
  { to: "/strangers", icon: Ghost, label: "Notanishlar", group: "Ma'lumotlar" },
  { to: "/analytics", icon: BarChart3, label: "Statistika", group: "Tahlil" },
] as const;

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const pageTitle =
    NAV.find((n) => (n.to === "/" ? location.pathname === "/" : location.pathname.startsWith(n.to)))
      ?.label ?? "Dashboard";

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar - desktop */}
      <aside className="w-[240px] bg-sidebar-background text-sidebar-foreground hidden lg:flex flex-col fixed inset-y-0 z-30">
        {/* Logo */}
        <div className="h-[64px] flex items-center gap-3 px-5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sidebar-primary to-indigo-400 flex items-center justify-center shadow-lg shadow-sidebar-primary/20">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div className="leading-none">
            <span className="text-[13px] font-bold text-white tracking-tight">Face ID</span>
            <span className="block text-[10px] text-sidebar-foreground/50 font-medium mt-0.5">
              Monitoring
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 pt-2 space-y-0.5 overflow-y-auto custom-scrollbar">
          {["Asosiy", "Ma'lumotlar", "Tahlil"].map((group) => (
            <div key={group} className="mb-3">
              <p className="text-[10px] uppercase tracking-widest text-white/30 font-semibold px-3 mb-1.5">
                {group}
              </p>
              {NAV.filter((n) => n.group === group).map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/"}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 ${
                      isActive
                        ? "bg-white/10 text-white shadow-sm"
                        : "text-white/60 hover:text-white hover:bg-white/[0.06]"
                    }`
                  }
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="px-4 py-4 border-t border-white/[0.06]">
          <p className="text-[10px] text-white/25 font-medium">
            Gate Monitor v2.0
          </p>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`lg:hidden fixed inset-y-0 left-0 w-[260px] bg-sidebar-background text-sidebar-foreground z-50 transition-transform duration-200 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="h-14 flex items-center justify-between px-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-gradient-to-br from-sidebar-primary to-indigo-400 flex items-center justify-center">
              <Shield className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-bold text-white">Face ID</span>
          </div>
          <button onClick={() => setMobileOpen(false)} className="text-sidebar-foreground/50">
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="px-3 pt-1 space-y-0.5">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? "bg-white/10 text-white"
                    : "text-white/60 hover:text-white hover:bg-white/[0.06]"
                }`
              }
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main area */}
      <div className="flex-1 lg:ml-[240px] flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="h-14 lg:h-[64px] border-b border-border/60 bg-white/70 backdrop-blur-md sticky top-0 z-20 flex items-center px-4 lg:px-6 gap-3">
          <button
            className="lg:hidden w-8 h-8 flex items-center justify-center rounded-md hover:bg-muted transition-colors"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="w-[18px] h-[18px] text-muted-foreground" />
          </button>
          <h2 className="text-sm font-semibold text-foreground">{pageTitle}</h2>

          <div className="ml-auto flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/60 px-2.5 py-1 rounded-full">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 pulse-dot" />
              Live
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto custom-scrollbar">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
