import prisma from "../prisma/client.js";

/*
==================================================
AUDIT LOG CONTROLLER
Tracks system-level database operations
==================================================
*/

export const getAuditLogs = async (req, res) => {
  try {
    const logs = await prisma.auditLog.findMany({
      orderBy: { timestamp: "desc" }
    });

    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch audit logs" });
  }
};