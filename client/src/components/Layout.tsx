import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { ROLES, type UserRole } from "@/lib/data";
import {
  ChevronDown, ChevronRight, Activity, Users, Shield, Settings,
  Radio, PlayCircle, AlertTriangle, Navigation, BookOpen,
  Moon, Sun, Menu, X, PanelLeftClose, PanelLeftOpen
} from "lucide-react";
import EmergencyButton from "@/components/EmergencyButton";
import { FEATURES } from "@/lib/config";

interface NavItem {
  label: string;
  path?: string;
  icon: React.ReactNode;
  iconLg: React.ReactNode;
  children?: { label: string; path: string; restricted?: UserRole[] }[];
  restricted?: UserRole[];
}

const BASE_NAV: NavItem[] = [
  {
    label: "Demo",
    icon: <PlayCircle size={16} />,
    iconLg: <PlayCircle size={28} />,
    children: [
      { label: "Demo Overview", path: "/" },
      { label: "Client Demo Mode", path: "/demo-mode" },
    ],
  },
  {
    label: "Mission Operations",
    icon: <Activity size={16} />,
    iconLg: <Activity size={28} />,
    children: [
      { label: "The 8:45", path: "/morning-brief" },
      { label: "Passenger Manifest", path: "/passenger-manifest" },
      { label: "Mission Board", path: "/missions" },
      { label: "NSW Flight Map", path: "/map" },
      { label: "Dispatch & Intake", path: "/dispatch" },
      { label: "Operational Risk Assessment", path: "/ora" },
      { label: "Flight Planning", path: "/flight-planning" },
      { label: "Mission Optimiser", path: "/mission-optimiser" },
      { label: "Special Missions", path: "/special-missions" },
    ],
  },
  {
    label: "People & Aircraft",
    icon: <Users size={16} />,
    iconLg: <Users size={28} />,
    children: [
      { label: "Crew Roster", path: "/roster" },
      { label: "Duty & FRMS", path: "/frms" },
      { label: "Aircraft Status", path: "/aircraft" },
      { label: "Engineering", path: "/engineering" },
      { label: "Maintenance Planner", path: "/maint-planner" },
      { label: "Ferry Flights", path: "/ferry" },
      { label: "Tech Log", path: "/techlog" },
      { label: "Check & Training", path: "/check-training" },
      { label: "Medical Equipment", path: "/medical-equipment" },
      { label: "Stock Usage & Orders", path: "/stock-usage" },
      { label: "After-Hours AI Med Line", path: "/after-hours" },
      { label: "Ground Vehicles", path: "/ground-vehicles" },
    ],
  },
  {
    label: "AI & Communications",
    icon: <Radio size={16} />,
    iconLg: <Radio size={28} />,
    children: [
      { label: "Jennifer — Presenter", path: "/jennifer" },
      { label: "Graham — Live Q&A", path: "/jennifer-live" },
      { label: "AI Mission Analyst", path: "/ai-analyst" },
      { label: "Telehealth Portal", path: "/telehealth", restricted: ['engineer'] },
      { label: "Document AI", path: "/doc-ai" },
    ],
  },
  {
    label: "Business & Compliance",
    icon: <Shield size={16} />,
    iconLg: <Shield size={28} />,
    children: [
      { label: "ISO Compliance", path: "/iso", restricted: ['pilot', 'nurse', 'senior_flight_nurse', 'ordering_nurse', 'doctor', 'engineer'] },
      { label: "Contract Compliance", path: "/contracts", restricted: ['pilot', 'nurse', 'senior_flight_nurse', 'ordering_nurse', 'doctor', 'engineer', 'dispatcher'] },
      { label: "Fuel & Finance", path: "/finance", restricted: ['pilot', 'nurse', 'senior_flight_nurse', 'ordering_nurse', 'doctor', 'engineer'] },
      { label: "Audit & Reports", path: "/audit" },
    ],
  },
  {
    label: "Administration",
    icon: <Settings size={16} />,
    iconLg: <Settings size={28} />,
    children: [
      { label: "User Management", path: "/users", restricted: ['pilot', 'nurse', 'senior_flight_nurse', 'ordering_nurse', 'doctor', 'engineer', 'dispatcher'] },
      { label: "RBAC Permissions", path: "/rbac", restricted: ['pilot', 'nurse', 'senior_flight_nurse', 'ordering_nurse', 'doctor', 'engineer', 'dispatcher', 'safety'] },
      { label: "System Settings", path: "/settings", restricted: ['pilot', 'nurse', 'senior_flight_nurse', 'ordering_nurse', 'doctor', 'engineer', 'dispatcher', 'safety', 'senior_management'] },
    ],
  },
];

const TECH_LOG_NAV: NavItem = {
  label: "Tech & Journey Log",
  icon: <BookOpen size={16} />,
  iconLg: <BookOpen size={28} />,
  children: [
    { label: "Tech & Journey Log", path: "/tech-log" },
  ],
};

// Inject Tech Log section between Mission Operations and People & Aircraft when enabled
const NAV: NavItem[] = FEATURES.TECH_LOG
  ? [...BASE_NAV.slice(0, 2), TECH_LOG_NAV, ...BASE_NAV.slice(2)]
  : BASE_NAV;

interface LayoutProps {
  children: React.ReactNode;
  role: UserRole;
  onRoleChange: (r: UserRole) => void;
}

function getDefaultSections(r: UserRole): string[] {
  switch (r) {
    case 'pilot':             return ['Mission Operations'];
    case 'nurse':
    case 'senior_flight_nurse':
    case 'ordering_nurse':
    case 'doctor':            return ['Mission Operations'];
    case 'dispatcher':        return ['Mission Operations'];
    case 'engineer':          return ['People & Aircraft'];
    case 'admin':             return ['Administration'];
    case 'safety':
    case 'senior_management': return ['Business & Compliance'];
    default:                  return ['Mission Operations'];
  }
}

export default function Layout({ children, role, onRoleChange }: LayoutProps) {
  const [location] = useLocation();
  const [expanded, setExpanded]       = useState<string[]>(() => getDefaultSections(role));
  const [darkMode, setDarkMode]       = useState(true);
  const [mobileOpen, setMobileOpen]   = useState(false);
  const [panelOpen, setPanelOpen]     = useState(false);
  const [tooltip, setTooltip]         = useState<{ label: string; y: number } | null>(null);
  const tooltipTimer                  = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentRole = ROLES.find(r => r.id === role)!;

  const isRestricted = (restricted?: UserRole[]) => !!restricted?.includes(role);

  const toggleSection = (label: string) =>
    setExpanded(prev => prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]);

  const openSection = (label: string) => {
    setPanelOpen(true);
    setExpanded(prev => prev.includes(label) ? prev : [...prev, label]);
    setTooltip(null);
  };

  useEffect(() => { setExpanded(getDefaultSections(role)); }, [role]);

  const toggleTheme = () => {
    setDarkMode(d => !d);
    document.documentElement.classList.toggle('light');
  };

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
          return (
            <div key={section.label} className="mb-0.5">
              <button
                onClick={() => toggleSection(section.label)}
                className="w-full flex items-center gap-2 px-2 py-1 rounded-md text-xs font-semibold text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
              >
                {section.icon}
                <span className="flex-1 text-left whitespace-nowrap">{section.label}</span>
                {isOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              </button>
              {isOpen && section.children && (
                <div className="ml-2 mt-0.5 space-y-px">
                  {section.children.map(item => {
                    if (isRestricted(item.restricted)) return null;
                    const isActive = location === item.path;
                    return (
                      <Link key={item.path} href={item.path!}>
                        <a
                          className={`flex items-center gap-2 px-3 py-1 rounded-md text-xs transition-colors whitespace-nowrap
                            ${isActive
                              ? 'bg-cyan-500/15 text-cyan-400 font-medium'
                              : 'text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent'}`}
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
        <button onClick={toggleTheme} className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded flex-shrink-0">
          {darkMode ? <Sun size={14} /> : <Moon size={14} />}
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
            return (
              <div key={section.label} className="mb-0.5">
                <button
                  onClick={() => toggleSection(section.label)}
                  className="w-full flex items-center gap-2 px-2 py-1 rounded-md text-xs font-semibold text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
                >
                  {section.icon}
                  <span className="flex-1 text-left">{section.label}</span>
                  {isOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                </button>
                {isOpen && section.children && (
                  <div className="ml-2 mt-0.5 space-y-px">
                    {section.children.map(item => {
                      if (isRestricted(item.restricted)) return null;
                      const isActive = location === item.path;
                      return (
                        <Link key={item.path} href={item.path!}>
                          <a
                            className={`flex items-center gap-2 px-3 py-1 rounded-md text-xs transition-colors
                              ${isActive ? 'bg-cyan-500/15 text-cyan-400 font-medium' : 'text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent'}`}
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
          <button onClick={toggleTheme} className="text-muted-foreground p-1 rounded">
            {darkMode ? <Sun size={14} /> : <Moon size={14} />}
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
            const isActive = section.children?.some(c => c.path === location);
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
                className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-150
                  ${isActive
                    ? 'bg-cyan-500/20 text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                    : 'text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent'}`}
              >
                {section.iconLg}
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
            <div className="hidden sm:flex items-center gap-1.5 text-xs">
              <AlertTriangle size={12} className="text-orange-400" />
              <span className="text-orange-400 font-medium">1 pending release</span>
            </div>
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
        </main>
      </div>
    </div>
  );
}
