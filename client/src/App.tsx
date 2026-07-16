import { useState, useEffect } from "react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Switch, Route, Router } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import MissionBoard from "@/pages/MissionBoard";
import Roster from "@/pages/Roster";
import Aircraft from "@/pages/Aircraft";
import ISOCompliance from "@/pages/ISOCompliance";
import SpecialMissions from "@/pages/SpecialMissions";
import FerryFlights from "@/pages/FerryFlights";
import Bryan from "@/pages/Bryan";
import BryanLive from "@/pages/BryanLive";
import Jennifer from "@/pages/Jennifer";
import JenniferLive from "@/pages/JenniferLive"; // v2
import DemoMode from "@/pages/DemoMode";
import Dispatch from "@/pages/Dispatch";
import RestCalculatorOps from "@/pages/RestCalculatorOps";
import AuditReports from "@/pages/AuditReports";
import FlightMap from "@/pages/FlightMap";
import FlightPlanning from "@/pages/FlightPlanning";
import DutyFRMS from "@/pages/DutyFRMS";
import AIMissionAnalyst from "@/pages/AIMissionAnalyst";
import TelehealthPortal from "@/pages/TelehealthPortal";
import DocumentAI from "@/pages/DocumentAI";
import ContractCompliance from "@/pages/ContractCompliance";
import FuelFinance from "@/pages/FuelFinance";
import UserManagement from "@/pages/UserManagement";
import RBACPermissions from "@/pages/RBACPermissions";
import SystemSettings from "@/pages/SystemSettings";
import ApiIntegrations from "@/pages/ApiIntegrations";
import CheckTraining from "@/pages/CheckTraining";
import Regulations from "@/pages/Regulations";
import MedicalEquipment from "@/pages/MedicalEquipment";
import StockUsage from "@/pages/StockUsage";
import AfterHours from "@/pages/AfterHours";
import GroundVehicles from "@/pages/GroundVehicles";
import Engineering from "@/pages/Engineering";
import OperationalRiskAssessment from "@/pages/OperationalRiskAssessment";
import MaintenancePlanner from "@/pages/MaintenancePlanner";
import MorningBrief from "@/pages/MorningBrief";
import AssetUtilisation from "@/pages/AssetUtilisation";
import IdeaHub from "@/pages/IdeaHub";
import PassengerManifest from "@/pages/PassengerManifest";
import MissionOptimiser from "@/pages/MissionOptimiser";
import ManifestSign from "@/pages/ManifestSign";
import TechLogEmbed from "@/pages/TechLogEmbed";
import NEPTTasking from "@/pages/NEPTTasking";
import GovernmentTenders from "@/pages/GovernmentTenders";
import Invoicing from "@/pages/Invoicing";
import OpsRoomDisplay from "@/pages/OpsRoomDisplay";
import ShiftFleetStatus from "@/pages/ShiftFleetStatus";
import CharterQuote from "@/pages/CharterQuote";
import CostOptimizer from "@/pages/CostOptimizer";
import OpsTaskManagement from "@/pages/OpsTaskManagement";
import ProjectManagement from "@/pages/ProjectManagement";
import PilotHandover from "@/pages/PilotHandover";
import SeniorBasePilot from "@/pages/SeniorBasePilot";
import OrgChart from "@/pages/OrgChart";
import PayrollLeave from "@/pages/PayrollLeave";
import DocumentLibrary from "@/pages/DocumentLibrary";
import RegulatoryMonitor from "@/pages/RegulatoryMonitor";
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

function App() {
  const [role, setRole] = useState<UserRole>("dispatcher");

  // Pre-warm the backend sandbox on page load so cold-start 503s never
  // reach the user mid-action. Fires once, silently, no UI impact.
  useEffect(() => {
    const base = (window.location.hostname.endsWith('.pplx.app')) ? '/port/5000' : '';
    fetch(`${base}/api/health`).catch(() => {/* ignore — just waking the sandbox */});
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
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
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
