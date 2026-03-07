import BaseChart from "./BaseChart";

/*
=========================================================
MODERN WORKFORCE PRODUCTIVITY CARD
Fixed Version – Correct Active Employees + Defect Logic
=========================================================
*/

export default function EmployeeTrendChart({ records }) {
  if (!records || !records.length) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-8 h-[260px] flex items-center justify-center text-slate-400 text-sm shadow-sm">
        No workforce data available.
      </div>
    );
  }

  const grouped = {};
  const employeeSet = new Set();

  let totalGoodUnits = 0;

  records.forEach((r) => {
    const date = new Date(r.productionDate)
      .toISOString()
      .split("T")[0];

    const units = Number(r.units) || 0;
    const defects = Number(r.defects) || 0;

    // 🔥 subtract defects (real productivity logic)
    const goodUnits = units - defects;

    if (!grouped[date]) grouped[date] = 0;
    grouped[date] += goodUnits;

    totalGoodUnits += goodUnits;

    // 🔥 FIXED HERE (important)
    if (r.employee?.id) {
      employeeSet.add(r.employee.id);
    }
  });

  const dates = Object.keys(grouped).sort(
    (a, b) => new Date(a) - new Date(b)
  );

  const values = dates.map((d) => grouped[d]);

  const totalEmployees = employeeSet.size;

  const avgOutput =
    totalEmployees > 0
      ? Math.round(totalGoodUnits / totalEmployees)
      : 0;

  const options = {
    tooltip: { trigger: "axis" },
    grid: { left: 0, right: 0, top: 10, bottom: 0 },
    xAxis: {
      type: "category",
      show: false,
      data: dates,
    },
    yAxis: {
      type: "value",
      show: false,
    },
    series: [
      {
        type: "line",
        smooth: true,
        data: values,
        symbol: "none",
        lineStyle: {
          width: 3,
          color: "#7c3aed",
        },
        areaStyle: {
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: "rgba(124,58,237,0.35)" },
              { offset: 1, color: "rgba(124,58,237,0.05)" },
            ],
          },
        },
      },
    ],
  };

  return (
    <div className="relative rounded-3xl p-6 space-y-4 overflow-hidden shadow-md border border-purple-100 bg-gradient-to-br from-purple-50 via-white to-purple-100">

      <div className="absolute -top-10 -left-10 w-40 h-40 bg-purple-300 opacity-20 rounded-full blur-3xl"></div>

      <div className="relative">
        <p className="text-xs text-purple-500 uppercase tracking-wide">
          Workforce Productivity
        </p>

        <p className="text-3xl font-semibold text-slate-900">
          {avgOutput.toLocaleString()}
        </p>

        <p className="text-xs text-slate-500 mt-1">
          Active Employees: {totalEmployees}
        </p>
      </div>

      <div className="h-[120px] relative">
        <BaseChart option={options} />
      </div>

    </div>
  );
}