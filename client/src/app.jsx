import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState } from "react";

import Sidebar from "./components/layout/Sidebar";
import Navbar from "./components/layout/Navbar";

import Dashboard from "./pages/Dashboard";
import Employees from "./pages/employees/Employees";
import Production from "./pages/production/Production";
import OperationsAnalytics from "./pages/OperationsAnalytics";
import AIAnalyser from "./pages/AIAnalyser";
import ExportReport from "./pages/ExportReport";
import ProductionInsights from "./pages/ProductionInsights";

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <BrowserRouter>
      <div className="flex min-h-screen bg-[#f8fafc]">

        {/* Sidebar */}
        <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />

        {/* Main */}
        <div className="flex-1 flex flex-col">

          <Navbar setSidebarOpen={setSidebarOpen} />

          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/employees" element={<Employees />} />
              <Route path="/production" element={<Production />} />
              <Route path="/production-insights" element={<ProductionInsights />} />
              <Route path="/analytics" element={<OperationsAnalytics />} />
              <Route path="/ai-analyser" element={<AIAnalyser />} />
              <Route path="/export-report" element={<ExportReport />} />
            </Routes>
          </main>

        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;