import prisma from "../prisma/client.js";

/* =========================================================================
   CREATE PRODUCTION RECORD
======================================================================== */
export const createProduction = async (req, res) => {
  try {

    const { units, defects, productId, shift, employeeId } = req.body;

    if (!employeeId) {
      return res.status(400).json({ error: "Employee ID is required" });
    }

    const parsedUnits = Number(units) || 0;
    const parsedDefects = Number(defects) || 0;

    if (parsedDefects > parsedUnits) {
      return res.status(400).json({
        error: "Defects cannot exceed produced units"
      });
    }

    const product = await prisma.product.findUnique({
      where: { id: Number(productId) }
    });

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    const unitPrice = product.unitPrice || 20;
    const unitCost = product.unitCost || 10;

    /* ================= INDUSTRIAL CALCULATION ================= */

    const goodUnits = parsedUnits - parsedDefects;

    const revenue = goodUnits * unitPrice;
    const cost = parsedUnits * unitCost;
    const profit = revenue - cost;

    const record = await prisma.production.create({
      data: {
        units: parsedUnits,
        defects: parsedDefects,
        productId: Number(productId),
        employeeId: Number(employeeId),
        shift: shift || "MORNING",
        productionDate: new Date(),
        revenue,
        cost,
        profit
      }
    });

    res.json(record);

  } catch (error) {
    console.error("Production Create Error:", error);
    res.status(500).json({ error: "Production record failed" });
  }
};


/* =========================================================================
   GET ALL PRODUCTION RECORDS
======================================================================== */
export const getProduction = async (req, res) => {
  try {

    const data = await prisma.production.findMany({
      select: {

        id: true,
        units: true,
        defects: true,
        revenue: true,
        cost: true,
        profit: true,
        productionDate: true,

        product: {
          select: {
            id: true,
            name: true
          }
        },

        employee: {
          select: {
            id: true,
            name: true,
            employeeCode: true,
            department: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }

      },

      orderBy: {
        productionDate: "desc"
      }

    });

    res.json(data);

  } catch (error) {
    console.error("Production Fetch Error:", error);
    res.status(500).json({ error: "Failed to fetch production data" });
  }
};


/* =========================================================================
   DELETE SINGLE PRODUCTION RECORD
======================================================================== */
export const deleteProduction = async (req, res) => {
  try {

    await prisma.production.delete({
      where: { id: Number(req.params.id) }
    });

    res.json({ success: true });

  } catch (error) {
    console.error("Delete Production Error:", error);
    res.status(500).json({ error: "Delete failed" });
  }
};


/* =========================================================================
   DELETE ALL PRODUCTION RECORDS
======================================================================== */
export const clearProduction = async (req, res) => {
  try {

    const result = await prisma.production.deleteMany();

    res.json({
      success: true,
      deletedCount: result.count,
      message: "All production records cleared successfully."
    });

  } catch (error) {
    console.error("Clear Production Error:", error);
    res.status(500).json({ error: "Bulk delete failed" });
  }
};


/* =========================================================================
   UPDATE PRODUCTION RECORD
======================================================================== */
export const updateProduction = async (req, res) => {
  try {

    const { units, defects, productId, employeeId } = req.body;

    const existing = await prisma.production.findUnique({
      where: { id: Number(req.params.id) }
    });

    if (!existing) {
      return res.status(404).json({ error: "Record not found" });
    }

    const newUnits = units !== undefined ? Number(units) : existing.units;
    const newDefects = defects !== undefined ? Number(defects) : existing.defects;

    if (newDefects > newUnits) {
      return res.status(400).json({
        error: "Defects cannot exceed produced units"
      });
    }

    const newProductId = productId ? Number(productId) : existing.productId;

    const product = await prisma.product.findUnique({
      where: { id: newProductId }
    });

    const unitPrice = product.unitPrice || 20;
    const unitCost = product.unitCost || 10;

    const goodUnits = newUnits - newDefects;

    const revenue = goodUnits * unitPrice;
    const cost = newUnits * unitCost;
    const profit = revenue - cost;

    const updated = await prisma.production.update({
      where: { id: Number(req.params.id) },
      data: {
        units: newUnits,
        defects: newDefects,
        ...(productId && { productId: newProductId }),
        ...(employeeId && { employeeId: Number(employeeId) }),
        revenue,
        cost,
        profit
      }
    });

    res.json(updated);

  } catch (error) {
    console.error("Update Production Error:", error);
    res.status(500).json({ error: "Production update failed" });
  }
};