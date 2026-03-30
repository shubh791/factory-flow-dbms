const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clear existing data
  await prisma.production.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.product.deleteMany();
  await prisma.promotionHistory.deleteMany();
  await prisma.role.deleteMany();
  await prisma.department.deleteMany();

  // Seed Departments
  const deptProduction = await prisma.department.create({
    data: { name: 'Production', code: 'PROD', description: 'Manufacturing and assembly' },
  });
  const deptQuality = await prisma.department.create({
    data: { name: 'Quality Assurance', code: 'QA', description: 'Quality control and testing' },
  });
  const deptMaintenance = await prisma.department.create({
    data: { name: 'Maintenance', code: 'MAINT', description: 'Equipment maintenance' },
  });
  const deptLogistics = await prisma.department.create({
    data: { name: 'Logistics', code: 'LOG', description: 'Supply chain and warehousing' },
  });

  // Seed Roles
  const roleManager = await prisma.role.create({
    data: { title: 'Manager', level: 1, description: 'Department management' },
  });
  const roleSupervisor = await prisma.role.create({
    data: { title: 'Supervisor', level: 2, description: 'Team supervision' },
  });
  const roleOperator = await prisma.role.create({
    data: { title: 'Operator', level: 3, description: 'Machine operation' },
  });
  const roleTechnician = await prisma.role.create({
    data: { title: 'Technician', level: 3, description: 'Technical work' },
  });

  // Seed Employees
  const employees = [];
  for (let i = 1; i <= 25; i++) {
    const depts = [deptProduction, deptQuality, deptMaintenance, deptLogistics];
    const dept = depts[i % depts.length];
    const roles = [roleManager, roleSupervisor, roleOperator, roleTechnician];
    const role = i <= 4 ? roleManager : i <= 10 ? roleSupervisor : roles[i % roles.length];

    const emp = await prisma.employee.create({
      data: {
        employeeCode: `EMP${String(i).padStart(4, '0')}`,
        name: `Employee ${i}`,
        email: `employee${i}@factory.com`,
        phone: `+91-${9000000000 + i}`,
        experience: Math.floor(Math.random() * 15) + 1,
        status: i % 20 === 0 ? 'ON_LEAVE' : 'ACTIVE',
        departmentId: dept.id,
        roleId: role.id,
      },
    });
    employees.push(emp);
  }

  // Seed Products
  const products = [];
  const productNames = ['Widget A', 'Component B', 'Module C', 'Assembly D', 'Unit E'];
  for (const name of productNames) {
    const prod = await prisma.product.create({
      data: {
        name,
        sku: `SKU-${name.replace(' ', '-').toUpperCase()}`,
        description: `Industrial ${name}`,
        unitPrice: Math.floor(Math.random() * 5000) + 1000,
        unitCost: Math.floor(Math.random() * 3000) + 500,
      },
    });
    products.push(prod);
  }

  // Seed Production Records (last 90 days)
  const shifts = ['MORNING', 'EVENING', 'NIGHT'];
  for (let day = 0; day < 90; day++) {
    const date = new Date();
    date.setDate(date.getDate() - day);

    for (let rec = 0; rec < 5; rec++) {
      const product = products[rec % products.length];
      const employee = employees[Math.floor(Math.random() * employees.length)];
      const units = Math.floor(Math.random() * 500) + 100;
      const defects = Math.floor(Math.random() * (units * 0.1));
      const revenue = units * product.unitPrice;
      const cost = units * product.unitCost;

      await prisma.production.create({
        data: {
          units,
          defects,
          shift: shifts[rec % shifts.length],
          productId: product.id,
          employeeId: employee.id,
          productionDate: date,
          revenue,
          cost,
          profit: revenue - cost,
        },
      });
    }
  }

  console.log('✅ Seeding completed!');
  console.log(`   Departments: 4`);
  console.log(`   Roles: 4`);
  console.log(`   Employees: 25`);
  console.log(`   Products: ${products.length}`);
  console.log(`   Production Records: ${90 * 5}`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
