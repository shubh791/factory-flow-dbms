import BaseChart from "./BaseChart";

/*
=========================================================
DEPARTMENT EFFICIENCY – Executive Intelligence Version
=========================================================
*/

export default function EfficiencyChart({ records }) {
  if (!records || !records.length) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6 flex items-center justify-center h-[380px] text-slate-400 text-sm">
        No production data available.
      </div>
    );
  }

  const departmentMap = {};

  records.forEach((r) => {
    const dept = r.employee?.department?.name;
    if (!dept) return;

    if (!departmentMap[dept]) {
      departmentMap[dept] = { units: 0, defects: 0 };
    }

    departmentMap[dept].units += Number(r.units) || 0;
    departmentMap[dept].defects += Number(r.defects) || 0;
  });

  const departments = Object.keys(departmentMap);

  if (!departments.length) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center text-slate-400">
        No valid department-linked production records found.
      </div>
    );
  }

  const efficiencies = departments.map((dept) => {
    const { units, defects } = departmentMap[dept];
    return units > 0
      ? Number((((units - defects) / units) * 100).toFixed(2))
      : 0;
  });

  const avgEfficiency =
    efficiencies.reduce((a, b) => a + b, 0) /
    efficiencies.length;

  const bestIndex = efficiencies.indexOf(Math.max(...efficiencies));
  const worstIndex = efficiencies.indexOf(Math.min(...efficiencies));

  /* =========================
     ENTERPRISE BAR COLORS
  ========================= */

  const barColors = efficiencies.map((val) => {
    if (val >= 98) return "#16a34a"; // strong green
    if (val >= 95) return "#f59e0b"; // amber
    return "#dc2626"; // red
  });

  /* =========================
     ECHART OPTIONS
  ========================= */

  const options = {
    tooltip: {
      trigger: "axis",
      backgroundColor: "#111827",
      borderWidth: 0,
      textStyle: { color: "#fff" },
      formatter: (params) => {
        const p = params[0];
        return `
          <strong>${p.name}</strong><br/>
          Efficiency: ${p.value}%
        `;
      },
    },

    grid: {
      left: 140,
      right: 40,
      top: 50,
      bottom: 40,
    },

    xAxis: {
      type: "value",
      max: 100,
      axisLabel: { color: "#6b7280" },
      splitLine: { lineStyle: { color: "#f1f5f9" } },
    },

    yAxis: {
      type: "category",
      data: departments,
      axisLabel: {
        color: "#374151",
        fontWeight: 500,
      },
    },

    series: [
      {
        type: "bar",
        data: efficiencies,
        barWidth: 18,
        itemStyle: {
          borderRadius: [10, 10, 10, 10],
          color: (params) => barColors[params.dataIndex],
        },
        label: {
          show: true,
          position: "right",
          formatter: "{c}%",
          color: "#111827",
          fontWeight: 600,
        },
        markLine: {
          symbol: "none",
          lineStyle: {
            type: "dashed",
            color: "#94a3b8",
          },
          label: {
            formatter: "Target 95%",
            color: "#64748b",
          },
          data: [{ xAxis: 95 }],
        },
      },
    ],
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6">

      <div>
        <h2 className="text-xl font-semibold text-slate-900">
          Department Efficiency Intelligence
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Real-time performance comparison powered by relational DBMS.
        </p>
      </div>

      <div className="h-[360px]">
        <BaseChart option={options} />
      </div>

      <div className="grid md:grid-cols-3 gap-6 bg-slate-50 border border-slate-200 rounded-xl p-4">

        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">
            Average Efficiency
          </p>
          <p className="text-lg font-semibold text-slate-900">
            {avgEfficiency.toFixed(2)}%
          </p>
        </div>

        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">
            Best Performing Dept
          </p>
          <p className="text-lg font-semibold text-emerald-600">
            {departments[bestIndex]}
          </p>
        </div>

        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">
            Lowest Performing Dept
          </p>
          <p className="text-lg font-semibold text-red-600">
            {departments[worstIndex]}
          </p>
        </div>

      </div>
    </div>
  );
}