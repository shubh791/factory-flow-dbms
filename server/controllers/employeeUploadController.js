import multer from "multer";
import csv from "csv-parser";
import fs from "fs";
import prisma from "../prisma/client.js";

/* ================= MULTER SETUP ================= */
const upload = multer({ dest: "uploads/" });
export const uploadMiddleware = upload;

/*
SUPPORTED CSV FORMAT:

employeeCode,name,experience,departmentId,roleId
OR
employeeCode,name,experience,department,role
*/

export const uploadEmployeesCSV = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const rows = [];

    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on("data", (row) => rows.push(row))
      .on("end", async () => {

        try {

          /* ================= PRELOAD DATA ================= */

          const departments = await prisma.department.findMany();
          const roles = await prisma.role.findMany({
            orderBy: { level: "asc" },
          });

          const departmentMap = {};
          departments.forEach((d) => {
            departmentMap[d.name.toLowerCase()] = d.id;
          });

          const roleMap = {};
          roles.forEach((r) => {
            roleMap[r.title.toLowerCase()] = r.id;
          });

          const defaultRole = roles[0]?.id;

          /* ================= EXISTING EMPLOYEE CODES ================= */

          const existingEmployees = await prisma.employee.findMany({
            select: { employeeCode: true },
          });

          const existingCodes = new Set(
            existingEmployees.map((e) => e.employeeCode)
          );

          /* ================= GENERATE EMPLOYEES ================= */

          const employeesToInsert = [];
          let skipped = 0;

          const lastEmployee = await prisma.employee.findFirst({
            orderBy: { id: "desc" },
          });

          let nextNumber = lastEmployee ? lastEmployee.id + 1 : 1;

          for (const row of rows) {
            try {

              const name = row.name?.trim();
              const experience = Number(row.experience) || 0;

              if (!name) {
                skipped++;
                continue;
              }

              /* ================= EMPLOYEE CODE ================= */

              let employeeCode = row.employeeCode?.trim();

              if (!employeeCode) {
                employeeCode = `E${500 + nextNumber}`;
                nextNumber++;
              }

              if (existingCodes.has(employeeCode)) {
                skipped++;
                continue;
              }

              /* ================= DEPARTMENT ================= */

              let departmentId = row.departmentId;

              if (!departmentId && row.department) {
                departmentId =
                  departmentMap[row.department.trim().toLowerCase()];
              }

              if (!departmentId) {
                skipped++;
                continue;
              }

              /* ================= ROLE ================= */

              let roleId = row.roleId;

              if (!roleId && row.role) {
                roleId = roleMap[row.role.trim().toLowerCase()];
              }

              if (!roleId) {
                roleId = defaultRole;
              }

              employeesToInsert.push({
                employeeCode,
                name,
                experience,
                departmentId: Number(departmentId),
                roleId: Number(roleId),
              });

            } catch (err) {
              skipped++;
            }
          }

          /* ================= BULK INSERT ================= */

          const result = await prisma.employee.createMany({
            data: employeesToInsert,
            skipDuplicates: true,
          });

          fs.unlinkSync(req.file.path);

          res.json({
            success: true,
            inserted: result.count,
            skipped,
            total: rows.length,
          });

        } catch (err) {
          console.log(err);
          res.status(500).json({ error: "Database insert failed" });
        }

      });

  } catch (err) {
    console.log(err);
    res.status(500).json({
      error: "Employee CSV upload failed",
    });
  }
};