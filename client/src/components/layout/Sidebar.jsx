import { NavLink } from "react-router-dom";
import {
  FaUsers,
  FaIndustry,
  FaTimes,
  FaFilePdf,
  FaChartLine,
  FaUserTie,
  FaUserShield,
  FaClipboardList,
  FaBuilding,
  FaDatabase,
  FaBalanceScale,
  FaTachometerAlt,
  FaBolt,
} from "react-icons/fa";

/*
=============================================================================
INDUSTRIAL DBMS SIDEBAR
Project: Impact of DBMS on Industrial Performance

Design Philosophy:
• Enterprise structured hierarchy
• Clear separation of operational & governance layers
• Config-driven architecture
• Clean academic tone
=============================================================================
*/

const Sidebar = ({ open, setOpen }) => {

  /* =========================================================
     ACTIVE LINK STYLE
     Keeps UI consistent & enterprise-grade
  ========================================================= */
  const linkStyle = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-2.5 rounded-md text-sm transition
     ${
       isActive
         ? "bg-slate-900 text-white"
         : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
     }`;

  /* =========================================================
     CONFIG-DRIVEN NAVIGATION STRUCTURE
  ========================================================= */
  const sections = [
    {
      title: "Overview",
      items: [
        {
          name: "Executive Dashboard",
          path: "/",
          icon: <FaTachometerAlt size={14} />,
        },
      ],
    },
    {
      title: "Operational Management",
      items: [
        {
          name: "Employees",
          path: "/employees",
          icon: <FaUsers size={14} />,
        },
        {
          name: "Production",
          path: "/production",
          icon: <FaIndustry size={14} />,
        },
      ],
    },
    {
      title: "Performance & Analytics",
      items: [
        {
          name: "Production Monitoring",
          path: "/production-monitoring",
          icon: <FaChartLine size={14} />,
        },
        {
          name: "Production Insights",
          path: "/production-insights",
          icon: <FaBuilding size={14} />,
        },
        {
          name: "Department Performance",
          path: "/department-performance",
          icon: <FaBalanceScale size={14} />,
        },
        
        {
          name: "Decision Support Index",
          path: "/decision-support",
          icon: <FaBalanceScale size={14} />,
        },
      
      ],
    },
    {
      title: "Governance & Control",
      items: [
        
        {
          name: "Promotion Management",
          path: "/promotion-management",
          icon: <FaUserTie size={14} />,
        },
        {
          name: "Role Management",
          path: "/role-management",
          icon: <FaUserShield size={14} />,
        },
        {
          name: "Audit Logs",
          path: "/audit-logs",
          icon: <FaClipboardList size={14} />,
        },
        {
          name: "DBMS Impact Analysis",
          path: "/dbms-impact",
          icon: <FaBalanceScale size={14} />,
        },
      ],
    },
    {
      title: "Reporting",
      items: [
        {
          name: "System Summary",
          path: "/system-summary",
          icon: <FaChartLine size={14} />,
        },
        {
          name: "Export Report",
          path: "/export-report",
          icon: <FaFilePdf size={14} />,
        },
      ],
    },
  ];

  return (
    <>
      {/* ================= MOBILE OVERLAY ================= */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
        />
      )}

      {/* ================= SIDEBAR CONTAINER ================= */}
      <aside
        className={`
          fixed lg:static
          top-0 left-0 z-50
          w-72 h-full
          bg-white
          border-r border-slate-200
          p-6
          transform transition-transform duration-300
          ${open ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0
        `}
      >
        {/* ================= HEADER ================= */}
        <div className="flex justify-between items-center mb-8">

          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Industrial DBMS
            </h2>
            <p className="text-xs text-slate-500">
              Impact on Industrial Performance
            </p>
          </div>

          <button
            onClick={() => setOpen(false)}
            className="lg:hidden text-slate-600"
          >
            <FaTimes size={16} />
          </button>
        </div>

        {/* ================= NAVIGATION ================= */}
        <nav className="space-y-6 overflow-y-auto h-[85%] pr-2">

          {sections.map((section, idx) => (
            <div key={idx}>
              <p className="text-[11px] uppercase tracking-wider text-slate-400 mb-2">
                {section.title}
              </p>

              <div className="space-y-1">
                {section.items.map((item, i) => (
                  <NavLink
                    key={i}
                    to={item.path}
                    onClick={() => setOpen(false)}
                    className={linkStyle}
                  >
                    {item.icon}
                    {item.name}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}

        </nav>
      </aside>
    </>
  );
};

export default Sidebar;