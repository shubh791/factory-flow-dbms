import prisma from "../prisma/client.js";

/*
=============================================================================
QUERY PERFORMANCE CONTROLLER
Measures real DB query execution time
=============================================================================
*/

export const getQueryPerformance = async (req, res) => {
  try {

    const start1 = performance.now();
    await prisma.production.aggregate({
      _sum: { units: true }
    });
    const end1 = performance.now();

    const start2 = performance.now();
    await prisma.employee.count();
    const end2 = performance.now();

    const start3 = performance.now();
    await prisma.production.groupBy({
      by: ["productId"],
      _sum: { units: true }
    });
    const end3 = performance.now();

    res.json({
      productionAggregation: (end1 - start1).toFixed(2),
      employeeCount: (end2 - start2).toFixed(2),
      departmentGrouping: (end3 - start3).toFixed(2),
    });

  } catch (error) {
    console.error("Query performance error:", error);
    res.status(500).json({ error: "Query measurement failed" });
  }
};