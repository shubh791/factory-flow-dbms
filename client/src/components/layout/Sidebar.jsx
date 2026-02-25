import { NavLink } from "react-router-dom";
import {
  FaChartBar,
  FaUsers,
  FaIndustry,
  FaTimes,
  FaBrain,
  FaFilePdf,
  FaChartLine,
} from "react-icons/fa";

const Sidebar = ({ open, setOpen }) => {
  const linkStyle = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200
     ${
       isActive
         ? "bg-blue-600 text-white shadow-md"
         : "text-gray-600 hover:bg-gray-100 hover:text-gray-800"
     }`;

  return (
    <>
      {/* Mobile Overlay */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static
          top-0 left-0 z-50
          w-64 h-full bg-white
          border-r border-gray-200
          p-6
          transform transition-transform duration-300 ease-in-out
          ${open ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0
        `}
      >
        {/* LOGO HEADER */}
        <div className="flex justify-between items-center mb-10">

          <div className="flex items-center gap-3">
            <img
              src="/dbmslogo.png"
              alt="Factory Flow Logo"
              className="h-9 w-auto"
            />

            <div>
              <h2 className="text-lg font-bold text-gray-800 leading-tight">
                Factory Flow
              </h2>
              <p className="text-xs text-gray-500 -mt-1">
                DBMS Dashboard
              </p>
            </div>
          </div>

          <button
            onClick={() => setOpen(false)}
            className="lg:hidden text-gray-600"
          >
            <FaTimes size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="space-y-2">

          <NavLink to="/" onClick={() => setOpen(false)} className={linkStyle}>
            <FaChartBar />
            Dashboard
          </NavLink>

          <NavLink to="/employees" onClick={() => setOpen(false)} className={linkStyle}>
            <FaUsers />
            Employees
          </NavLink>

          <NavLink to="/production" onClick={() => setOpen(false)} className={linkStyle}>
            <FaIndustry />
            Production
          </NavLink>

          <NavLink to="/production-insights" onClick={() => setOpen(false)} className={linkStyle}>
            <FaChartLine />
            Production Intelligence
          </NavLink>

          <NavLink to="/analytics" onClick={() => setOpen(false)} className={linkStyle}>
            <FaChartBar />
            Operations Analytics
          </NavLink>

          <NavLink to="/ai-analyser" onClick={() => setOpen(false)} className={linkStyle}>
            <FaBrain />
            AI Analyzer
          </NavLink>

          <NavLink to="/export-report" onClick={() => setOpen(false)} className={linkStyle}>
            <FaFilePdf />
            Export Report
          </NavLink>

        </nav>
      </aside>
    </>
  );
};

export default Sidebar;