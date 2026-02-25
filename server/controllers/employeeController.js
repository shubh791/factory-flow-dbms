import prisma from "../prisma/client.js";

export const createEmployee = async (req, res) => {
  try {
    const { name, experience, departmentId } = req.body;

    if (!/^[A-Za-z ]+$/.test(name)) {
      return res.json({ error: "Name must contain letters only" });
    }

    const employee = await prisma.employee.create({
      data: {
        name: name.trim(),
        experience: Number(experience) || 0,
        departmentId: Number(departmentId),
      },
    });

    res.json(employee);
  } catch {
    res.status(500).json({ error: "Employee creation failed" });
  }
};

export const getEmployees = async (req, res) => {
  res.json(
    await prisma.employee.findMany({
      include: { department: true },
      orderBy: { id: "asc" },
    })
  );
};

export const deleteEmployee = async (req, res) => {
  await prisma.employee.delete({
    where: { id: Number(req.params.id) },
  });
  res.json({ success: true });
};

export const updateEmployee = async (req, res) => {
  try {
    const { name, experience, departmentId } = req.body;

    const updated = await prisma.employee.update({
      where: { id: Number(req.params.id) },
      data: {
        ...(name && { name: name.trim() }),
        ...(experience !== undefined && {
          experience: Number(experience),
        }),
        ...(departmentId && {
          departmentId: Number(departmentId),
        }),
      },
    });

    res.json(updated);
  } catch {
    res.status(500).json({ error: "Update failed" });
  }
};