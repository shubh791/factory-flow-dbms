import prisma from "../prisma/client.js";

export const createProduction = async (req, res) => {
  try {
    const { units, defects, productId } = req.body;

    const record = await prisma.production.create({
      data: {
        units: Number(units) || 0,
        defects: Number(defects) || 0,
        productId: Number(productId),
      },
    });

    res.json(record);
  } catch {
    res.status(500).json({ error: "Production record failed" });
  }
};

export const getProduction = async (req, res) => {
  const data = await prisma.production.findMany({
    include: { product: true },
    orderBy: { date: "desc" },
  });

  res.json(data);
};

export const deleteProduction = async (req, res) => {
  await prisma.production.delete({
    where: { id: Number(req.params.id) },
  });

  res.json({ success: true });
};

export const updateProduction = async (req, res) => {
  try {
    const { units, defects, productId } = req.body;

    const updated = await prisma.production.update({
      where: { id: Number(req.params.id) },
      data: {
        ...(units !== undefined && { units: Number(units) }),
        ...(defects !== undefined && { defects: Number(defects) }),
        ...(productId && { productId: Number(productId) }),
      },
    });

    res.json(updated);
  } catch {
    res.status(500).json({ error: "Production update failed" });
  }
};