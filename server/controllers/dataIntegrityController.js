import prisma from "../prisma/client.js";

/*
==================================================
DATA INTEGRITY CONTROLLER
Fully aligned with current Prisma schema
==================================================
*/

export const getIntegrityStatus = async (req, res) => {
  try {

    /* ===============================
       BASIC ENTITY COUNTS
    =============================== */

    const productionCount = await prisma.production.count();
    const productCount = await prisma.product.count();
    const employeeCount = await prisma.employee.count();
    const departmentCount = await prisma.department.count();
    const roleCount = await prisma.role.count();

    /* ===============================
       DUPLICATE DEPARTMENT CODE CHECK
    =============================== */

    const departments = await prisma.department.findMany({
      select: { code: true }
    });

    const deptCodeMap = {};
    let duplicateDepartments = 0;

    departments.forEach(d => {
      deptCodeMap[d.code] = (deptCodeMap[d.code] || 0) + 1;
    });

    Object.values(deptCodeMap).forEach(count => {
      if (count > 1) duplicateDepartments++;
    });

    /* ===============================
       DUPLICATE ROLE TITLE CHECK
       (Since title is unique field)
    =============================== */

    const roles = await prisma.role.findMany({
      select: { title: true }
    });

    const roleTitleMap = {};
    let duplicateRoles = 0;

    roles.forEach(r => {
      roleTitleMap[r.title] = (roleTitleMap[r.title] || 0) + 1;
    });

    Object.values(roleTitleMap).forEach(count => {
      if (count > 1) duplicateRoles++;
    });

    /* ===============================
       INTEGRITY SCORE
    =============================== */

    let score = 100;

    if (duplicateDepartments > 0) score -= 25;
    if (duplicateRoles > 0) score -= 25;

    const status =
      score === 100
        ? "Fully Consistent"
        : score >= 75
        ? "Minor Issues"
        : "Integrity Risk Detected";

    res.json({
      productionCount,
      productCount,
      employeeCount,
      departmentCount,
      roleCount,
      duplicateDepartments,
      duplicateRoles,
      score,
      status
    });

  } catch (error) {
    console.error("Integrity Check Error:", error);
    res.status(500).json({ error: error.message });
  }
};