import { useState, useEffect } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { useGlobalNotifications } from "@/hooks/useGlobalNotifications";
import {
  LayoutDashboard, Router, ScrollText, BarChart3, Shield, ShieldCheck, History,
  Menu, X, Users, Ghost, Settings, ShieldBan, LogOut,
  CreditCard, UserCheck, Sun, Moon,
} from "lucide-react";

// Har nav element'i uchun talab qilingan permission ham qo'shildi.
// super_admin har doim hammasini ko'radi.
const ALL_NAV = [
  { to: "/",            icon: LayoutDashboard, label: "Dashboard",       group: "Asosiy",      roles: ["admin", "manager", "operator"], perm: "dashboard.view" },
  { to: "/inside",      icon: UserCheck,       label: "Ichkarida",        group: "Asosiy",      roles: ["admin", "manager", "operator"], perm: "dashboard.view" },
  { to: "/devices",     icon: Router,          label: "Qurilmalar",       group: "Asosiy",      roles: ["admin", "manager", "operator"], perm: "devices.view" },
  { to: "/logs",        icon: ScrollText,      label: "Loglar",           group: "Ma'lumotlar", roles: ["admin", "manager", "operator"], perm: "logs.view" },
  { to: "/users",       icon: Users,           label: "Foydalanuvchilar", group: "Ma'lumotlar", roles: ["admin", "manager"],              perm: "users.read" },
  { to: "/blocked",     icon: ShieldBan,       label: "Bloklangan",       group: "Ma'lumotlar", roles: ["admin", "manager", "user"],      perm: "users.read" },
  { to: "/strangers",   icon: Ghost,           label: "Notanishlar",      group: "Ma'lumotlar", roles: ["admin", "manager"],              perm: "strangers.view" },
  { to: "/card-logs",   icon: CreditCard,      label: "ID Karta",         group: "Ma'lumotlar", roles: ["admin", "manager"],              perm: "card_logs.view" },
  { to: "/analytics",   icon: BarChart3,       label: "Statistika",       group: "Tahlil",      roles: ["admin", "manager"],              perm: "analytics.view" },
  { to: "/admin-users", icon: ShieldCheck,     label: "Admin userlar",    group: "Boshqaruv",   roles: ["admin"],                         perm: "admin_users.read" },
  { to: "/audit",       icon: History,         label: "Audit log",        group: "Boshqaruv",   roles: ["admin"],                         perm: "audit.view" },
  { to: "/settings",    icon: Settings,        label: "Sozlamalar",       group: "Boshqaruv",   roles: ["admin"],                         perm: "settings.view" },
] as const;

// Mobile bottom nav — 5 ta asosiy sahifa
const BOTTOM_NAV = ["/", "/inside", "/logs", "/users", "/analytics"] as const;

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { theme, toggle } = useTheme();

  // Permission filter — super_admin hammasini ko'radi, boshqalar permission bo'yicha
  const userPerms = new Set(user?.permissions ?? []);
  const isSuper = user?.role === "super_admin";
  const NAV = ALL_NAV.filter((n) => {
    if (!user) return false;
    if (isSuper) return true;
    if (n.perm && !userPerms.has(n.perm)) {
      // Permission yo'q bo'lsa-yu, lekin role mos kelsa (legacy env users) — ko'rsat
      return n.roles.includes(user.role as any);
    }
    return n.perm ? userPerms.has(n.perm) : n.roles.includes(user.role as any);
  });
  const allowedPaths = NAV.map((n) => n.to);

  // Global real-time notifications — har sahifada ishlaydi
  useGlobalNotifications();
  const bottomNav = NAV.filter((n) => BOTTOM_NAV.includes(n.to as any));

  useEffect(() => {
    if (!user) return;
    const path = location.pathname;
    const isAllowed = allowedPaths.some((p) =>
      p === "/" ? path === "/" : path === p || path.startsWith(p + "/")
    );
    if (!isAllowed) navigate("/blocked", { replace: true });
  }, [user, location.pathname]);

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const handleLogout = async () => {
    await signOut();
    navigate("/login", { replace: true });
  };

  const pageTitle = NAV.find((n) =>
    n.to === "/" ? location.pathname === "/" : location.pathname.startsWith(n.to)
  )?.label ?? "";

  const sidebarBg = theme === "dark" ? "#080d17" : "#0f172a";
  const sidebarBorder = theme === "dark" ? "#0d1526" : "#1e293b";

  return (
    <div className="min-h-screen bg-background flex">

      {/* ── Desktop sidebar ─────────────────────────────── */}
      <aside className="w-[240px] hidden lg:flex flex-col fixed inset-y-0 z-30 transition-colors duration-300"
        style={{ background: sidebarBg }}>
        {/* Logo */}
        <div className="h-[64px] flex items-center gap-3 px-5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #3b82f6, #818cf8)" }}>
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div className="leading-none">
            <span className="text-[13px] font-bold text-white tracking-tight">Face ID</span>
            <span className="block text-[10px] font-medium mt-0.5 text-slate-400">Monitoring</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 pt-2 overflow-y-auto custom-scrollbar">
          {["Asosiy", "Ma'lumotlar", "Tahlil"].map((group) => (
            <div key={group} className="mb-4">
              <p className="text-[10px] uppercase tracking-widest font-semibold px-3 mb-1.5 text-slate-500">
                {group}
              </p>
              {NAV.filter((n) => n.group === group).map((item) => (
                <NavLink key={item.to} to={item.to} end={item.to === "/"}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-150 mb-0.5"
                  style={({ isActive }) => ({
                    color: isActive ? "#ffffff" : "#94a3b8",
                    background: isActive ? "rgba(59,130,246,0.15)" : "transparent",
                  })}>
                  <item.icon className="w-4 h-4 flex-shrink-0" />
                  {item.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* Bottom: theme toggle + version */}
        <div className="px-4 py-4 space-y-2" style={{ borderTop: `1px solid ${sidebarBorder}` }}>
          <button onClick={toggle}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12px] font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-all">
            {theme === "dark"
              ? <Sun className="w-3.5 h-3.5 text-amber-400" />
              : <Moon className="w-3.5 h-3.5 text-slate-400" />}
            {theme === "dark" ? "Yorug' rejim" : "Qorong'u rejim"}
          </button>
          <p className="text-[10px] font-medium text-slate-600 px-3">Gate Monitor v2.0</p>
        </div>
      </aside>

      {/* ── Mobile overlay ──────────────────────────────── */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          onClick={() => setMobileOpen(false)} />
      )}

      {/* ── Mobile sidebar (slide-in) ────────────────────── */}
      <aside style={{ background: sidebarBg }}
        className={`lg:hidden fixed inset-y-0 left-0 w-[280px] z-50 flex flex-col transition-transform duration-300 ease-in-out ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}>
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-4 flex-shrink-0"
          style={{ borderBottom: `1px solid ${sidebarBorder}` }}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #3b82f6, #818cf8)" }}>
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-bold text-white">Face ID Monitor</span>
          </div>
          <button onClick={() => setMobileOpen(false)}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav with groups */}
        <nav className="flex-1 px-3 pt-3 overflow-y-auto custom-scrollbar">
          {["Asosiy", "Ma'lumotlar", "Tahlil"].map((group) => (
            <div key={group} className="mb-4">
              <p className="text-[10px] uppercase tracking-widest font-semibold px-3 mb-1.5 text-slate-500">
                {group}
              </p>
              {NAV.filter((n) => n.group === group).map((item) => (
                <NavLink key={item.to} to={item.to} end={item.to === "/"}
                  className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-150 mb-1"
                  style={({ isActive }) => ({
                    color: isActive ? "#ffffff" : "#94a3b8",
                    background: isActive ? "rgba(59,130,246,0.2)" : "transparent",
                  })}>
                  <item.icon className="w-4.5 h-4.5 flex-shrink-0" />
                  {item.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* Footer: user + theme + logout */}
        <div className="px-4 py-4 space-y-2 flex-shrink-0"
          style={{ borderTop: `1px solid ${sidebarBorder}` }}>
          {user && (
            <div className="px-3 py-2 rounded-xl bg-white/5 mb-2">
              <p className="text-xs font-semibold text-white">{user.username}</p>
              <p className="text-[10px] text-slate-400 capitalize">{user.role}</p>
            </div>
          )}
          <button onClick={toggle}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-all">
            {theme === "dark"
              ? <Sun className="w-4 h-4 text-amber-400" />
              : <Moon className="w-4 h-4 text-slate-300" />}
            {theme === "dark" ? "Yorug' rejim" : "Qorong'u rejim"}
          </button>
          <button onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-all">
            <LogOut className="w-4 h-4" />
            Chiqish
          </button>
        </div>
      </aside>

      {/* ── Main area ───────────────────────────────────── */}
      <div className="flex-1 lg:ml-[240px] flex flex-col min-h-screen">

        {/* Top bar */}
        <header className="h-14 lg:h-[64px] border-b border-border/60 bg-background/80 backdrop-blur-md sticky top-0 z-20 flex items-center px-4 lg:px-6 gap-3">
          <button className="lg:hidden w-9 h-9 flex items-center justify-center rounded-xl hover:bg-muted transition-colors"
            onClick={() => setMobileOpen(true)}>
            <Menu className="w-5 h-5 text-muted-foreground" />
          </button>
          <h2 className="text-sm font-semibold text-foreground">{pageTitle}</h2>

          <div className="ml-auto flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/60 px-2.5 py-1 rounded-full">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 pulse-dot" />
              <span className="hidden sm:inline">Live</span>
            </div>

            {/* Theme toggle (desktop header) */}
            <button onClick={toggle}
              className="hidden lg:flex w-8 h-8 items-center justify-center rounded-lg hover:bg-muted transition-colors"
              title={theme === "dark" ? "Yorug' rejim" : "Qorong'u rejim"}>
              {theme === "dark"
                ? <Sun className="w-4 h-4 text-amber-400" />
                : <Moon className="w-4 h-4 text-muted-foreground" />}
            </button>

            {user && (
              <>
                <span className="hidden sm:inline text-xs text-muted-foreground px-2">
                  {user.username}
                  <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-semibold uppercase">
                    {user.role}
                  </span>
                </span>
                <button onClick={handleLogout}
                  className="h-8 px-3 rounded-lg text-xs font-semibold bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-500/20 flex items-center gap-1.5 transition-colors"
                  title="Chiqish">
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Chiqish</span>
                </button>
              </>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto custom-scrollbar pb-20 lg:pb-0">
          <Outlet />
        </main>

        {/* ── Mobile bottom nav ────────────────────────── */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 border-t border-border/60 bg-background/90 backdrop-blur-md flex items-stretch h-16 safe-area-pb">
          {bottomNav.map((item) => {
            const isActive = item.to === "/"
              ? location.pathname === "/"
              : location.pathname.startsWith(item.to);
            return (
              <NavLink key={item.to} to={item.to} end={item.to === "/"}
                className="flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors"
                style={{ color: isActive ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))" }}>
                <item.icon className="w-5 h-5" />
                <span className="text-[9px] font-semibold">{item.label}</span>
              </NavLink>
            );
          })}
          {/* Hamburger for full menu */}
          <button onClick={() => setMobileOpen(true)}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 text-muted-foreground transition-colors">
            <Menu className="w-5 h-5" />
            <span className="text-[9px] font-semibold">Ko'proq</span>
          </button>
        </nav>
      </div>
    </div>
  );
}
