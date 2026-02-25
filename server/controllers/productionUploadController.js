import multer from "multer";
import csv from "csv-parser";
import fs from "fs";
import prisma from "../prisma/client.js";

/* Multer setup */
const upload = multer({ dest: "uploads/" });
export const uploadMiddleware = upload;

/*
  CSV FORMAT:
  product,units,defects
*/

export const uploadProductionCSV = async (req, res) => {
  try {
    if (!req.file)
      return res.status(400).json({ error: "No file uploaded" });

    const rows = [];

    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on("data", (row) => rows.push(row))
      .on("end", async () => {
        for (const row of rows) {
          const productName = row.product?.trim();
          const units = Number(row.units) || 0;
          const defects = Number(row.defects) || 0;

          if (!productName) continue;

          /* Auto-create product if missing */
          let product = await prisma.product.findFirst({
            where: { name: productName },
          });

          if (!product) {
            product = await prisma.product.create({
              data: { name: productName },
            });
          }

          await prisma.production.create({
            data: {
              units,
              defects,
              productId: product.id,
            },
          });
        }

        fs.unlinkSync(req.file.path);

        res.json({ success: true });
      });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      error: "Production CSV upload failed",
    });
  }
};