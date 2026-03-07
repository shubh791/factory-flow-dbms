import prisma from "../prisma/client.js";

export const getExecutiveSummary = async (req, res) => {
  try {
    /* =========================================
       1️⃣ ACTIVE EMPLOYEE COUNT
    ========================================= */

    const totalEmployees = await prisma.employee.count({
      where: {
        status: "ACTIVE",
        isDeleted: false,
      },
    });

    /* =========================================
       2️⃣ PRODUCTION AGGREGATION
    ========================================= */

    const productionAgg = await prisma.production.aggregate({
      _sum: {
        units: true,
        defects: true,
      },
    });

    const totalUnits = productionAgg._sum.units || 0;
    const totalDefects = productionAgg._sum.defects || 0;

    const defectRate =
      totalUnits > 0 ? (totalDefects / totalUnits) * 100 : 0;

    const efficiency = 100 - defectRate;

    /* =========================================
       3️⃣ DEPARTMENT INTELLIGENCE
       Production → Employee → Department
    ========================================= */

    const departmentData = await prisma.production.findMany({
      include: {
        employee: {
          include: {
            department: true,
          },
        },
      },
    });

    const departmentMap = {};

    departmentData.forEach((record) => {
      if (!record.employee) return;

      if (record.employee.status !== "ACTIVE") return;

      const deptName = record.employee.department.name;

      if (!departmentMap[deptName]) {
        departmentMap[deptName] = {
          department: deptName,
          units: 0,
          defects: 0,
        };
      }

      departmentMap[deptName].units += record.units;
      departmentMap[deptName].defects += record.defects;
    });

    const departmentStats = Object.values(departmentMap).map((d) => {
      const deptDefectRate =
        d.units > 0 ? (d.defects / d.units) * 100 : 0;

      return {
        ...d,
        efficiency: 100 - deptDefectRate,
      };
    });

    const topDepartment =
      departmentStats.sort((a, b) => b.efficiency - a.efficiency)[0] ||
      null;

    /* =========================================
       4️⃣ EMPLOYEE PERFORMANCE RANKING
    ========================================= */

    const employeeData = await prisma.production.findMany({
      include: {
        employee: true,
      },
    });

    const employeeMap = {};

    employeeData.forEach((record) => {
      if (!record.employee) return;
      if (record.employee.status !== "ACTIVE") return;

      const empName = record.employee.name;

      if (!employeeMap[empName]) {
        employeeMap[empName] = {
          employee: empName,
          units: 0,
          defects: 0,
        };
      }

      employeeMap[empName].units += record.units;
      employeeMap[empName].defects += record.defects;
    });

    const employeeRanking = Object.values(employeeMap)
      .map((e) => {
        const empDefectRate =
          e.units > 0 ? (e.defects / e.units) * 100 : 0;

        return {
          ...e,
          efficiency: 100 - empDefectRate,
        };
      })
      .sort((a, b) => b.efficiency - a.efficiency)
      .slice(0, 5);

    /* =========================================
       5️⃣ PRODUCTION TREND (DATE GROUPING)
    ========================================= */

    const trendDataRaw = await prisma.production.findMany({
      select: {
        productionDate: true,
        units: true,
      },
      orderBy: {
        productionDate: "asc",
      },
    });

    const trendMap = {};

    trendDataRaw.forEach((record) => {
      const date = record.productionDate
        .toISOString()
        .split("T")[0];

      if (!trendMap[date]) {
        trendMap[date] = 0;
      }

      trendMap[date] += record.units;
    });

    const trendData = Object.entries(trendMap).map(
      ([date, units]) => ({
        date,
        units,
      })
    );

    /* =========================================
       FINAL RESPONSE
    ========================================= */

    res.json({
      kpis: {
        totalEmployees,
        totalUnits,
        totalDefects,
        defectRate: Number(defectRate.toFixed(2)),
        efficiency: Number(efficiency.toFixed(2)),
        topDepartment: topDepartment?.department || null,
      },
      departmentStats,
      employeeRanking,
      trendData,
    });
  } catch (error) {
    console.error("Executive Analytics Error:", error);
    res.status(500).json({
      error: "Failed to generate executive summary",
    });
  }
};