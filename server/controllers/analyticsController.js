import prisma from "../prisma/client.js";

/* ======================================================
   BASIC ANALYTICS SUMMARY (Used in Dashboard)
====================================================== */
export const getAnalyticsSummary = async (req, res) => {
  try {

    const records = await prisma.production.findMany({
      include: { product: true },
    });

    if (!records.length) return res.json({ empty: true });

    let totalUnits = 0;
    let totalDefects = 0;
    let revenue = 0;
    let cost = 0;

    const productMap = {};
    const employeeSet = new Set();

    records.forEach((r) => {

      const units = Number(r.units) || 0;
      const defects = Number(r.defects) || 0;

      const goodUnits = units - defects;

      totalUnits += units;
      totalDefects += defects;

      /* ===== FIXED FINANCIAL LOGIC ===== */

      revenue += goodUnits * (r.product?.unitPrice || 0);
      cost += units * (r.product?.unitCost || 0);

      /* ===== PRODUCT STATS ===== */

      if (!productMap[r.product.name]) {
        productMap[r.product.name] = {
          units: 0,
          defects: 0,
        };
      }

      productMap[r.product.name].units += units;
      productMap[r.product.name].defects += defects;

      /* ===== ACTIVE EMPLOYEES ===== */

      if (r.employeeId) {
        employeeSet.add(r.employeeId);
      }

    });

    const efficiency =
      totalUnits > 0
        ? ((totalUnits - totalDefects) / totalUnits) * 100
        : 0;

    const profit = revenue - cost;

    const activeEmployees = employeeSet.size;

    const workforceProductivity =
      activeEmployees > 0
        ? Math.round(totalUnits / activeEmployees)
        : 0;

    res.json({
      totalUnits,
      totalDefects,
      efficiency: Number(efficiency.toFixed(2)),
      revenue,
      cost,
      profit,
      activeEmployees,
      workforceProductivity,
      productStats: productMap,
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({
      error: "Analytics fetch failed",
    });
  }
};
/* ======================================================
   PRODUCTION INSIGHTS (Enterprise Analytics)
====================================================== */
export const getProductionInsights = async (req, res) => {
  try {
    const records = await prisma.production.findMany({
      include: {
        product: true, // 🔥 include pricing
        employee: {
          include: {
            department: true,
          },
        },
      },
      orderBy: {
        productionDate: "asc",
      },
    });

    if (!records.length) {
      return res.json(null);
    }

    let totalUnits = 0;
    let totalDefects = 0;
    let revenue = 0;
    let cost = 0;

    const monthlyMap = {};
    const departmentMap = {};

    records.forEach((r) => {
      const units = Number(r.units) || 0;
      const defects = Number(r.defects) || 0;

      totalUnits += units;
      totalDefects += defects;

      // 🔥 DB-driven financial logic
      revenue += units * (r.product?.unitPrice || 0);
      cost += units * (r.product?.unitCost || 0);

      /* ===== Monthly Aggregation ===== */
      const d = new Date(r.productionDate);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;

      if (!monthlyMap[key]) {
        monthlyMap[key] = { units: 0, defects: 0 };
      }

      monthlyMap[key].units += units;
      monthlyMap[key].defects += defects;

      /* ===== Department Aggregation ===== */
      const dept =
        r.employee?.department?.name || "Unknown";

      if (!departmentMap[dept]) {
        departmentMap[dept] = { units: 0, defects: 0 };
      }

      departmentMap[dept].units += units;
      departmentMap[dept].defects += defects;
    });

    const efficiency =
      totalUnits > 0
        ? ((totalUnits - totalDefects) / totalUnits) * 100
        : 0;

    const profit = revenue - cost;

    const months = Object.keys(monthlyMap).sort(
      (a, b) => new Date(a) - new Date(b)
    );

    const monthlyTrend = months.map((m) => {
      const [year, month] = m.split("-");
      return {
        month: new Date(year, month - 1).toLocaleString(
          "default",
          { month: "short", year: "2-digit" }
        ),
        units: monthlyMap[m].units,
        defects: monthlyMap[m].defects,
      };
    });

    const departmentStats = Object.entries(
      departmentMap
    ).map(([name, data]) => ({
      name,
      efficiency:
        data.units > 0
          ? ((data.units - data.defects) /
              data.units) *
            100
          : 0,
    }));

    const worstDepartment =
      departmentStats.length > 0
        ? departmentStats.sort(
            (a, b) => a.efficiency - b.efficiency
          )[0]
        : null;

    res.json({
      totalUnits,
      totalDefects,
      efficiency,
      revenue,
      cost,
      profit,
      projectedUnits:
        monthlyTrend.length > 1
          ? monthlyTrend[monthlyTrend.length - 1].units
          : null,
      worstDepartment,
      monthlyTrend,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Production insights failed",
    });
  }
};
export const getDepartmentPerformance = async (req, res) => {
  try {
    const departments = await prisma.department.findMany({
      include: {
        employees: {
          where: {
            status: "ACTIVE",
            isDeleted: false,
          },
          include: {
            productions: true,
          },
        },
      },
    });

    const result = departments.map((dept) => {
      let totalUnits = 0;
      let totalDefects = 0;
      let totalExperience = 0;

      dept.employees.forEach((emp) => {
        totalExperience += emp.experience || 0;

        emp.productions.forEach((p) => {
          totalUnits += p.units;
          totalDefects += p.defects;
        });
      });

      const efficiency =
        totalUnits > 0
          ? ((totalUnits - totalDefects) / totalUnits) * 100
          : 0;

      return {
        department: dept.name,
        employees: dept.employees.length,
        avgExperience:
          dept.employees.length > 0
            ? Number(
                (totalExperience / dept.employees.length).toFixed(1)
              )
            : 0,
        units: totalUnits,
        defects: totalDefects,
        efficiency: Number(efficiency.toFixed(2)),
      };
    });

    res.json(result);
  } catch (error) {
    console.error("Department performance error:", error);
    res.status(500).json({
      error: "Failed to compute department performance",
    });
  }
};