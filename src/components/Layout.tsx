import { useState, useEffect } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
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
  Settings,
  ShieldBan,
  LogOut,
} from "lucide-react";

const ALL_NAV = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard", group: "Asosiy", roles: ["admin"] },
  { to: "/devices", icon: Router, label: "Qurilmalar", group: "Asosiy", roles: ["admin"] },
  { to: "/logs", icon: ScrollText, label: "Loglar", group: "Ma'lumotlar", roles: ["admin"] },
  { to: "/users", icon: Users, label: "Foydalanuvchilar", group: "Ma'lumotlar", roles: ["admin"] },
  { to: "/blocked", icon: ShieldBan, label: "Bloklangan", group: "Ma'lumotlar", roles: ["admin", "user"] },
  { to: "/strangers", icon: Ghost, label: "Notanishlar", group: "Ma'lumotlar", roles: ["admin"] },
  { to: "/analytics", icon: BarChart3, label: "Statistika", group: "Tahlil", roles: ["admin"] },
  { to: "/settings", icon: Settings, label: "Sozlamalar", group: "Tahlil", roles: ["admin"] },
] as const;

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const NAV = ALL_NAV.filter((n) => !user || n.roles.includes(user.role as any));
  const allowedPaths = NAV.map((n) => n.to);

  // "user" rolega ruxsat berilmagan sahifaga kirsa — Bloklangan sahifaga yo'naltirish
  useEffect(() => {
    if (!user) return;
    const path = location.pathname;
    const isAllowed = allowedPaths.some((p) =>
      p === "/" ? path === "/" : path === p || path.startsWith(p + "/")
    );
    if (!isAllowed) {
      navigate("/blocked", { replace: true });
    }
  }, [user, location.pathname, allowedPaths, navigate]);

  const handleLogout = async () => {
    await signOut();
    navigate("/login", { replace: true });
  };

  const pageTitle =
    NAV.find((n) => (n.to === "/" ? location.pathname === "/" : location.pathname.startsWith(n.to)))
      ?.label ?? "";

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar - desktop */}
      <aside className="w-[240px] hidden lg:flex flex-col fixed inset-y-0 z-30" style={{ background: "#0f172a" }}>
        {/* Logo */}
        <div className="h-[64px] flex items-center gap-3 px-5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #3b82f6, #818cf8)" }}>
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div className="leading-none">
            <span className="text-[13px] font-bold text-white tracking-tight">Face ID</span>
            <span className="block text-[10px] font-medium mt-0.5" style={{ color: "#94a3b8" }}>
              Monitoring
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 pt-2 space-y-0.5 overflow-y-auto custom-scrollbar">
          {["Asosiy", "Ma'lumotlar", "Tahlil"].map((group) => (
            <div key={group} className="mb-3">
              <p className="text-[10px] uppercase tracking-widest font-semibold px-3 mb-1.5" style={{ color: "#475569" }}>
                {group}
              </p>
              {NAV.filter((n) => n.group === group).map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/"}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-150 ${
                      isActive
                        ? "text-white"
                        : "hover:text-white"
                    }`
                  }
                  style={({ isActive }) => ({
                    color: isActive ? "#ffffff" : "#94a3b8",
                    background: isActive ? "rgba(59,130,246,0.15)" : "transparent",
                  })}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="px-4 py-4" style={{ borderTop: "1px solid #1e293b" }}>
          <p className="text-[10px] font-medium" style={{ color: "#475569" }}>
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
        style={{ background: "#0f172a" }}
        className={`lg:hidden fixed inset-y-0 left-0 w-[260px] z-50 transition-transform duration-200 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="h-14 flex items-center justify-between px-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ background: "linear-gradient(135deg, #3b82f6, #818cf8)" }}>
              <Shield className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-bold text-white">Face ID</span>
          </div>
          <button onClick={() => setMobileOpen(false)} style={{ color: "#94a3b8" }}>
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
                `flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all`
              }
              style={({ isActive }) => ({
                color: isActive ? "#ffffff" : "#94a3b8",
                background: isActive ? "rgba(59,130,246,0.15)" : "transparent",
              })}
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
            {user && (
              <>
                <span className="hidden sm:inline text-xs text-muted-foreground px-2">
                  {user.username}
                  <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-semibold uppercase">
                    {user.role}
                  </span>
                </span>
                <button onClick={handleLogout}
                  className="h-8 px-3 rounded-lg text-xs font-semibold bg-rose-50 text-rose-600 hover:bg-rose-100 flex items-center gap-1.5"
                  title="Chiqish">
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Chiqish</span>
                </button>
              </>
            )}
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
