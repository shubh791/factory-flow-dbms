import { LineChart } from "@mui/x-charts/LineChart";

export default function EmployeeTrendChart({ dataset }) {
  const rows = dataset?.rows || [];

  const cleanNumber = (v) => {
    if (v === null || v === undefined) return 0;
    const num = Number(String(v).replace(/,/g, "").trim());
    return isNaN(num) ? 0 : num;
  };

  const numericColumns = rows.length
    ? Object.keys(rows[0]).filter((key) =>
        rows.slice(0, 40).some((r) => !isNaN(cleanNumber(r[key])))
      )
    : [];

  const numericColumn = numericColumns[1] || numericColumns[0];

  const labelColumn = rows.length
    ? Object.keys(rows[0]).find((key) => key !== numericColumn)
    : null;

  const data = rows.slice(0, 60);

  if (!data.length || !numericColumn) {
    return (
      <div className="bg-white rounded-3xl p-8 shadow border border-gray-100 text-gray-400">
        Upload dataset to visualize trend
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl shadow border border-gray-100 p-6 sm:p-8">

      {/* HEADER */}
      <div className="mb-6">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-800">
          Workforce Trend
        </h2>
        <p className="text-sm text-gray-500">
          Smooth production trend visualization
        </p>
      </div>

      {/* CHART */}
      <LineChart
        height={320}
        margin={{ top: 20, bottom: 30, left: 45, right: 20 }}
        grid={{ vertical: false, horizontal: true }}
        series={[
          {
            data: data.map((r) => cleanNumber(r[numericColumn])),
            label: numericColumn,
            area: true,
            showMark: false,
            curve: "monotoneX", // THIS MAKES WAVES
            color: "#3b82f6",
          },
        ]}
        xAxis={[
          {
            scaleType: "point",
            data: data.map((r, i) =>
              r[labelColumn] || `Row ${i + 1}`
            ),
            tickLabelStyle: {
              fontSize: 11,
              fill: "#6b7280",
            },
          },
        ]}
        yAxis={[
          {
            tickLabelStyle: {
              fontSize: 11,
              fill: "#6b7280",
            },
          },
        ]}
        sx={{
          /* Soft gradient wave fill */
          "& .MuiAreaElement-root": {
            fillOpacity: 0.2,
          },

          "& .MuiChartsAxis-line": {
            stroke: "#e5e7eb",
          },

          "& .MuiChartsGrid-line": {
            stroke: "#f1f5f9",
          },
        }}
      />
    </div>
  );
}