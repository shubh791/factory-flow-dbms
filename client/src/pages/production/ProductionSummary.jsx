import FactoryIcon from "@mui/icons-material/Factory";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";

export default function ProductionSummary({ insights }) {
  if (!insights) return null;

  const {
    totalUnits,
    totalDefects,
    defectRate,
    topProduct,
    worstProduct,
  } = insights;

  const Card = ({ icon, title, value, accent }) => (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
      <div
        className={`w-10 h-10 flex items-center justify-center rounded-lg mb-3 ${accent}`}
      >
        {icon}
      </div>
      <p className="text-xs text-gray-500">{title}</p>
      <h3 className="text-xl font-semibold text-gray-900 mt-1">
        {value}
      </h3>
    </div>
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-6">

      <Card
        icon={<FactoryIcon fontSize="small" />}
        title="Total Units Produced"
        value={totalUnits.toLocaleString()}
        accent="bg-slate-100 text-slate-700"
      />

      <Card
        icon={<ReportProblemIcon fontSize="small" />}
        title="Total Defective Units"
        value={totalDefects.toLocaleString()}
        accent="bg-red-100 text-red-600"
      />

      <Card
        icon={<TrendingUpIcon fontSize="small" />}
        title="Defect Rate"
        value={`${Number(defectRate).toFixed(2)}%`}
        accent="bg-blue-100 text-blue-600"
      />

      <Card
        icon={<EmojiEventsIcon fontSize="small" />}
        title="Top Performing Product"
        value={topProduct?.name || "N/A"}
        accent="bg-green-100 text-green-600"
      />

      <Card
        icon={<WarningAmberIcon fontSize="small" />}
        title="Lowest Performing Product"
        value={worstProduct?.name || "N/A"}
        accent="bg-yellow-100 text-yellow-700"
      />

    </div>
  );
}