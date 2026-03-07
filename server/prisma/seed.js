import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create Departments
  const departments = await prisma.department.createMany({
    data: [
      { name: "Manufacturing", code: "MFG" },
      { name: "Quality Control", code: "QC" },
      { name: "Logistics", code: "LOG" },
      { name: "Human Resources", code: "HR" },
      { name: "Operations", code: "OPS" },
    ],
  });

  // Create Roles (Hierarchy Levels)
  const roles = await prisma.role.createMany({
    data: [
      { title: "Plant Director", level: 1 },
      { title: "Production Manager", level: 2 },
      { title: "Supervisor", level: 3 },
      { title: "Operator", level: 4 },
      { title: "Trainee", level: 5 },
    ],
  });

  // Create Products
  await prisma.product.createMany({
    data: [
      { name: "Industrial Motor", sku: "IM-1001" },
      { name: "Hydraulic Pump", sku: "HP-2001" },
      { name: "Gear Assembly", sku: "GA-3001" },
    ],
  });

  console.log("✅ Seeding completed successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });