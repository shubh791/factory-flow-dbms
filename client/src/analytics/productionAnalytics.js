/* =========================
   CLEAN NUMBER
========================= */
export const cleanNumber = (value) => {
  if (value === null || value === undefined) return 0;

  const num = Number(String(value).replace(/,/g, "").trim());
  return isNaN(num) ? 0 : num;
};

/* =========================
   DETECT NUMERIC COLUMN
========================= */
export const detectProductionColumn = (rows) => {
  if (!rows.length) return null;

  const keys = Object.keys(rows[0]);

  return (
    keys.find((key) =>
      key.toLowerCase().includes("production") ||
      key.toLowerCase().includes("units") ||
      key.toLowerCase().includes("output")
    ) ||
    keys.find((key) =>
      rows.slice(0, 30).some((r) => !isNaN(cleanNumber(r[key])))
    )
  );
};

/* =========================
   DETECT LABEL COLUMN
========================= */
export const detectLabelColumn = (rows, numericColumn) => {
  if (!rows.length) return null;

  const keys = Object.keys(rows[0]);

  return (
    keys.find((key) =>
      key.toLowerCase().includes("date") ||
      key.toLowerCase().includes("month")
    ) ||
    keys.find((k) => k !== numericColumn)
  );
};

/* =========================
   GENERATE ECHART OPTIONS
========================= */
export const getProductionChartOptions = (rows) => {
  if (!rows.length) return null;

  const numericColumn = detectProductionColumn(rows);
  const labelColumn = detectLabelColumn(rows, numericColumn);

  if (!numericColumn) return null;

  const data = rows.slice(0, 50);

  return {
    tooltip: {
      trigger: "axis",
    },
    grid: {
      left: 50,
      right: 20,
      top: 40,
      bottom: 50,
    },
    xAxis: {
      type: "category",
      data: data.map((r, i) =>
        r[labelColumn] || `Row ${i + 1}`
      ),
      axisLine: {
        lineStyle: { color: "#e5e7eb" },
      },
      axisLabel: {
        color: "#6b7280",
      },
    },
    yAxis: {
      type: "value",
      axisLine: {
        lineStyle: { color: "#e5e7eb" },
      },
      axisLabel: {
        color: "#6b7280",
      },
      splitLine: {
        lineStyle: { color: "#f1f5f9" },
      },
    },
    series: [
      {
        name: "Production",
        type: "line",
        smooth: true,
        areaStyle: {},
        data: data.map((r) =>
          cleanNumber(r[numericColumn])
        ),
      },
    ],
  };
};
/* =========================
   EMPLOYEE TREND OPTIONS
========================= */
export const getEmployeeTrendOptions = (rows) => {
  if (!rows.length) return null;

  const keys = Object.keys(rows[0]);

  const cleanNumber = (value) => {
    if (value === null || value === undefined) return 0;
    const num = Number(String(value).replace(/,/g, "").trim());
    return isNaN(num) ? 0 : num;
  };

  const numericColumns = keys.filter((key) =>
    rows.slice(0, 40).some((r) => !isNaN(cleanNumber(r[key])))
  );

  const numericColumn = numericColumns[1] || numericColumns[0];
  const labelColumn = keys.find((k) => k !== numericColumn);

  if (!numericColumn) return null;

  const data = rows.slice(0, 60);

  return {
    tooltip: {
      trigger: "axis",
    },
    grid: {
      left: 50,
      right: 20,
      top: 40,
      bottom: 40,
    },
    xAxis: {
      type: "category",
      data: data.map((r, i) =>
        r[labelColumn] || `Row ${i + 1}`
      ),
      axisLine: {
        lineStyle: { color: "#e5e7eb" },
      },
      axisLabel: {
        color: "#6b7280",
      },
    },
    yAxis: {
      type: "value",
      axisLine: {
        lineStyle: { color: "#e5e7eb" },
      },
      axisLabel: {
        color: "#6b7280",
      },
      splitLine: {
        lineStyle: { color: "#f1f5f9" },
      },
    },
    series: [
      {
        name: numericColumn,
        type: "line",
        smooth: true,
        areaStyle: {
          opacity: 0.2,
        },
        data: data.map((r) =>
          cleanNumber(r[numericColumn])
        ),
      },
    ],
  };
};
/* =========================
   EFFICIENCY CHART OPTIONS
========================= */
export const getEfficiencyChartOptions = (rows) => {
  if (!rows.length) return null;

  const cleanNumber = (value) => {
    if (value === null || value === undefined) return 0;
    const num = Number(String(value).replace(/,/g, "").trim());
    return isNaN(num) ? 0 : num;
  };

  const keys = Object.keys(rows[0]);

  const departmentColumn =
    keys.find((key) =>
      key.toLowerCase().includes("department")
    ) || keys[0];

  const efficiencyColumn =
    keys.find((key) =>
      key.toLowerCase().includes("efficiency")
    ) ||
    keys.find((key) =>
      key.toLowerCase().includes("rate")
    );

  if (!efficiencyColumn) return null;

  const grouped = {};

  rows.forEach((row) => {
    const dept = row[departmentColumn] || "Unknown";
    const value = cleanNumber(row[efficiencyColumn]);

    if (!grouped[dept]) grouped[dept] = [];
    grouped[dept].push(value);
  });

  const departments = Object.keys(grouped);

  const averages = departments.map((dept) => {
    const values = grouped[dept];
    const avg =
      values.reduce((sum, v) => sum + v, 0) / values.length;
    return Number(avg.toFixed(2));
  });

  return {
    tooltip: {
      trigger: "axis",
    },
    grid: {
      left: 50,
      right: 20,
      top: 40,
      bottom: 50,
    },
    xAxis: {
      type: "category",
      data: departments,
      axisLine: {
        lineStyle: { color: "#e5e7eb" },
      },
      axisLabel: {
        color: "#6b7280",
      },
    },
    yAxis: {
      type: "value",
      axisLine: {
        lineStyle: { color: "#e5e7eb" },
      },
      axisLabel: {
        color: "#6b7280",
      },
      splitLine: {
        lineStyle: { color: "#f1f5f9" },
      },
    },
    series: [
      {
        name: "Efficiency %",
        type: "bar",
        data: averages,
        itemStyle: {
          borderRadius: [6, 6, 0, 0],
        },
      },
    ],
  };
};
/* =========================
   ERROR RATE / DEFECT RATIO
========================= */
export const getErrorRateOptions = (rows) => {
  if (!rows.length) return null;

  const cleanNumber = (value) => {
    if (value === null || value === undefined) return 0;
    const num = Number(String(value).replace(/,/g, "").trim());
    return isNaN(num) ? 0 : num;
  };

  const keys = Object.keys(rows[0]);

  const totalColumn = keys.find((k) =>
    k.toLowerCase().includes("unit")
  );

  const defectColumn = keys.find((k) =>
    k.toLowerCase().includes("defect")
  );

  const goodColumn = keys.find((k) =>
    k.toLowerCase().includes("good")
  );

  if (!totalColumn && !defectColumn && !goodColumn) {
    return null;
  }

  let totalUnits = 0;
  let defects = 0;
  let goodUnits = 0;

  rows.forEach((row) => {
    totalUnits += cleanNumber(row[totalColumn]);
    defects += cleanNumber(row[defectColumn]);

    if (goodColumn) {
      goodUnits += cleanNumber(row[goodColumn]);
    }
  });

  if (!goodColumn) {
    goodUnits = Math.max(totalUnits - defects, 0);
  }

  if (goodUnits <= 0 && defects <= 0) return null;

  return {
    tooltip: {
      trigger: "item",
    },
    legend: {
      bottom: 0,
      textStyle: {
        color: "#6b7280",
      },
    },
    series: [
      {
        name: "Quality Distribution",
        type: "pie",
        radius: ["45%", "70%"], // donut style
        avoidLabelOverlap: true,
        itemStyle: {
          borderRadius: 6,
        },
        label: {
          show: true,
          formatter: "{b}: {d}%",
        },
        data: [
          {
            value: goodUnits,
            name: "Good Units",
          },
          {
            value: defects,
            name: "Defects",
          },
        ],
      },
    ],
  };
};