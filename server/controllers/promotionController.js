import prisma from "../prisma/client.js";

/*
====================================================
GET ALL PROMOTIONS
====================================================
*/

export const getPromotions = async (req, res) => {
  try {
    const promotions = await prisma.promotionHistory.findMany({
      include: {
        employee: true,
        oldRole: true,
        newRole: true,
      },
      orderBy: {
        promotedAt: "desc",
      },
    });

    res.json(promotions);
  } catch (error) {
    console.error("GET PROMOTIONS ERROR:", error);
    res.status(500).json({ error: "Failed to fetch promotions" });
  }
};

/*
====================================================
CREATE PROMOTION (TRANSACTION SAFE)
====================================================
*/

export const createPromotion = async (req, res) => {
  const { employeeId, newRoleId, remarks } = req.body;

  try {
    if (!employeeId || !newRoleId) {
      return res.status(400).json({
        error: "Employee and new role are required",
      });
    }

    const employee = await prisma.employee.findUnique({
      where: { id: Number(employeeId) },
      include: { role: true },
    });

    if (!employee) {
      return res.status(404).json({
        error: "Employee not found",
      });
    }

    const newRole = await prisma.role.findUnique({
      where: { id: Number(newRoleId) },
    });

    if (!newRole) {
      return res.status(404).json({
        error: "Role not found",
      });
    }

    if (employee.roleId === Number(newRoleId)) {
      return res.status(400).json({
        error: "Employee already holds this role",
      });
    }

    const result = await prisma.$transaction(async (tx) => {

      // 1️⃣ Create promotion history
      const promotion = await tx.promotionHistory.create({
        data: {
          employeeId: employee.id,
          oldRoleId: employee.roleId,
          newRoleId: Number(newRoleId),
          remarks: remarks || null,
        },
      });

      // 2️⃣ Update employee role
      await tx.employee.update({
        where: { id: employee.id },
        data: {
          roleId: Number(newRoleId),
        },
      });

      // 3️⃣ Create audit log entry
      await tx.auditLog.create({
        data: {
          action: "PROMOTION", // Prisma Enum value
          entity: "Employee",
          entityId: employee.id,
          performedBy: "System",
          metadata: {
            oldRole: employee.role.title,
            newRole: newRole.title,
          },
        },
      });

      return promotion;
    });

    res.status(201).json(result);

  } catch (error) {
    console.error("PROMOTION ERROR:", error);

    res.status(500).json({
      error: error.message || "Promotion failed",
    });
  }
};