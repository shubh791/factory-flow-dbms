import multer from "multer";
import csv from "csv-parser";
import fs from "fs";
import prisma from "../prisma/client.js";

/* ================= MULTER ================= */

const upload = multer({ dest: "uploads/" });
export const uploadMiddleware = upload;

/* =================================================
   CSV FORMAT EXPECTED

   product,employeeCode,units,defects
================================================= */

export const uploadProductionCSV = async (req, res) => {

  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const rows = [];

  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on("data", (row) => rows.push(row))

    .on("end", async () => {

      try {

        /* ================= PRELOAD DATABASE DATA ================= */

        const employees = await prisma.employee.findMany({
          select: { id: true, employeeCode: true }
        });

        const products = await prisma.product.findMany({
          select: { id: true, name: true, unitPrice: true, unitCost: true }
        });

        /* ================= MAPS ================= */

        const employeeMap = {};
        employees.forEach(e => {
          employeeMap[e.employeeCode] = e.id;
        });

        const productMap = {};
        products.forEach(p => {
          productMap[p.name.toLowerCase()] = p;
        });

        const productionData = [];

        /* ================= PROCESS CSV ================= */

        for (const row of rows) {

          const productName = row.product?.trim();
          const employeeCode = row.employeeCode?.trim();

          const units = Number(row.units) || 0;
          const defects = Number(row.defects) || 0;

          if (!productName || !employeeCode) continue;
          if (defects > units) continue;

          let product = productMap[productName.toLowerCase()];

          /* create product if not exists */

          if (!product) {

            product = await prisma.product.create({
              data: {
                name: productName,
                unitPrice: 20,
                unitCost: 10
              }
            });

            productMap[productName.toLowerCase()] = product;
          }

          const employeeId = employeeMap[employeeCode];

          if (!employeeId) continue;

          /* ================= CORRECT INDUSTRIAL CALCULATION ================= */

          const goodUnits = units - defects;

          const revenue = goodUnits * (product.unitPrice || 20);
          const cost = units * (product.unitCost || 10);
          const profit = revenue - cost;

          productionData.push({
            units,
            defects,
            revenue,
            cost,
            profit,
            productId: product.id,
            employeeId,
            productionDate: new Date()
          });

        }

        /* ================= BULK INSERT ================= */

        const result = await prisma.production.createMany({
          data: productionData
        });

        fs.unlink(req.file.path, () => {});

        return res.json({
          success: true,
          message: "Production CSV uploaded successfully",
          recordsCreated: result.count
        });

      } catch (error) {

        console.error("CSV Processing Error:", error);

        fs.unlink(req.file.path, () => {});

        return res.status(500).json({
          error: "CSV processing failed"
        });

      }

    })

    .on("error", (error) => {

      console.error("CSV Stream Error:", error);

      fs.unlink(req.file.path, () => {});

      return res.status(500).json({
        error: "Failed to read CSV file"
      });

    });

};