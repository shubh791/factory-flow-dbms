import prisma from "../prisma/client.js";

export const getAnalyticsSummary = async (req, res) => {
  try {
    const records = await prisma.production.findMany({
      include: { product: true },
    });

    if (!records.length) return res.json({ empty: true });

    let totalUnits = 0;
    let totalDefects = 0;
    const productMap = {};

    records.forEach((r) => {
      const units = Number(r.units) || 0;
      const defects = Number(r.defects) || 0;

      totalUnits += units;
      totalDefects += defects;

      if (!productMap[r.product.name]) {
        productMap[r.product.name] = {
          units: 0,
          defects: 0,
        };
      }

      productMap[r.product.name].units += units;
      productMap[r.product.name].defects += defects;
    });

    const efficiency =
      totalUnits > 0
        ? ((totalUnits - totalDefects) / totalUnits) * 100
        : 0;

    res.json({
      totalUnits,
      totalDefects,
      efficiency: efficiency.toFixed(2),
      productStats: productMap,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      error: "Analytics fetch failed",
    });
  }
};