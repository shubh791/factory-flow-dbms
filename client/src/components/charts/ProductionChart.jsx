import { LineChart } from "@mui/x-charts/LineChart";

export default function ProductionChart({ dataset }) {
  const rows = dataset?.rows || [];

  const cleanNumber = (v) => {
    if (v === null || v === undefined) return 0;
    const num = Number(String(v).replace(/,/g, "").trim());
    return isNaN(num) ? 0 : num;
  };

  /* Prefer production column */
  const numericColumn = rows.length
    ? Object.keys(rows[0]).find((key) =>
        key.toLowerCase().includes("production") ||
        key.toLowerCase().includes("units") ||
        key.toLowerCase().includes("output")
      ) ||
      Object.keys(rows[0]).find((key) =>
        rows.slice(0, 30).some(r => !isNaN(cleanNumber(r[key])))
      )
    : null;

  /* Prefer date/month column */
  const labelColumn = rows.length
    ? Object.keys(rows[0]).find((key) =>
        key.toLowerCase().includes("date") ||
        key.toLowerCase().includes("month")
      ) ||
      Object.keys(rows[0]).find((k) => k !== numericColumn)
    : null;

  const data = rows.slice(0, 40);

  /* Responsive height */
  const chartHeight =
    typeof window !== "undefined" && window.innerWidth < 640
      ? 260
      : 320;

  return (
    <div className="
      bg-white
      rounded-3xl
      shadow-lg
      border border-gray-100
      p-4 sm:p-6 lg:p-8
      transition hover:shadow-xl
    ">

      <div className="mb-4 sm:mb-6">
        <h2 className="text-lg font-semibold text-gray-800">
          Production Trend
        </h2>
        <p className="text-sm text-gray-500">
          Monthly production performance overview
        </p>
      </div>

      {!data.length || !numericColumn ? (
        <div className="
          h-[240px] sm:h-[320px]
          flex items-center justify-center
          text-gray-400 text-sm
        ">
          Upload dataset to visualize production
        </div>
      ) : (
        <div className="overflow-x-auto">
          <LineChart
            height={chartHeight}
            margin={{ top: 20, bottom: 40, left: 50, right: 20 }}
            series={[
              {
                data: data.map((r) => cleanNumber(r[numericColumn])),
                label: "Production",
                showMark: false,
                area: true,
                curve: "monotoneX",
                color: "#2563eb",
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
            grid={{ vertical: false, horizontal: true }}
            sx={{
              "& .MuiChartsGrid-line": {
                stroke: "#f1f5f9",
              },
              "& .MuiChartsAxis-line": {
                stroke: "#e5e7eb",
              },
            }}
          />
        </div>
      )}
    </div>
  );
}