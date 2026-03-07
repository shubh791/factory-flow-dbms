import BaseChart from "./BaseChart";

/*
=========================================================
QUALITY INDEX – Executive Industrial Version
Centralized DBMS Quality Monitoring
=========================================================
*/

export default function ErrorRateChart({ records }) {
  if (!records || !records.length) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6 flex items-center justify-center h-[380px] text-slate-400 text-sm">
        No production data available.
      </div>
    );
  }

  const totalUnits = records.reduce(
    (sum, r) => sum + (Number(r.units) || 0),
    0
  );

  const totalDefects = records.reduce(
    (sum, r) => sum + (Number(r.defects) || 0),
    0
  );

  const goodUnits = Math.max(totalUnits - totalDefects, 0);

  const defectRate =
    totalUnits > 0
      ? ((totalDefects / totalUnits) * 100).toFixed(2)
      : 0;

  const qualityIndex = (100 - defectRate).toFixed(2);

  /* =========================
     ENTERPRISE DONUT OPTIONS
  ========================= */

  const options = {
    tooltip: {
      trigger: "item",
      backgroundColor: "#111827",
      borderWidth: 0,
      textStyle: { color: "#fff" },
      formatter: (params) => {
        return `
          <strong>${params.name}</strong><br/>
          Value: ${params.value.toLocaleString()}<br/>
          Ratio: ${params.percent}%
        `;
      },
    },

    legend: {
      bottom: 0,
      textStyle: { color: "#6b7280" },
    },

    series: [
      {
        name: "Quality Distribution",
        type: "pie",
        radius: ["55%", "75%"],
        center: ["50%", "45%"],
        avoidLabelOverlap: true,
        itemStyle: {
          borderRadius: 10,
        },
        label: {
          show: false,
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 16,
            fontWeight: 600,
          },
        },
        data: [
          {
            value: goodUnits,
            name: "Good Units",
            itemStyle: {
              color: {
                type: "linear",
                x: 0,
                y: 0,
                x2: 1,
                y2: 1,
                colorStops: [
                  { offset: 0, color: "#16a34a" },
                  { offset: 1, color: "#4ade80" },
                ],
              },
            },
          },
          {
            value: totalDefects,
            name: "Defective Units",
            itemStyle: {
              color: {
                type: "linear",
                x: 0,
                y: 0,
                x2: 1,
                y2: 1,
                colorStops: [
                  { offset: 0, color: "#dc2626" },
                  { offset: 1, color: "#f87171" },
                ],
              },
            },
          },
        ],
      },
    ],
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6">

      {/* HEADER */}
      <div>
        <h2 className="text-xl font-semibold text-slate-900">
          Quality Index & Defect Ratio
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Enterprise-grade quality monitoring powered by relational DBMS.
        </p>
      </div>

      {/* QUALITY METRIC STRIP */}
      <div className="grid grid-cols-2 gap-6 bg-slate-50 border border-slate-200 rounded-xl p-4">

        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">
            Defect Rate
          </p>
          <p className="text-lg font-semibold text-red-600">
            {defectRate}%
          </p>
        </div>

        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">
            Quality Index
          </p>
          <p className="text-lg font-semibold text-emerald-600">
            {qualityIndex}%
          </p>
        </div>

      </div>

      {/* DONUT CHART */}
      <div className="relative h-[380px] flex items-center justify-center">
        <BaseChart option={options} />

        {/* CENTER OVERLAY */}
        <div className="absolute text-center">
          <p className="text-sm text-slate-500 uppercase tracking-wide">
            Quality Index
          </p>
          <p className="text-3xl font-bold text-slate-900">
            {qualityIndex}%
          </p>
        </div>
      </div>

    </div>
  );
}