import prisma from "../prisma/client.js";

export const createProduct = async (req, res) => {
  try {
    const product = await prisma.product.create({
      data: { name: req.body.name.trim() },
    });
    res.json(product);
  } catch {
    res.status(500).json({ error: "Product creation failed" });
  }
};

export const getProducts = async (req, res) => {
  res.json(
    await prisma.product.findMany({
      orderBy: { id: "asc" },
    })
  );
};