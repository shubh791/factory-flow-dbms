import multer from "multer";
import csv from "csv-parser";
import fs from "fs";
import prisma from "../prisma/client.js";

/* Multer setup */
const upload = multer({ dest: "uploads/" });
export const uploadMiddleware = upload;

/*
  EMPLOYEE CSV UPLOAD
  Expected CSV columns:
  name, experience, departmentId OR department
*/

export const uploadEmployeesCSV = async (req, res) => {
  try {
    if (!req.file)
      return res.status(400).json({ error: "No file uploaded" });

    const rows = [];

    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on("data", (row) => rows.push(row))
      .on("end", async () => {
        for (const row of rows) {
          const name = row.name?.trim();
          const experience = Number(row.experience) || 0;

          /* Support BOTH departmentId or department name */
          let departmentId = row.departmentId;

          if (!departmentId && row.department) {
            let dept = await prisma.department.findFirst({
              where: { name: row.department.trim() },
            });

            if (!dept) {
              dept = await prisma.department.create({
                data: { name: row.department.trim() },
              });
            }

            departmentId = dept.id;
          }

          if (!name || !departmentId) continue;

          await prisma.employee.create({
            data: {
              name,
              experience,
              departmentId: Number(departmentId),
            },
          });
        }

        fs.unlinkSync(req.file.path);

        res.json({ success: true });
      });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      error: "Employee CSV upload failed",
    });
  }
};