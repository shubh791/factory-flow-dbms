import prisma from "../prisma/client.js";

/* =========================================================================
   CREATE EMPLOYEE
======================================================================== */
export const createEmployee = async (req, res) => {
  try {
    const { name, experience, departmentId, roleId, employeeCode } = req.body;

    if (!name || !employeeCode || !departmentId || !roleId) {
      return res.status(400).json({ error: "All fields are required" });
    }

    if (!/^[A-Za-z ]+$/.test(name)) {
      return res.status(400).json({ error: "Name must contain letters only" });
    }

    const employee = await prisma.employee.create({
      data: {
        name: name.trim(),
        employeeCode: employeeCode.trim(),
        experience: Number(experience) || 0,
        departmentId: Number(departmentId),
        roleId: Number(roleId),
      },
    });

    res.json(employee);
  } catch (error) {
    console.error("Create Employee Error:", error);
    res.status(500).json({ error: "Employee creation failed" });
  }
};

/* =========================================================================
   GET ALL EMPLOYEES
======================================================================== */
export const getEmployees = async (req, res) => {
  try {
    const employees = await prisma.employee.findMany({
      include: {
        department: {
          select: { id: true, name: true },
        },
        role: {
          select: { id: true, title: true, level: true },
        },
      },
      orderBy: { id: "asc" },
    });

    res.json(employees);
  } catch (error) {
    console.error("Fetch Employees Error:", error);
    res.status(500).json({ error: "Failed to fetch employees" });
  }
};

/* =========================================================================
   DELETE SINGLE EMPLOYEE
======================================================================== */
export const deleteEmployee = async (req, res) => {
  try {
    const id = Number(req.params.id);

    await prisma.employee.delete({
      where: { id },
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Delete Employee Error:", error);
    res.status(500).json({ error: "Delete failed" });
  }
};

/* =========================================================================
   DELETE ALL EMPLOYEES (ADMIN RESET)
======================================================================== */
export const clearEmployees = async (req, res) => {
  try {
    // delete dependent data first
    await prisma.promotionHistory.deleteMany();
    await prisma.production.deleteMany();
    await prisma.auditLog.deleteMany();

    const result = await prisma.employee.deleteMany();

    res.json({
      success: true,
      deletedCount: result.count,
      message: "All employee-related data cleared safely.",
    });

  } catch (error) {
    console.error("Clear Employees Error:", error);
    res.status(500).json({ error: "Bulk delete failed" });
  }
};

/* =========================================================================
   UPDATE EMPLOYEE
======================================================================== */
export const updateEmployee = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { name, experience, departmentId, roleId } = req.body;

    const updated = await prisma.employee.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(experience !== undefined && { experience: Number(experience) }),
        ...(departmentId && { departmentId: Number(departmentId) }),
        ...(roleId && { roleId: Number(roleId) }),
      },
    });

    res.json(updated);
  } catch (error) {
    console.error("Update Employee Error:", error);
    res.status(500).json({ error: "Update failed" });
  }
};