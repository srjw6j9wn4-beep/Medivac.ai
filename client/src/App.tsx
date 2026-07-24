import { useState, useEffect, lazy, Suspense } from "react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Switch, Route, Router } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
const NotFound = lazy(() => import("@/pages/not-found"));
import Layout from "@/components/Layout";
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const MissionBoard = lazy(() => import("@/pages/MissionBoard"));
const Roster = lazy(() => import("@/pages/Roster"));
const Aircraft = lazy(() => import("@/pages/Aircraft"));
const ISOCompliance = lazy(() => import("@/pages/ISOCompliance"));
const SpecialMissions = lazy(() => import("@/pages/SpecialMissions"));
const FerryFlights = lazy(() => import("@/pages/FerryFlights"));
const Bryan = lazy(() => import("@/pages/Bryan"));
const BryanLive = lazy(() => import("@/pages/BryanLive"));
const Jennifer = lazy(() => import("@/pages/Jennifer"));
const JenniferLive = lazy(() => import("@/pages/JenniferLive")); // v2
const DemoMode = lazy(() => import("@/pages/DemoMode"));
const Dispatch = lazy(() => import("@/pages/Dispatch"));
const RestCalculatorOps = lazy(() => import("@/pages/RestCalculatorOps"));
const AuditReports = lazy(() => import("@/pages/AuditReports"));
const FlightMap = lazy(() => import("@/pages/FlightMap"));
const FlightPlanning = lazy(() => import("@/pages/FlightPlanning"));
const DutyFRMS = lazy(() => import("@/pages/DutyFRMS"));
const AIMissionAnalyst = lazy(() => import("@/pages/AIMissionAnalyst"));
const TelehealthPortal = lazy(() => import("@/pages/TelehealthPortal"));
const DocumentAI = lazy(() => import("@/pages/DocumentAI"));
const ContractCompliance = lazy(() => import("@/pages/ContractCompliance"));
const FuelFinance = lazy(() => import("@/pages/FuelFinance"));
const UserManagement = lazy(() => import("@/pages/UserManagement"));
const RBACPermissions = lazy(() => import("@/pages/RBACPermissions"));
const SystemSettings = lazy(() => import("@/pages/SystemSettings"));
const ApiIntegrations = lazy(() => import("@/pages/ApiIntegrations"));
const CheckTraining = lazy(() => import("@/pages/CheckTraining"));
const Regulations = lazy(() => import("@/pages/Regulations"));
const MedicalEquipment = lazy(() => import("@/pages/MedicalEquipment"));
const StockUsage = lazy(() => import("@/pages/StockUsage"));
const AfterHours = lazy(() => import("@/pages/AfterHours"));
const GroundVehicles = lazy(() => import("@/pages/GroundVehicles"));
const Engineering = lazy(() => import("@/pages/Engineering"));
const OperationalRiskAssessment = lazy(() => import("@/pages/OperationalRiskAssessment"));
const MaintenancePlanner = lazy(() => import("@/pages/MaintenancePlanner"));
const MorningBrief = lazy(() => import("@/pages/MorningBrief"));
const AssetUtilisation = lazy(() => import("@/pages/AssetUtilisation"));
const IdeaHub = lazy(() => import("@/pages/IdeaHub"));
const PassengerManifest = lazy(() => import("@/pages/PassengerManifest"));
const MissionOptimiser = lazy(() => import("@/pages/MissionOptimiser"));
const ManifestSign = lazy(() => import("@/pages/ManifestSign"));
const TechLogEmbed = lazy(() => import("@/pages/TechLogEmbed"));
const NEPTTasking = lazy(() => import("@/pages/NEPTTasking"));
const GovernmentTenders = lazy(() => import("@/pages/GovernmentTenders"));
const DevelopmentRoadmap = lazy(() => import("@/pages/DevelopmentRoadmap"));
const VitalSignsMonitor = lazy(() => import("@/pages/VitalSignsMonitor"));
const SMSModule = lazy(() => import("@/pages/SMSModule"));
const EHRScoping = lazy(() => import("@/pages/EHRScoping"));
const AirborneEFB = lazy(() => import("@/pages/AirborneEFB"));
const CrewMobileApp = lazy(() => import("@/pages/CrewMobileApp"));
const MedicareBilling = lazy(() => import("@/pages/MedicareBilling"));
const CompetencyTracking = lazy(() => import("@/pages/CompetencyTracking"));
const MultiTenantAdmin = lazy(() => import("@/pages/MultiTenantAdmin"));
const AIMaintenance = lazy(() => import("@/pages/AIMaintenance"));
const FBOHandling = lazy(() => import("@/pages/FBOHandling"));
const HospitalReferralPortal = lazy(() => import("@/pages/HospitalReferralPortal"));
const FTLCompliance = lazy(() => import("@/pages/FTLCompliance"));
const ADSBTracking = lazy(() => import("@/pages/ADSBTracking"));
const PatientCareRecord = lazy(() => import("@/pages/PatientCareRecord"));
const ComponentLifeTracking = lazy(() => import("@/pages/ComponentLifeTracking"));
const AvianodeMarketplace = lazy(() => import("@/pages/AvianodeMarketplace"));
const DemandForecasting = lazy(() => import("@/pages/DemandForecasting"));
const Invoicing = lazy(() => import("@/pages/Invoicing"));
const OpsRoomDisplay = lazy(() => import("@/pages/OpsRoomDisplay"));
const ShiftFleetStatus = lazy(() => import("@/pages/ShiftFleetStatus"));
const CharterQuote = lazy(() => import("@/pages/CharterQuote"));
const CostOptimizer = lazy(() => import("@/pages/CostOptimizer"));
const OpsTaskManagement = lazy(() => import("@/pages/OpsTaskManagement"));
const ProjectManagement = lazy(() => import("@/pages/ProjectManagement"));
const PilotHandover = lazy(() => import("@/pages/PilotHandover"));
const SeniorBasePilot = lazy(() => import("@/pages/SeniorBasePilot"));
const OrgChart = lazy(() => import("@/pages/OrgChart"));
const PayrollLeave = lazy(() => import("@/pages/PayrollLeave"));
const DocumentLibrary = lazy(() => import("@/pages/DocumentLibrary"));
const RegulatoryMonitor = lazy(() => import("@/pages/RegulatoryMonitor"));
const Recruitment = lazy(() => import("@/pages/Recruitment"));
const InnovationHub = lazy(() => import("@/pages/InnovationHub"));
const SecurityMonitor = lazy(() => import("@/pages/SecurityMonitor"));
import Login from "@/pages/Login";
import { useQuery } from "@tanstack/react-query";
import { FEATURES } from "@/lib/config";
import type { UserRole } from "@/lib/data";

// Simple placeholder page for sections still in design
function ComingSoon({ title }: { title: string }) {
  return (
    <div className="p-6 flex flex-col items-center justify-center min-h-96">
      <div className="p-6 bg-card rounded-2xl border border-card-border text-center max-w-sm">
        <div className="text-3xl mb-3">🛠</div>
        <h2 className="text-base font-bold mb-2" style={{fontFamily:"'Cabinet Grotesk',sans-serif"}}>{title}</h2>
        <p className="text-sm text-muted-foreground">This module is currently in design. Check back as the build progresses.</p>
        <div className="mt-3 text-xs text-cyan-400 font-medium">Medivac.ai — Work in Progress</div>
      </div>
    </div>
  );
}

function AppRouter({ role }: { role: UserRole }) {
  return (
    <Switch>
      <Route path="/" component={() => <Dashboard role={role} />} />
      <Route path="/demo-mode" component={() => <DemoMode role={role} />} />
      <Route path="/missions" component={() => <MissionBoard role={role} />} />
      <Route path="/map" component={() => <FlightMap role={role} />} />
      <Route path="/dispatch" component={() => <Dispatch role={role} />} />
      <Route path="/rest-calculator" component={() => <RestCalculatorOps role={role} />} />
      <Route path="/charter-quote" component={() => <CharterQuote />} />
      <Route path="/cost-optimizer" component={() => <CostOptimizer />} />
      <Route path="/nept-tasking" component={() => <NEPTTasking role={role} />} />
      <Route path="/invoicing" component={() => <Invoicing role={role} />} />
      <Route path="/ora" component={() => <OperationalRiskAssessment role={role} />} />
      <Route path="/morning-brief" component={() => <MorningBrief role={role} />} />
      <Route path="/passenger-manifest" component={() => <PassengerManifest role={role} />} />
      <Route path="/manifest-sign/:token" component={ManifestSign} />
      <Route path="/flight-planning" component={() => <FlightPlanning role={role} />} />
      <Route path="/mission-optimiser" component={() => <MissionOptimiser />} />
      <Route path="/special-missions" component={() => <SpecialMissions role={role} />} />
      <Route path="/roster" component={() => <Roster role={role} />} />
      <Route path="/frms" component={() => <DutyFRMS role={role} />} />
      <Route path="/aircraft" component={() => <Aircraft role={role} />} />
      <Route path="/ferry" component={() => <FerryFlights role={role} />} />
      {FEATURES.TECH_LOG && <Route path="/tech-log" component={() => <TechLogEmbed />} />}
      <Route path="/techlog" component={() => <ComingSoon title="Tech Log" />} />
      <Route path="/iso-compliance" component={() => <ISOCompliance />} />
      <Route path="/jennifer" component={() => <Jennifer role={role} />} />
      <Route path="/jennifer-live" component={() => <BryanLive role={role} />} />
      <Route path="/jennifer-live-qa" component={() => <JenniferLive role={role} />} />
      <Route path="/ai-analyst" component={() => <AIMissionAnalyst role={role} />} />
      <Route path="/telehealth" component={() => <TelehealthPortal role={role} />} />
      <Route path="/doc-ai" component={() => <DocumentAI role={role} />} />
      <Route path="/iso" component={() => <ISOCompliance role={role} />} />
      <Route path="/contracts" component={() => <ContractCompliance role={role} />} />
      <Route path="/finance" component={() => <FuelFinance role={role} />} />
      <Route path="/fuel-finance" component={() => <FuelFinance role={role} />} />
      <Route path="/audit" component={() => <AuditReports role={role} />} />
      <Route path="/government-tenders" component={() => <GovernmentTenders />} />
      <Route path="/dev-roadmap" component={() => <DevelopmentRoadmap />} />
      <Route path="/vital-signs-monitor" component={() => <VitalSignsMonitor />} />
      <Route path="/sms-module" component={() => <SMSModule />} />
      <Route path="/ehr-scoping" component={() => <EHRScoping />} />
      <Route path="/airborne-efb" component={() => <AirborneEFB />} />
      <Route path="/crew-mobile-app" component={() => <CrewMobileApp />} />
      <Route path="/recruitment" component={() => <Recruitment />} />
      <Route path="/innovation" component={() => <InnovationHub />} />
      <Route path="/security" component={() => <SecurityMonitor />} />
      <Route path="/medicare-billing" component={() => <MedicareBilling />} />
      <Route path="/competency-tracking" component={() => <CompetencyTracking />} />
      <Route path="/multi-tenant" component={() => <MultiTenantAdmin />} />
      <Route path="/ai-maintenance" component={() => <AIMaintenance />} />
      <Route path="/fbo-handling" component={() => <FBOHandling />} />
      <Route path="/hospital-referral" component={() => <HospitalReferralPortal />} />
      <Route path="/ftl-compliance" component={() => <FTLCompliance />} />
      <Route path="/adsb-tracking" component={() => <ADSBTracking />} />
      <Route path="/patient-care-record" component={() => <PatientCareRecord />} />
      <Route path="/component-life" component={() => <ComponentLifeTracking />} />
      <Route path="/avinode" component={() => <AvianodeMarketplace />} />
      <Route path="/demand-forecasting" component={() => <DemandForecasting />} />
      <Route path="/check-training" component={() => <CheckTraining role={role} />} />
      <Route path="/regulations" component={() => <Regulations />} />
      <Route path="/medical-equipment" component={() => <MedicalEquipment role={role} />} />
      <Route path="/stock-usage" component={() => <StockUsage role={role} />} />
      <Route path="/after-hours" component={() => <AfterHours role={role} />} />
      <Route path="/ground-vehicles" component={() => <GroundVehicles role={role} />} />
      <Route path="/engineering" component={() => <Engineering role={role} />} />
      <Route path="/maint-planner" component={() => <MaintenancePlanner role={role} />} />
      <Route path="/asset-utilisation" component={() => <AssetUtilisation role={role} />} />
      <Route path="/idea-hub" component={() => <IdeaHub role={role} />} />
      <Route path="/users" component={() => <UserManagement role={role} />} />
      <Route path="/rbac" component={() => <RBACPermissions role={role} />} />
      <Route path="/settings" component={() => <SystemSettings role={role} />} />
      <Route path="/api-integrations" component={() => <ApiIntegrations role={role} />} />
      <Route path="/ops-tasks" component={() => <OpsTaskManagement role={role} />} />
      <Route path="/projects" component={() => <ProjectManagement role={role} />} />
      <Route path="/pilot-handover" component={() => <PilotHandover role={role} />} />
      <Route path="/sbp-portal" component={() => <SeniorBasePilot role={role} />} />
      <Route path="/org-chart" component={() => <OrgChart role={role} />} />
      <Route path="/payroll-leave" component={() => <PayrollLeave role={role} />} />
      <Route path="/docs" component={() => <DocumentLibrary />} />
      <Route path="/reg-monitor" component={() => <RegulatoryMonitor />} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AuthenticatedApp({ role, setRole }: { role: UserRole; setRole: (r: UserRole) => void }) {
  const { data: session, isLoading } = useQuery({
    queryKey: ["/api/auth/session"],
    queryFn: async () => {
      const base = window.location.hostname.endsWith(".pplx.app") ? "/port/5000" : "";
      const APP_KEY = "98dcf87f14cdd94024310478d34915c15867d888a4c5db09e143431a515ffc64";
      // Retry to handle cold-start 404/503 from pplx.app proxy
      for (let i = 0; i <= 8; i++) {
        try {
          const res = await fetch(`${base}/api/auth/session`, {
            headers: { "X-App-Key": APP_KEY },
            credentials: "include",
          });
          if ((res.status === 503 || res.status === 404) && i < 8) {
            await new Promise(r => setTimeout(r, Math.min((i + 1) * 2000, 8000)));
            continue;
          }
          return await res.json();
        } catch {
          if (i === 8) return { authenticated: false };
          await new Promise(r => setTimeout(r, 2000));
        }
      }
      return { authenticated: false };
    },
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: "#0a1628",
      }}>
        <div style={{ textAlign: "center", fontFamily: "'Cabinet Grotesk', sans-serif" }}>
          <div style={{ color: "white", fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Medivac.ai</div>
          <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>Starting up — please wait…</div>
        </div>
      </div>
    );
  }

  if (!session?.authenticated) {
    return <Login />;
  }

  return (
    <Router hook={useHashLocation}>
      {/* Standalone routes — no Layout wrapper */}
      <Route path="/ops-display" component={OpsRoomDisplay} />
      <Route path="/shift-fleet" component={() => <ShiftFleetStatus role={role} />} />
      {/* All other routes wrapped in Layout */}
      <Route>
        <Layout role={role} onRoleChange={setRole}>
          <ErrorBoundary label="AppRouter">
            <AppRouter role={role} />
          </ErrorBoundary>
        </Layout>
      </Route>
    </Router>
  );
}

function App() {
  const role: UserRole = "admin";

  // Pre-warm the backend sandbox on page load so cold-start 503s never
  // reach the user mid-action. Fires once, silently, no UI impact.
  useEffect(() => {
    const base = (window.location.hostname.endsWith('.pplx.app')) ? '/port/5000' : '';
    const KEY  = "98dcf87f14cdd94024310478d34915c15867d888a4c5db09e143431a515ffc64";
    // Initial warm-up
    fetch(`${base}/api/auth/session`, { headers: { "X-App-Key": KEY }, credentials: "include" }).catch(() => {});
    // Keep-alive ping every 4 minutes so sandbox never goes cold while app is open
    const interval = setInterval(() => {
      fetch(`${base}/api/auth/session`, { headers: { "X-App-Key": KEY }, credentials: "include" }).catch(() => {});
    }, 4 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <AuthenticatedApp role={role} setRole={() => {}} />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
