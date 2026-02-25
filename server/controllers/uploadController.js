import multer from "multer";
import csv from "csv-parser";
import fs from "fs";
import prisma from "../prisma/client.js";

/* Multer Setup */
const upload = multer({ dest: "uploads/" });
export const uploadMiddleware = upload;

/* Upload Dataset Controller */
export const uploadDataset = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const results = [];

    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on("data", (row) => {
        const parsedRow = {};

        Object.keys(row).forEach((key) => {
          const value = row[key]?.trim();

          /* Convert numeric strings → numbers */
          if (value !== "" && !isNaN(value)) {
            parsedRow[key] = Number(value);
          } else {
            parsedRow[key] = value;
          }
        });

        results.push(parsedRow);
      })
      .on("end", async () => {
        if (!results.length) {
          return res.status(400).json({
            error: "Empty CSV file",
          });
        }

        const headers = Object.keys(results[0]);

        const dataset = await prisma.dataset.create({
          data: {
            name: req.file.originalname,
            headers,
            rows: results,
          },
        });

        /* Delete temp file */
        fs.unlinkSync(req.file.path);

        res.json({
          success: true,
          datasetId: dataset.id,
          headers,
        });
      });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      error: "Upload failed",
    });
  }
};