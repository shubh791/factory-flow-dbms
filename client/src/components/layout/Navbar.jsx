import { FaBars } from "react-icons/fa";

const Navbar = ({ setSidebarOpen }) => {
  return (
    <header className="h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 bg-white border-b shadow-sm">

      {/* LEFT */}
      <div className="flex items-center gap-3">

        {/* Hamburger */}
        <button
          onClick={() => setSidebarOpen(true)}
          className="lg:hidden text-gray-700"
        >
          <FaBars size={18} />
        </button>

        {/* LOGO + BRAND */}
        <div className="flex items-center gap-2">
          <img
            src="/dbmslogo.png"
            alt="Factory Flow Logo"
            className="h-8 w-auto"
          />

          <div>
            <h1 className="text-base sm:text-lg font-semibold text-gray-800 leading-tight">
              Factory Flow
            </h1>
            <p className="hidden sm:block text-xs text-gray-500 -mt-1">
              DBMS Dashboard
            </p>
          </div>
        </div>
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold text-sm">
          S
        </div>

        <span className="hidden sm:block text-gray-700 font-medium">
          Admin
        </span>
      </div>
    </header>
  );
};

export default Navbar;