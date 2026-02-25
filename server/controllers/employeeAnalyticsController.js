import prisma from "../prisma/client.js";

export const getEmployeeAnalytics = async (req, res) => {
  try {
    /* GROUP PRODUCTION BY EMPLOYEE */
    const productionData = await prisma.production.groupBy({
      by: ["employeeId"],
      _sum: {
        units: true,
        defects: true
      },
      _count: { _all: true }
    });

    /* GET EMPLOYEE DETAILS */
    const employees = await prisma.employee.findMany({
      include: { department: true }
    });

    /* MAP ANALYTICS */
    const result = productionData.map(p => {
      const emp = employees.find(e => e.id === p.employeeId);

      const totalUnits = p._sum.units || 0;
      const defectUnits = p._sum.defects || 0;
      const goodUnits = totalUnits - defectUnits;

      const efficiency =
        totalUnits > 0
          ? ((goodUnits / totalUnits) * 100).toFixed(2)
          : "0.00";

      const defectRatio =
        totalUnits > 0
          ? ((defectUnits / totalUnits) * 100).toFixed(2)
          : "0.00";

      return {
        employeeId: p.employeeId,
        employeeName: emp?.name || "Unknown",
        department: emp?.department?.name || "—",
        totalProduction: totalUnits,
        goodUnits,
        defectUnits,
        efficiency,
        defectRatio
      };
    });

    res.json(result);

  } catch (err) {
    console.error("Employee Analytics Error:", err);
    res.status(500).json({
      error: "Analytics fetch failed"
    });
  }
};