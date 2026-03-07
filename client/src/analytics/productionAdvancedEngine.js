export const advancedProductionAnalytics = (rows) => {
  if (!rows || rows.length === 0) return null;

  const clean = (v) => {
    const n = Number(String(v || 0).replace(/,/g, ""));
    return isNaN(n) ? 0 : n;
  };

  /* ================= MONTHLY AGGREGATION ================= */

  const monthly = {};

  rows.forEach((r) => {
    if (!r.Date) return;

    const d = new Date(r.Date);
    const key = `${d.getFullYear()}-${d.getMonth() + 1}`;

    if (!monthly[key]) {
      monthly[key] = { units: 0, defects: 0 };
    }

    monthly[key].units += clean(r.Units);
    monthly[key].defects += clean(r.Defects);
  });

  const months = Object.keys(monthly).sort(
    (a, b) => new Date(a) - new Date(b)
  );

  const unitsTrend = months.map((m) => monthly[m].units);
  const defectTrend = months.map((m) => monthly[m].defects);

  /* ================= EFFICIENCY DROP DETECTION ================= */

  const efficiencyTrend = unitsTrend.map((u, i) =>
    u > 0 ? ((u - defectTrend[i]) / u) * 100 : 0
  );

  const efficiencyDrop =
    efficiencyTrend.length > 1 &&
    efficiencyTrend.at(-1) < efficiencyTrend.at(-2) - 5;

  /* ================= LINEAR REGRESSION ================= */

  const linearRegression = (data) => {
    const n = data.length;
    if (n === 0) return 0;

    const x = [...Array(n).keys()];
    const y = data;

    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);

    const slope =
      (n * sumXY - sumX * sumY) /
      (n * sumXX - sumX * sumX || 1);

    const intercept = (sumY - slope * sumX) / n;

    return intercept + slope * n;
  };

  const predictedUnits = Math.round(linearRegression(unitsTrend));
  const predictedDefects = Math.round(
    linearRegression(defectTrend)
  );

  /* ================= PLANT WISE COMPARISON ================= */

  const plantMap = {};

  rows.forEach((r) => {
    const plant = r.Plant || r.Location || "Default";

    if (!plantMap[plant]) {
      plantMap[plant] = { units: 0, defects: 0 };
    }

    plantMap[plant].units += clean(r.Units);
    plantMap[plant].defects += clean(r.Defects);
  });

  const plantComparison = Object.entries(plantMap).map(
    ([plant, data]) => ({
      plant,
      efficiency:
        data.units > 0
          ? ((data.units - data.defects) / data.units) * 100
          : 0,
    })
  );

  const worstPlant = plantComparison.sort(
    (a, b) => a.efficiency - b.efficiency
  )[0];

  return {
    months,
    unitsTrend,
    defectTrend,
    efficiencyDrop,
    predictedUnits,
    predictedDefects,
    plantComparison,
    worstPlant,
  };
};