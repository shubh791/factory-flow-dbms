/* =========================
   CLEAN NUMBER
========================= */
const cleanNumber = (val) => {
  if (val === null || val === undefined) return 0;
  const num = Number(String(val).replace(/,/g, "").trim());
  return isNaN(num) ? 0 : num;
};

/* =========================
   GENERATE KPI SUMMARY
========================= */
export const generateKPIStats = (rows) => {
  if (!rows || !rows.length) return null;

  const numericColumns = Object.keys(rows[0]).filter((key) =>
    rows.slice(0, 40).some((r) => !isNaN(cleanNumber(r[key])))
  );

  const primaryColumn =
    numericColumns.find(
      (c) =>
        c.toLowerCase().includes("unit") ||
        c.toLowerCase().includes("production")
    ) || numericColumns[0];

  const defectColumn = numericColumns.find((c) =>
    c.toLowerCase().includes("defect")
  );

  const totalRecords = rows.length;

  const totalUnits = primaryColumn
    ? rows.reduce((sum, r) => sum + cleanNumber(r[primaryColumn]), 0)
    : 0;

  const totalDefects = defectColumn
    ? rows.reduce((sum, r) => sum + cleanNumber(r[defectColumn]), 0)
    : 0;

  const averageUnits =
    totalRecords > 0 ? totalUnits / totalRecords : 0;

  /* =========================
     PROFIT DETECTION
  ========================= */
  const revenueColumn = numericColumns.find((c) =>
    c.toLowerCase().includes("revenue")
  );

  const costColumn = numericColumns.find((c) =>
    c.toLowerCase().includes("cost")
  );

  const profitColumn = numericColumns.find((c) =>
    c.toLowerCase().includes("profit")
  );

  let totalProfit = 0;

  if (profitColumn) {
    totalProfit = rows.reduce(
      (sum, r) => sum + cleanNumber(r[profitColumn]),
      0
    );
  } else if (revenueColumn && costColumn) {
    totalProfit = rows.reduce(
      (sum, r) =>
        sum +
        (cleanNumber(r[revenueColumn]) -
          cleanNumber(r[costColumn])),
      0
    );
  }

  /* =========================
     ADVANCED INDUSTRIAL METRICS
  ========================= */

  const defectRate =
    totalUnits > 0 ? (totalDefects / totalUnits) * 100 : 0;

  const efficiency =
    totalUnits > 0
      ? ((totalUnits - totalDefects) / totalUnits) * 100
      : 0;

  const stabilityIndex =
    efficiency * 0.6 + (100 - defectRate) * 0.4;

  return {
    totalRecords,
    primaryColumn,
    totalUnits,
    averageUnits,
    totalProfit,
    totalDefects,
    defectRate: defectRate.toFixed(2),
    efficiency: efficiency.toFixed(2),
    stabilityIndex: stabilityIndex.toFixed(2),
  };
};