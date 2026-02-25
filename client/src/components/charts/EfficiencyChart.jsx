import { BarChart } from "@mui/x-charts/BarChart";

export default function EfficiencyChart({ dataset }) {
  const rows = dataset?.rows || [];

  const cleanNumber = (v) => {
    if (v === null || v === undefined) return 0;
    const num = Number(String(v).replace(/,/g, "").trim());
    return isNaN(num) ? 0 : num;
  };

  /* EMPTY STATE */
  if (!rows.length) {
    return (
      <div className="bg-white rounded-2xl shadow border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-2">
          Department Efficiency
        </h2>
        <div className="h-[240px] sm:h-[280px] flex items-center justify-center text-gray-400 text-sm">
          Upload dataset to visualize efficiency
        </div>
      </div>
    );
  }

  /* Detect department column */
  const departmentColumn =
    Object.keys(rows[0]).find((key) =>
      key.toLowerCase().includes("department")
    ) || Object.keys(rows[0])[0];

  /* Detect efficiency column */
  const efficiencyColumn =
    Object.keys(rows[0]).find((key) =>
      key.toLowerCase().includes("efficiency")
    ) ||
    Object.keys(rows[0]).find((key) =>
      key.toLowerCase().includes("rate")
    );

  if (!efficiencyColumn) {
    return (
      <div className="bg-white rounded-2xl shadow border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-800">
          Department Efficiency
        </h2>
        <div className="h-[240px] sm:h-[280px] flex items-center justify-center text-gray-400 text-sm">
          No efficiency column detected
        </div>
      </div>
    );
  }

  /* GROUP DATA */
  const grouped = {};

  rows.forEach((row) => {
    const dept = row[departmentColumn];
    const value = cleanNumber(row[efficiencyColumn]);

    if (!grouped[dept]) grouped[dept] = [];
    grouped[dept].push(value);
  });

  const departments = Object.keys(grouped);

  const averages = departments.map((dept) => {
    const values = grouped[dept];
    return (
      values.reduce((sum, v) => sum + v, 0) / values.length
    ).toFixed(2);
  });

  return (
    <div
      className="
        bg-white
        rounded-2xl
        shadow
        border border-gray-100
        p-4 sm:p-6
        transition
        hover:shadow-md
      "
    >
      {/* HEADER */}
      <div className="mb-4 sm:mb-6">
        <h2 className="text-lg font-semibold text-gray-800">
          Department Efficiency
        </h2>
        <p className="text-sm text-gray-500">
          Average efficiency by department (%)
        </p>
      </div>

      {/* CHART */}
      <div className="overflow-x-auto">
        <BarChart
          height={window.innerWidth < 640 ? 260 : 320}
          margin={{ top: 20, bottom: 40, left: 50, right: 20 }}
          series={[
            {
              data: averages,
              label: "Efficiency %",
              color: "#10b981",
            },
          ]}
          xAxis={[
            {
              scaleType: "band",
              data: departments,
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
    </div>
  );
}