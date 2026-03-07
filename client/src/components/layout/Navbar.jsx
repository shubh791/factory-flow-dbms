import { FaBars } from "react-icons/fa";
import { useLocation } from "react-router-dom";

const Navbar = ({ setSidebarOpen }) => {
  const location = useLocation();

  const getPageTitle = () => {
    switch (location.pathname) {
      case "/":
        return "Executive Overview";
      case "/employees":
        return "Employee Data Management";
      case "/production":
        return "Production Records";
      case "/production-insights":
        return "Production Performance Analysis";
      case "/analytics":
        return "Operations Performance Analysis";
      case "/export-report":
        return "Reporting & Export";
      default:
        return "Industrial DBMS System";
    }
  };

  return (
    <header className="h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 bg-white border-b border-gray-200">

      {/* LEFT SECTION */}
      <div className="flex items-center gap-4">

        {/* Mobile Toggle */}
        <button
          onClick={() => setSidebarOpen(true)}
          className="lg:hidden text-gray-600"
        >
          <FaBars size={18} />
        </button>

        <div>
          <h1 className="text-base sm:text-lg font-semibold text-gray-800">
            {getPageTitle()}
          </h1>
          <p className="hidden sm:block text-xs text-gray-500">
            Impact of DBMS on Organisational Performance
          </p>
        </div>
      </div>

      {/* RIGHT SECTION */}
      <div className="flex items-center gap-4">

        {/* System Status */}
        <div className="hidden sm:flex items-center gap-2 text-xs">
          <span className="w-2 h-2 rounded-full bg-green-500"></span>
          <span className="text-gray-600 font-medium">
            System Operational
          </span>
        </div>

        {/* User */}
        <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center text-sm font-medium">
          A
        </div>

      </div>
    </header>
  );
};

export default Navbar;