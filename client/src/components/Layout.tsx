import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { ROLES, type UserRole } from "@/lib/data";
import { useRbacPerms, canView } from "@/hooks/useRbacPerms";
import {
  ChevronDown, ChevronRight, Activity, Users, Shield, Settings, LogOut,
  Radio, PlayCircle, AlertTriangle, Navigation, BookOpen,
  Moon, Sun, SunMoon, Menu, X, PanelLeftClose, PanelLeftOpen,
  Bell, BellRing, CheckCheck, ExternalLink, TrendingUp, HelpCircle,
  LayoutDashboard, Plane, Zap, Wrench, HeartPulse, Bot, Briefcase, Bug, UserPlus, Telescope,
} from "lucide-react";
import EmergencyButton from "@/components/EmergencyButton";
import HelpDrawer from "@/components/HelpDrawer";
import BugReportModal from "@/components/BugReportModal";
import { FEATURES } from "@/lib/config";

// ─── Types ───────────────────────────────────────────────────────────────────
interface AppNotification {
  id: number;
  type: string;
  title: string;
  body: string;
  taskRef: string | null;
  taskId: number | null;
  readAt: string | null;
  createdAt: string;
}

function fmtAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1)  return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ─── Notification Bell ────────────────────────────────────────────────────────
function NotificationBell({ role }: { role: UserRole }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const { data: notifications = [] } = useQuery<AppNotification[]>({
    queryKey: ["/api/notifications"],
    refetchInterval: 15_000,
  });

  const unread = notifications.filter(n => !n.readAt);
  const hasUnread = unread.length > 0;

  const readOneMutation = useMutation({
    mutationFn: (id: number) => apiRequest("POST", `/api/notifications/${id}/read`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/notifications"] }),
  });

  const readAllMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/notifications/read-all", {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/notifications"] }),
  });

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(prev => prev ? false : prev);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className={`relative p-2 rounded-lg border transition-all ${
          hasUnread
            ? "border-violet-400/50 bg-violet-500/10 text-violet-300 hover:bg-violet-500/20"
            : "border-card-border text-muted-foreground hover:text-foreground hover:border-white/20"
        }`}
        title="Notifications"
      >
        {hasUnread ? <BellRing size={15} /> : <Bell size={15} />}
        {hasUnread && (
          <span className="absolute -top-1 -right-1 min-w-[16px] h-4 flex items-center justify-center rounded-full bg-violet-500 text-white text-[9px] font-bold px-0.5">
            {unread.length > 9 ? "9+" : unread.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 z-[200] w-80 bg-[#0f1623] border border-card-border rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-card-border">
            <div className="flex items-center gap-2">
              <BellRing size={13} className="text-violet-400" />
              <span className="text-xs font-bold" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>Notifications</span>
              {hasUnread && (
                <span className="text-[10px] bg-violet-500/20 text-violet-300 border border-violet-500/30 rounded-full px-1.5 py-0.5 font-semibold">
                  {unread.length} new
                </span>
              )}
            </div>
            {hasUnread && (
              <button
                onClick={() => readAllMutation.mutate()}
                className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                title="Mark all read"
              >
                <CheckCheck size={11} /> Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-72 overflow-y-auto divide-y divide-card-border/50">
            {notifications.length === 0 && (
              <div className="px-4 py-6 text-center text-[11px] text-muted-foreground">
                <Bell size={18} className="mx-auto mb-1.5 opacity-30" />
                No notifications
              </div>
            )}
            {notifications.map(n => (
              <div
                key={n.id}
                className={`px-4 py-3 transition-colors ${
                  !n.readAt ? "bg-violet-500/5 hover:bg-violet-500/10" : "hover:bg-white/3"
                }`}
              >
                <div className="flex items-start gap-2.5">
                  {/* Unread dot */}
                  <div className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${
                    !n.readAt ? "bg-violet-400" : "bg-transparent"
                  }`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className={`text-[11px] font-semibold ${
                        !n.readAt ? "text-violet-300" : "text-foreground/70"
                      }`}>{n.title}</span>
                      <span className="text-[9px] text-muted-foreground shrink-0">{fmtAgo(n.createdAt)}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{n.body}</p>
                    {n.taskRef && (
                      <div className="flex items-center gap-2 mt-1.5">
                        <Link href="/nept-tasking">
                          <a
                            className="flex items-center gap-1 text-[10px] text-cyan-400 hover:text-cyan-300 transition-colors"
                            onClick={() => { setOpen(false); if (!n.readAt) readOneMutation.mutate(n.id); }}
                          >
                            <ExternalLink size={9} /> {n.taskRef}
                          </a>
                        </Link>
                        {!n.readAt && (
                          <button
                            onClick={() => readOneMutation.mutate(n.id)}
                            className="text-[9px] text-muted-foreground hover:text-foreground transition-colors"
                          >
                            Dismiss
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface NavItem {
  label: string;
  path?: string;
  icon: React.ReactNode;
  iconLg: React.ReactNode;
  color: string;        // Tailwind text color class for this group
  accent: string;       // hex for active bg tint (used inline)
  children?: { label: string; path: string; restricted?: UserRole[] }[];
  restricted?: UserRole[];
}

const NAV: NavItem[] = [
  // ── Demo ──────────────────────────────────────────────────────────
  {
    label: "Demo",  color: "text-slate-300",  accent: "#334155",
    icon: <PlayCircle size={16} />, iconLg: <PlayCircle size={28} />,
    children: [
      { label: "Demo Overview",    path: "/" },
      { label: "Client Demo Mode", path: "/demo-mode" },
    ],
  },
  // ── Dashboards ────────────────────────────────────────────────────
  {
    label: "Dashboards", color: "text-violet-400", accent: "#4c1d95",
    icon: <LayoutDashboard size={16} />, iconLg: <LayoutDashboard size={28} />,
    children: [
      { label: "The 8:45",             path: "/morning-brief" },
      { label: "Shift & Fleet Status",  path: "/shift-fleet" },
      { label: "Ops Room Display",      path: "/ops-display" },
    ],
  },
  // ── Missions ──────────────────────────────────────────────────────
  {
    label: "Missions", color: "text-cyan-400", accent: "#155e75",
    icon: <Plane size={16} />, iconLg: <Plane size={28} />,
    children: [
      { label: "Dispatch & Intake",   path: "/dispatch" },
      { label: "NEPT Tasking",        path: "/nept-tasking" },
      { label: "Passenger Manifest",  path: "/passenger-manifest" },
      { label: "Mission Board",       path: "/missions" },
      { label: "NSW Flight Map",      path: "/map" },
      { label: "ADS-B Live Tracking",  path: "/adsb-tracking" },
      { label: "Flight Planning",     path: "/flight-planning" },
      { label: "Special Missions",    path: "/special-missions" },
      { label: "Ferry Flights",        path: "/ferry" },
      { label: "Demand Forecasting",   path: "/demand-forecasting" },
    ],
  },
  // ── Operations ────────────────────────────────────────────────────
  {
    label: "Operations", color: "text-emerald-400", accent: "#065f46",
    icon: <Zap size={16} />, iconLg: <Zap size={28} />,
    children: [
      { label: "Crew Rest Calculator",        path: "/rest-calculator" },
      { label: "Charter Quote",               path: "/charter-quote" },
      { label: "Mission Optimiser",           path: "/mission-optimiser" },
      { label: "Operational Risk Assessment", path: "/ora" },
      { label: "Ops Task Management",         path: "/ops-tasks" },
      { label: "Regulations Reference",       path: "/regulations" },
      { label: "Senior Base Pilot Portal",    path: "/sbp-portal" },
      { label: "Hospital Referral Portal",     path: "/hospital-referral" },
    ],
  },
  // ── Assets ────────────────────────────────────────────────────────
  {
    label: "Assets", color: "text-orange-400", accent: "#9a3412",
    icon: <Wrench size={16} />, iconLg: <Wrench size={28} />,
    children: [
      { label: "Pilot Handover Board", path: "/pilot-handover" },
      { label: "Tech & Journey Log",   path: FEATURES.TECH_LOG ? "/tech-log" : "/techlog" },
      { label: "Aircraft Status",      path: "/aircraft" },
      { label: "Ground Vehicles",      path: "/ground-vehicles" },
      { label: "Engineering",          path: "/engineering" },
      { label: "Component Life & AD/SB", path: "/component-life" },
      { label: "AI Maintenance Assistant", path: "/ai-maintenance" },
      { label: "Maintenance Planner",      path: "/maint-planner" },
      { label: "Asset Utilisation",        path: "/asset-utilisation" },
      { label: "FBO & Handling",           path: "/fbo-handling" },
      { label: "Airborne EFB",             path: "/airborne-efb" },
    ],
  },
  // ── Crew & People ─────────────────────────────────────────────────
  {
    label: "Crew & People", color: "text-blue-400", accent: "#1e40af",
    icon: <Users size={16} />, iconLg: <Users size={28} />,
    children: [
      { label: "Crew Roster",             path: "/roster" },
      { label: "Org Chart & Key Contacts", path: "/org-chart" },
      { label: "Duty & FRMS",             path: "/frms" },
      { label: "FTL Compliance Engine",   path: "/ftl-compliance" },
      { label: "Check & Training",        path: "/check-training" },
      { label: "Competency & Credentials", path: "/competency-tracking" },
      { label: "Crew Mobile App",          path: "/crew-mobile-app" },
      { label: "Recruitment Portal",       path: "/recruitment" },
    ],
  },
  // ── Clinical ──────────────────────────────────────────────────────
  {
    label: "Clinical", color: "text-pink-400", accent: "#9d174d",
    icon: <HeartPulse size={16} />, iconLg: <HeartPulse size={28} />,
    children: [
      { label: "Medical Equipment",       path: "/medical-equipment" },
      { label: "Vital Signs Monitor",      path: "/vital-signs-monitor" },
      { label: "In-Flight Care Record",    path: "/patient-care-record" },
      { label: "Stock Usage & Orders",    path: "/stock-usage" },
      { label: "After-Hours AI Med Line", path: "/after-hours" },
      { label: "Telehealth Portal",       path: "/telehealth" },
    ],
  },
  // ── AI & Comms ────────────────────────────────────────────────────
  {
    label: "AI & Comms", color: "text-purple-400", accent: "#6b21a8",
    icon: <Bot size={16} />, iconLg: <Bot size={28} />,
    children: [
      { label: "Jennifer — Presenter", path: "/jennifer" },
      { label: "Jennifer — Live Q&A",  path: "/jennifer-live-qa" },
      { label: "Graham — Live Q&A",    path: "/jennifer-live" },
      { label: "AI Mission Analyst",   path: "/ai-analyst" },
      { label: "Document AI",          path: "/doc-ai" },
    ],
  },
  // ── Business ──────────────────────────────────────────────────────
  {
    label: "Business", color: "text-amber-400", accent: "#92400e",
    icon: <Briefcase size={16} />, iconLg: <Briefcase size={28} />,
    children: [
      { label: "Invoicing",           path: "/invoicing" },
      { label: "Fee Reconciliation",  path: "/finance" },
      { label: "Cost Optimizer",      path: "/cost-optimizer" },
      { label: "Audit & Reports",     path: "/audit" },
      { label: "Government Tenders",  path: "/government-tenders" },
      { label: "Medicare & DVA Billing", path: "/medicare-billing" },
      { label: "Avinode Marketplace",    path: "/avinode" },
      { label: "Contract Compliance",    path: "/contracts" },
      { label: "ISO Compliance",      path: "/iso" },
      { label: "Payroll & Leave",     path: "/payroll-leave" },
    ],
  },
  // ── Administration ────────────────────────────────────────────────
  {
    label: "Administration", color: "text-slate-300", accent: "#475569",
    icon: <Settings size={16} />, iconLg: <Settings size={28} />,
    children: [
      { label: "User Management",     path: "/users" },
      { label: "RBAC Permissions",    path: "/rbac" },
      { label: "System Settings",     path: "/settings" },
      { label: "API Integration Hub", path: "/api-integrations" },
      { label: "Project Management",  path: "/projects" },
      { label: "Idea Hub",            path: "/idea-hub" },
      { label: "Manuals & SOPs",           path: "/docs" },
      { label: "Regulatory Monitor",       path: "/reg-monitor" },
      { label: "SMS Module",                path: "/sms-module" },
      { label: "EHR Integration Scoping",   path: "/ehr-scoping" },
      { label: "Multi-Tenant Platform",     path: "/multi-tenant" },
      { label: "Innovation Hub",             path: "/innovation" },
      { label: "Security Monitor",            path: "/security" },
      { label: "Development Roadmap",       path: "/dev-roadmap" },
    ],
  },
];

interface LayoutProps {
  children: React.ReactNode;
  role: UserRole;
  onRoleChange: (r: UserRole) => void;
}

function getDefaultSections(r: UserRole): string[] {
  switch (r) {
    case 'pilot':             return ['Missions'];
    case 'nurse':
    case 'senior_flight_nurse':
    case 'ordering_nurse':    return ['Clinical'];
    case 'doctor':            return ['Missions'];
    case 'dispatcher':        return ['Missions'];
    case 'engineer':          return ['Assets'];
    case 'admin':             return ['Administration'];
    case 'safety':
    case 'senior_management': return ['Business'];
    default:                  return ['Missions'];
  }
}

export default function Layout({ children, role, onRoleChange }: LayoutProps) {
  const [location] = useLocation();
  const [expanded, setExpanded]       = useState<string[]>(() => getDefaultSections(role));

  async function handleLogout() {
    try {
      await apiRequest("POST", "/api/auth/logout");
    } catch {}
    window.location.reload();
  }
  const [theme, setTheme] = useState<'dark' | 'light' | 'auto'>('dark');
  // darkMode derived from theme + system preference
  const [systemDark, setSystemDark] = useState(() =>
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );
  const darkMode = theme === 'dark' || (theme === 'auto' && systemDark);

  // Watch system preference for auto mode
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Apply .light class to <html> whenever darkMode changes
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
    }
  }, [darkMode]);
  const [mobileOpen, setMobileOpen]   = useState(false);
  const [panelOpen, setPanelOpen]     = useState(false);
  const [helpOpen, setHelpOpen]       = useState(false);
  const [bugOpen, setBugOpen]         = useState(false);
  const [tooltip, setTooltip]         = useState<{ label: string; y: number } | null>(null);
  const tooltipTimer                  = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentRole = ROLES.find(r => r.id === role)!;
  const rbacMatrix = useRbacPerms();

  const isRestricted = (restricted?: UserRole[]) => !!restricted?.includes(role);
  // Hide nav item if RBAC matrix says "none" for this role
  const isHiddenByRbac = (path?: string) => path ? !canView(rbacMatrix, role, path) : false;

  const toggleSection = (label: string) =>
    setExpanded(prev => prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]);

  const openSection = (label: string) => {
    setPanelOpen(true);
    setExpanded(prev => prev.includes(label) ? prev : [...prev, label]);
    setTooltip(null);
  };

  useEffect(() => { setExpanded(getDefaultSections(role)); }, [role]);

  const cycleTheme = () => {
    setTheme(t => t === 'dark' ? 'light' : t === 'light' ? 'auto' : 'dark');
  };

  const themeLabel = theme === 'dark' ? 'Dark' : theme === 'light' ? 'Light' : 'Auto';
  const ThemeIcon = theme === 'dark' ? Moon : theme === 'light' ? Sun : SunMoon;

  // ── Shared full-nav panel content ─────────────────────────────────────────
  const navPanel = (
    <>
      {/* Logo row */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-sidebar-border flex-shrink-0">
        <img src="/medivac-logo.jpg" alt="Medivac.ai"
          className="w-10 h-10 rounded-xl object-contain flex-shrink-0 bg-[#050d1a]" />
        <div className="min-w-0">
          <div className="text-sm font-bold text-cyan-400 leading-none whitespace-nowrap"
            style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>Medivac.ai</div>
          <div className="text-xs text-muted-foreground mt-0.5 whitespace-nowrap">Smarter Care. Anywhere.</div>
        </div>
        <button
          className="ml-auto text-muted-foreground hover:text-cyan-400 transition-colors flex-shrink-0"
          onClick={() => setPanelOpen(false)}
          title="Collapse"
        >
          <PanelLeftClose size={16} />
        </button>
      </div>

      {/* Role selector */}
      <div className="px-3 py-3 border-b border-sidebar-border flex-shrink-0">
        <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5 block">Demo Role</label>
        <select
          value={role}
          onChange={e => onRoleChange(e.target.value as UserRole)}
          className="w-full text-xs bg-sidebar-accent border border-sidebar-border rounded-md px-2.5 py-1.5 text-sidebar-foreground focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
          data-testid="role-selector"
        >
          {ROLES.map(r => <option key={r.id} value={r.id}>{r.icon} {r.label}</option>)}
        </select>
        <div className="mt-1.5 flex items-center gap-1.5">
          <span className={`text-xs ${currentRole.color} font-medium`}>{currentRole.icon} {currentRole.label}</span>
          <span className="text-xs text-muted-foreground">— Demo Mode</span>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        {NAV.map(section => {
          const isOpen = expanded.includes(section.label);
          // Hide the entire section if all children are hidden
          const visibleChildren = section.children?.filter(
            item => !isRestricted(item.restricted) && !isHiddenByRbac(item.path)
          );
          if (section.children && visibleChildren?.length === 0) return null;
          return (
            <div key={section.label} className="mb-0.5">
              {/* Section header — coloured icon + label when open */}
              <button
                onClick={() => toggleSection(section.label)}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs font-semibold transition-colors
                  ${isOpen
                    ? `${section.color} bg-sidebar-accent/60`
                    : 'text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent'}`}
              >
                <span className={section.color}>{section.icon}</span>
                <span className="flex-1 text-left whitespace-nowrap tracking-wide uppercase text-[10px]">{section.label}</span>
                {isOpen ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
              </button>
              {isOpen && section.children && (
                <div className="ml-1 mt-0.5 space-y-px border-l-2 pl-2" style={{ borderColor: section.accent }}>
                  {section.children.map(item => {
                    if (isRestricted(item.restricted)) return null;
                    if (isHiddenByRbac(item.path)) return null;
                    const isActive = location === item.path;
                    return (
                      <Link key={item.path} href={item.path!}>
                        <a
                          className={`flex items-center gap-2 px-3 py-1 rounded-md text-xs transition-colors whitespace-nowrap
                            ${isActive
                              ? `${section.color} font-semibold`
                              : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent'}`}
                          style={isActive ? { backgroundColor: section.accent + '55' } : undefined}
                          data-testid={`nav-${item.path?.replace(/\//g, '') || 'home'}`}
                          onClick={() => setMobileOpen(false)}
                        >
                          {item.label}
                        </a>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Bottom bar */}
      <div className="px-3 py-3 border-t border-sidebar-border flex items-center gap-2 flex-shrink-0">
        <div className="relative w-2 h-2 flex-shrink-0">
          <div className="absolute inset-0 rounded-full bg-green-400 live-dot" />
          <div className="w-2 h-2 rounded-full bg-green-400" />
        </div>
        <span className="text-xs text-muted-foreground flex-1 whitespace-nowrap">LIVE · DEMO</span>
        <button
          onClick={cycleTheme}
          title={`Theme: ${themeLabel} — click to cycle`}
          className="flex items-center gap-1 px-2 py-1 rounded-lg border border-border bg-muted/30 hover:bg-muted/60 transition-colors text-muted-foreground hover:text-foreground flex-shrink-0"
        >
          <ThemeIcon size={12} />
          <span className="text-[10px] font-semibold">{themeLabel}</span>
        </button>
        <button
          onClick={handleLogout}
          title="Sign out"
          className="flex items-center gap-1 px-2 py-1 rounded-lg border border-border bg-muted/30 hover:bg-red-900/40 hover:border-red-800/50 transition-colors text-muted-foreground hover:text-red-400 flex-shrink-0"
        >
          <LogOut size={12} />
          <span className="text-[10px] font-semibold">OUT</span>
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">

      {/* ── Mobile overlay ─────────────────────────────────────────────────── */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* ── Mobile drawer ──────────────────────────────────────────────────── */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 flex flex-col
        bg-sidebar border-r border-sidebar-border
        transform transition-transform duration-200
        lg:hidden
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* reuse nav panel but with a close button replacing collapse */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-sidebar-border flex-shrink-0">
          <img src="/medivac-logo.jpg" alt="Medivac.ai"
            className="w-10 h-10 rounded-xl object-contain flex-shrink-0 bg-[#050d1a]" />
          <div className="min-w-0">
            <div className="text-sm font-bold text-cyan-400 leading-none whitespace-nowrap"
              style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>Medivac.ai</div>
            <div className="text-xs text-muted-foreground mt-0.5 whitespace-nowrap">Smarter Care. Anywhere.</div>
          </div>
          <button className="ml-auto text-muted-foreground flex-shrink-0" onClick={() => setMobileOpen(false)}>
            <X size={16} />
          </button>
        </div>
        <div className="px-3 py-3 border-b border-sidebar-border flex-shrink-0">
          <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5 block">Demo Role</label>
          <select
            value={role}
            onChange={e => onRoleChange(e.target.value as UserRole)}
            className="w-full text-xs bg-sidebar-accent border border-sidebar-border rounded-md px-2.5 py-1.5 text-sidebar-foreground focus:outline-none"
            data-testid="role-selector"
          >
            {ROLES.map(r => <option key={r.id} value={r.id}>{r.icon} {r.label}</option>)}
          </select>
        </div>
        <nav className="flex-1 overflow-y-auto py-3 px-2">
          {NAV.map(section => {
            const isOpen = expanded.includes(section.label);
            const visibleChildrenMobile = section.children?.filter(
              item => !isRestricted(item.restricted) && !isHiddenByRbac(item.path)
            );
            if (section.children && visibleChildrenMobile?.length === 0) return null;
            return (
              <div key={section.label} className="mb-0.5">
                <button
                  onClick={() => toggleSection(section.label)}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs font-semibold transition-colors
                    ${isOpen
                      ? `${section.color} bg-sidebar-accent/60`
                      : 'text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent'}`}
                >
                  <span className={section.color}>{section.icon}</span>
                  <span className="flex-1 text-left tracking-wide uppercase text-[10px]">{section.label}</span>
                  {isOpen ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
                </button>
                {isOpen && section.children && (
                  <div className="ml-1 mt-0.5 space-y-px border-l-2 pl-2" style={{ borderColor: section.accent }}>
                    {section.children.map(item => {
                      if (isRestricted(item.restricted)) return null;
                      if (isHiddenByRbac(item.path)) return null;
                      const isActive = location === item.path;
                      return (
                        <Link key={item.path} href={item.path!}>
                          <a
                            className={`flex items-center gap-2 px-3 py-1 rounded-md text-xs transition-colors
                              ${isActive ? `${section.color} font-semibold` : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent'}`}
                            style={isActive ? { backgroundColor: section.accent + '55' } : undefined}
                            onClick={() => setMobileOpen(false)}
                          >
                            {item.label}
                          </a>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
        <div className="px-3 py-3 border-t border-sidebar-border flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-400" />
          <span className="text-xs text-muted-foreground flex-1">LIVE · DEMO</span>
          <button
            onClick={cycleTheme}
            title={`Theme: ${themeLabel}`}
            className="flex items-center gap-1 px-2 py-1 rounded-lg border border-border bg-muted/30 hover:bg-muted/60 transition-colors text-muted-foreground hover:text-foreground flex-shrink-0"
          >
            <ThemeIcon size={12} />
            <span className="text-[10px] font-semibold">{themeLabel}</span>
          </button>
        </div>
      </aside>

      {/* ── Desktop: icon rail ─────────────────────────────────────────────── */}
      <aside className="hidden lg:flex flex-col items-center w-16 bg-sidebar border-r border-sidebar-border flex-shrink-0">
        {/* Logo mark */}
        <div className="py-4 border-b border-sidebar-border w-full flex justify-center">
          <img src="/medivac-logo.jpg" alt="Medivac.ai"
            className="w-8 h-8 rounded-lg object-contain bg-[#050d1a]" />
        </div>

        {/* Section icons */}
        <nav className="flex-1 flex flex-col items-center gap-1 py-3 w-full">
          {NAV.map(section => {
            const isCurrentPage = section.children?.some(c => c.path === location) ?? false;
            return (
              <button
                key={section.label}
                onClick={() => openSection(section.label)}
                onMouseEnter={e => {
                  if (tooltipTimer.current) clearTimeout(tooltipTimer.current);
                  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                  setTooltip({ label: section.label, y: rect.top + rect.height / 2 });
                }}
                onMouseLeave={() => {
                  tooltipTimer.current = setTimeout(() => setTooltip(null), 150);
                }}
                className={`relative w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-150 ${section.color}`}
                style={isCurrentPage
                  ? { backgroundColor: section.accent, boxShadow: `0 0 14px ${section.accent}` }
                  : { opacity: 0.7 }}
              >
                {section.iconLg}
                {isCurrentPage && (
                  <span className="absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'currentColor' }} />
                )}
              </button>
            );
          })}
        </nav>

        {/* Expand button */}
        <div className="py-3 border-t border-sidebar-border w-full flex justify-center">
          <button
            onClick={() => setPanelOpen(true)}
            className="w-12 h-12 rounded-xl flex items-center justify-center text-muted-foreground hover:text-cyan-400 hover:bg-sidebar-accent transition-all"
            title="Expand menu"
          >
            <PanelLeftOpen size={18} />
          </button>
        </div>
      </aside>

      {/* ── Desktop: expanded panel (slides in beside rail) ────────────────── */}
      <aside
        className="hidden lg:flex flex-col bg-sidebar border-r border-sidebar-border flex-shrink-0 overflow-hidden transition-all duration-200"
        style={{ width: panelOpen ? 256 : 0 }}
      >
        {navPanel}
      </aside>

      {/* ── Tooltip ────────────────────────────────────────────────────────── */}
      {tooltip && !panelOpen && (
        <div
          className="fixed z-[200] pointer-events-none"
          style={{ top: tooltip.y, left: 68, transform: 'translateY(-50%)' }}
        >
          <div className="bg-gray-900 border border-sidebar-border text-xs text-sidebar-foreground px-3 py-1.5 rounded-lg shadow-xl whitespace-nowrap">
            {tooltip.label}
          </div>
        </div>
      )}

      {/* ── Main content ───────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center gap-2 px-3 py-2.5 border-b border-border bg-card/50 backdrop-blur-sm flex-shrink-0">
          <button className="lg:hidden text-muted-foreground hover:text-foreground flex-shrink-0" onClick={() => setMobileOpen(true)}>
            <Menu size={20} />
          </button>
          <div className="md:hidden flex-shrink-0">
            <EmergencyButton role={role} mobile />
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground min-w-0 flex-1">
            <Navigation size={12} className="text-cyan-400 flex-shrink-0" />
            <span className="text-cyan-400 font-medium truncate">RFDS SE Section</span>
            <span className="flex-shrink-0">·</span>
            <span className="truncate hidden sm:inline">Aeromedical Operations</span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={() => setHelpOpen(true)} title="Help" className="relative p-2 rounded-lg border border-card-border text-muted-foreground hover:text-cyan-400 hover:bg-white/10 hover:border-cyan-400/40 transition-all" data-testid="button-help"><HelpCircle size={15} /></button>
            <button onClick={() => setBugOpen(true)} title="Report a Bug" className="relative p-2 rounded-lg border border-card-border text-muted-foreground hover:text-red-400 hover:bg-white/10 hover:border-red-400/40 transition-all" data-testid="button-bug"><Bug size={15} /></button>
            <NotificationBell role={role} />
            <div className="hidden md:block">
              <EmergencyButton role={role} />
            </div>
            <div className="hidden sm:flex items-center gap-1.5 bg-gray-700 rounded-full px-2.5 py-1 border border-gray-500">
              <span className={`text-xs font-bold ${currentRole.color}`}>{currentRole.icon}</span>
              <span className="text-xs font-semibold text-white">{currentRole.label}</span>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto">
          {children}
          {helpOpen && <HelpDrawer path={location} onClose={() => setHelpOpen(false)} />}
          {bugOpen && <BugReportModal
            path={location}
            pages={NAV.flatMap(s => s.children ?? []).map(c => ({ label: c.label, path: c.path }))}
            onClose={() => setBugOpen(false)}
          />}
          <footer className="px-4 py-2 border-t border-border text-center">
            <p className="text-[10px] text-muted-foreground">
              © 2026 Medivac.ai. Medivac.ai is proprietary software. All intellectual property, design, and functionality rights are reserved. Confidential — not for distribution.
            </p>
          </footer>
        </main>
      </div>
    </div>
  );
}
