import prisma from "../prisma/client.js";

export const createDepartment = async (req, res) => {
  try {
    const dept = await prisma.department.create({
      data: { name: req.body.name.trim() },
    });
    res.json(dept);
  } catch {
    res.status(500).json({ error: "Department creation failed" });
  }
};

export const getDepartments = async (req, res) => {
  res.json(await prisma.department.findMany());
};