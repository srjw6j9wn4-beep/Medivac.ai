import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { UserRole } from "@/lib/data";

export type PermLevel = "none" | "read" | "full";
export type PermMatrix = Record<string, Record<string, PermLevel>>;

// Path → module ID mapping (must match MODULES in RBACPermissions.tsx)
export const PATH_TO_MODULE: Record<string, string> = {
  "/":                   "home",
  "/demo-mode":          "demo-mode",
  "/nept-tasking":       "nept-tasking",
  "/morning-brief":      "morning-brief",
  "/passenger-manifest": "passenger-manifest",
  "/missions":           "missions",
  "/map":                "map",
  "/dispatch":           "dispatch",
  "/rest-calculator":    "rest-calculator",
  "/charter-quote":      "charter-quote",
  "/ora":                "ora",
  "/flight-planning":    "flight-planning",
  "/mission-optimiser":  "mission-optimiser",
  "/special-missions":   "special-missions",
  "/ops-tasks":          "ops-tasks",
  "/pilot-handover":     "pilot-handover",
  "/shift-fleet":        "shift-fleet",
  "/sbp-portal":         "sbp-portal",
  "/tech-log":           "tech-log",
  "/org-chart":          "org-chart",
  "/roster":             "roster",
  "/frms":               "frms",
  "/aircraft":           "aircraft",
  "/engineering":        "engineering",
  "/maint-planner":      "maint-planner",
  "/asset-utilisation":  "asset-utilisation",
  "/ferry":              "ferry",
  "/techlog":            "tech-log",
  "/check-training":     "check-training",
  "/regulations":        "regulations",
  "/medical-equipment":  "medical-equipment",
  "/stock-usage":        "stock-usage",
  "/after-hours":        "after-hours",
  "/ground-vehicles":    "ground-vehicles",
  "/jennifer":           "jennifer",
  "/jennifer-live-qa":   "jennifer-live-qa",
  "/jennifer-live":      "jennifer-live",
  "/ai-analyst":         "ai-analyst",
  "/telehealth":         "telehealth",
  "/doc-ai":             "doc-ai",
  "/invoicing":          "invoicing",
  "/cost-optimizer":     "cost-optimizer",
  "/iso":                "iso",
  "/contracts":          "contracts",
  "/finance":            "finance",
  "/fuel-finance":       "finance",
  "/audit":              "audit",
  "/government-tenders": "government-tenders",
  "/payroll-leave":      "payroll-leave",
  "/idea-hub":           "idea-hub",
  "/projects":           "projects",
  "/users":              "users",
  "/rbac":               "rbac",
  "/settings":           "settings",
  "/api-integrations":   "api-integrations",
  "/ops-display":        "ops-display",
};

export function useRbacPerms() {
  const { data } = useQuery<PermMatrix | null>({
    queryKey: ["/api/rbac-permissions"],
    staleTime: 30_000,
  });
  return data ?? null;
}

/** Returns true if the role can see this path (read or full), false if none */
export function canView(matrix: PermMatrix | null, role: UserRole, path: string): boolean {
  if (!matrix) return true; // fallback: show everything while loading
  const moduleId = PATH_TO_MODULE[path];
  if (!moduleId) return true; // unknown path — don't hide it
  const level = matrix[role]?.[moduleId] ?? "none";
  return level !== "none";
}
