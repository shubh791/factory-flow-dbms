import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState } from "react";

import Sidebar from "./components/layout/Sidebar";
import Navbar from "./components/layout/Navbar";

import Dashboard from "./pages/dashboard/Dashboard";
import Employees from "./pages/employees/Employees";
import Production from "./pages/production/Production";
import ExportReport from "./pages/ExportReport";
import ProductionInsights from "./pages/ProductionInsights";
import ProductionMonitoring from "./pages/analytics/ProductionMonitoring";
import DepartmentPerformance from "./pages/analytics/DepartmentPerformance";
import PromotionManagement from "./pages/administration/PromotionManagement";
import AuditLogs from "./pages/administration/AuditLogs";
import RoleManagement from "./pages/administration/RoleManagement";
import SystemSummary from "./pages/administration/SystemSummary";

import DbmsImpact from "./pages/administration/DbmsImpact";
import DecisionSupport from "./pages/analytics/DecisionSupport";


function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <BrowserRouter>
      <div className="flex min-h-screen bg-slate-100">

        {/* ================= SIDEBAR ================= */}
        <Sidebar
          open={sidebarOpen}
          setOpen={setSidebarOpen}
        />

        {/* ================= MAIN AREA ================= */}
        <div className="flex-1 flex flex-col">

          {/* Navbar */}
          <Navbar setSidebarOpen={setSidebarOpen} />

          {/* Page Content */}
          <main className="flex-1 overflow-y-auto">
            <div className="p-6 md:p-8 lg:p-10 max-w-[1600px] mx-auto">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/employees" element={<Employees />} />
                <Route path="/production" element={<Production />} />
                <Route
                  path="/production-insights"
                  element={<ProductionInsights />}
                />
                
                <Route
                  path="/export-report"
                  element={<ExportReport />}
                />
                <Route path="/production-monitoring" element={<ProductionMonitoring />} />
                <Route path="/department-performance" element={<DepartmentPerformance />} />
                <Route path="/promotion-management" element={<PromotionManagement />} />
                <Route path="/audit-logs" element={<AuditLogs />} />
                <Route path="/role-management" element={<RoleManagement />} />
                <Route path="/system-summary" element={<SystemSummary />} />
                <Route path="/dbms-impact" element={<DbmsImpact />} />
                <Route path="/decision-support" element={<DecisionSupport />} />
               
                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </div>
          </main>

        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;