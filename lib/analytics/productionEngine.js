export const generateProductionInsights = (records) => {
  if (!records || !records.length) return null;

  let totalUnits = 0;
  let totalDefects = 0;
  const dateMap = {};

  records.forEach((r) => {
    const units = Number(r.units) || 0;
    const defects = Number(r.defects) || 0;

    totalUnits += units;
    totalDefects += defects;

    const dateKey = new Date(r.productionDate).toISOString().split('T')[0];

    if (!dateMap[dateKey]) {
      dateMap[dateKey] = { units: 0, defects: 0 };
    }

    dateMap[dateKey].units += units;
    dateMap[dateKey].defects += defects;
  });

  const defectRate = totalUnits > 0 ? (totalDefects / totalUnits) * 100 : 0;
  const stability = totalUnits > 0 ? (100 - defectRate).toFixed(2) : 0;

  const sortedDates = Object.entries(dateMap).sort(
    (a, b) => new Date(a[0]) - new Date(b[0])
  );

  const trend = sortedDates.slice(-7).map(([date, data]) => ({
    date,
    units: data.units,
    defects: data.defects,
  }));

  const heatmap = sortedDates.map(([date, data]) => [date, data.defects]);

  let status = 'Operational';
  if (defectRate > 10) status = 'Critical';
  else if (defectRate > 5) status = 'Risk';

  return {
    totalUnits,
    totalDefects,
    defectRate: defectRate.toFixed(2),
    stability,
    trend,
    heatmap,
    forecast:
      trend.length > 0
        ? Math.round(trend.reduce((sum, d) => sum + d.units, 0) / trend.length)
        : 0,
    status,
  };
};
