import prisma from "../prisma/client.js";

/*
==================================================
ROLE MANAGEMENT CONTROLLER
==================================================
*/

export const getRoles = async (req, res) => {
  const roles = await prisma.role.findMany({
    orderBy: { level: "asc" }
  });
  res.json(roles);
};

export const createRole = async (req, res) => {
  try {
    const { title, level } = req.body;

    const role = await prisma.role.create({
      data: { title, level: Number(level) }
    });

    res.json(role);
  } catch {
    res.status(500).json({ error: "Role creation failed" });
  }
};

export const deleteRole = async (req, res) => {
  try {
    await prisma.role.delete({
      where: { id: Number(req.params.id) }
    });
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Cannot delete role" });
  }
};