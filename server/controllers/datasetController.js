import prisma from "../prisma/client.js";

/* Get All Datasets */
export const getDatasets = async (req, res) => {
  try {
    const datasets = await prisma.dataset.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json(datasets);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Failed to fetch datasets" });
  }
};

/* Get Dataset By ID */
export const getDatasetById = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!id) {
      return res.status(400).json({
        error: "Dataset ID missing",
      });
    }

    const dataset = await prisma.dataset.findUnique({
      where: { id },
    });

    if (!dataset) {
      return res.status(404).json({
        error: "Dataset not found",
      });
    }

    res.json(dataset);
  } catch (err) {
    console.log(err);
    res.status(500).json({
      error: "Failed to fetch dataset",
    });
  }
};

/* Get Latest Dataset */
export const getLatestDataset = async (req, res) => {
  try {
    const dataset = await prisma.dataset.findFirst({
      orderBy: { createdAt: "desc" },
    });

    if (!dataset) {
      return res.status(404).json({
        error: "No dataset found",
      });
    }

    res.json(dataset);
  } catch (err) {
    console.log(err);
    res.status(500).json({
      error: "Failed to fetch latest dataset",
    });
  }
};

/* ⭐ Dataset Analytics */
export const getDatasetAnalytics = async (req, res) => {
  try {
    const dataset = await prisma.dataset.findFirst({
      orderBy: { createdAt: "desc" },
    });

    if (!dataset) {
      return res.status(404).json({
        error: "No dataset found",
      });
    }

    const rows = dataset.rows || [];

    const keys = rows.length ? Object.keys(rows[0]) : [];

    const numericCol = keys.find((k) =>
      rows.slice(0, 100).some((r) => !isNaN(Number(r[k])))
    );

    const totalRecords = rows.length;

    const totalSum = numericCol
      ? rows.reduce(
          (sum, r) => sum + Number(r[numericCol] || 0),
          0
        )
      : 0;

    const average = totalRecords ? totalSum / totalRecords : 0;

    const chartData = rows.slice(0, 100).map((r, i) => ({
      name: r[keys[0]] || `Row ${i}`,
      value: Number(r[numericCol] || 0),
    }));

    res.json({
      datasetName: dataset.name,
      totalRecords,
      totalSum,
      average,
      chartData,
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({
      error: "Analytics failed",
    });
  }
};