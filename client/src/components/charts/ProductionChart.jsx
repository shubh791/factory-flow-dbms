import BaseChart from "./BaseChart";

/*
=========================================================
MODERN PRODUCTION OUTPUT CARD
Soft gradient | Clean UI | Executive style
=========================================================
*/

export default function ProductionChart({ records }) {
  if (!records || !records.length) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-8 h-[260px] flex items-center justify-center text-slate-400 text-sm shadow-sm">
        No production data available.
      </div>
    );
  }

  /* ================= GROUP BY DATE ================= */

  const grouped = {};

  records.forEach((r) => {
    const date = new Date(r.productionDate)
      .toISOString()
      .split("T")[0];

    if (!grouped[date]) grouped[date] = 0;
    grouped[date] += Number(r.units) || 0;
  });

  const dates = Object.keys(grouped).sort(
    (a, b) => new Date(a) - new Date(b)
  );

  const values = dates.map((d) => grouped[d]);

  const totalUnits = values.reduce((a, b) => a + b, 0);
  const lastDate = dates[dates.length - 1];

  /* ================= CHART OPTIONS ================= */

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
          color: "#2563eb",
        },
        areaStyle: {
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: "rgba(37,99,235,0.35)" },
              { offset: 1, color: "rgba(37,99,235,0.05)" },
            ],
          },
        },
      },
    ],
  };

  return (
   
    <div className="relative rounded-3xl p-6 space-y-4 overflow-hidden shadow-md border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-blue-100">

  <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-300 opacity-20 rounded-full blur-3xl"></div>

  <div className="relative">
    <p className="text-xs text-blue-500 uppercase tracking-wide">
      Latest Production
    </p>
    <p className="text-3xl font-semibold text-slate-900">
      {totalUnits.toLocaleString()}
    </p>
    <p className="text-xs text-slate-500 mt-1">
      Last updated: {lastDate}
    </p>
  </div>

  <div className="h-[120px] relative">
    <BaseChart option={options} />
  </div>

</div>
     
  );
}