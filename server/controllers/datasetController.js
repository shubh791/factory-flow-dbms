import prisma from "../prisma/client.js";

/* =========================================================================
   GET ALL DATASETS
======================================================================== */
export const getDatasets = async (req, res) => {
  try {
    res.set("Cache-Control", "no-store");

    const datasets = await prisma.dataset.findMany({
      orderBy: { createdAt: "desc" },
    });

    res.json(datasets);
  } catch (error) {
    console.error("Get Datasets Error:", error);
    res.status(500).json({ error: "Failed to fetch datasets" });
  }
};


/* =========================================================================
   GET LATEST DATASET (MASTER SOURCE OF TRUTH)
======================================================================== */
export const getLatestDataset = async (req, res) => {
  try {
    // 🔥 Disable caching completely
    res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.set("Pragma", "no-cache");
    res.set("Expires", "0");
    res.set("Surrogate-Control", "no-store");

    const dataset = await prisma.dataset.findFirst({
      orderBy: { createdAt: "desc" },
    });

    if (!dataset) {
      return res.status(404).json({
        message: "No dataset uploaded yet.",
      });
    }

    res.json(dataset);

  } catch (error) {
    console.error("Latest Dataset Error:", error);
    res.status(500).json({ error: "Failed to fetch latest dataset" });
  }
};


/* =========================================================================
   GET DATASET BY ID
======================================================================== */
export const getDatasetById = async (req, res) => {
  try {
    res.set("Cache-Control", "no-store");

    const dataset = await prisma.dataset.findUnique({
      where: { id: Number(req.params.id) },
    });

    if (!dataset) {
      return res.status(404).json({ error: "Dataset not found" });
    }

    res.json(dataset);

  } catch (error) {
    console.error("Dataset By ID Error:", error);
    res.status(500).json({ error: "Failed to fetch dataset" });
  }
};


/* =========================================================================
   DATASET ANALYTICS (CSV-DRIVEN KPI ENGINE)
======================================================================== */
export const getDatasetAnalytics = async (req, res) => {
  try {
    res.set("Cache-Control", "no-store");

    const dataset = await prisma.dataset.findFirst({
      orderBy: { createdAt: "desc" },
    });

    if (!dataset || !dataset.rows?.length) {
      return res.json({ empty: true });
    }

    const rows = dataset.rows;

    const totalRecords = rows.length;

    let totalUnits = 0;
    let totalDefects = 0;

    rows.forEach((row) => {
      totalUnits += Number(row.units || row.Units || 0);
      totalDefects += Number(row.defects || row.Defects || 0);
    });

    const averageUnits =
      totalRecords > 0 ? totalUnits / totalRecords : 0;

    const defectRate =
      totalUnits > 0 ? (totalDefects / totalUnits) * 100 : 0;

    const efficiency =
      totalUnits > 0
        ? ((totalUnits - totalDefects) / totalUnits) * 100
        : 0;

    res.json({
      totalRecords,
      totalUnits,
      totalDefects,
      averageUnits: averageUnits.toFixed(2),
      defectRate: defectRate.toFixed(2),
      efficiency: efficiency.toFixed(2),
    });

  } catch (error) {
    console.error("Dataset Analytics Error:", error);
    res.status(500).json({ error: "Analytics failed" });
  }
};