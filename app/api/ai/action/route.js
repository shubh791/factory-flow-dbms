import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

/* ─────────────────────────────────────────────────────────────
   SMART RESOLVERS — accept numeric ID, code string, or name
───────────────────────────────────────────────────────────── */

async function resolveEmployee(val) {
  if (!val && val !== 0) return null;
  const n = Number(val);
  if (!isNaN(n) && n > 0) {
    const byId = await prisma.employee.findUnique({ where: { id: n } });
    if (byId) return byId;
  }
  // Try employee code (exact, case-insensitive)
  const byCode = await prisma.employee.findFirst({
    where: { employeeCode: { equals: String(val), mode: 'insensitive' } }
  });
  if (byCode) return byCode;
  // Try name contains
  return prisma.employee.findFirst({
    where: { name: { contains: String(val), mode: 'insensitive' } }
  });
}

async function resolveProduct(val) {
  if (!val && val !== 0) return null;
  const n = Number(val);
  if (!isNaN(n) && n > 0) {
    const byId = await prisma.product.findUnique({ where: { id: n } });
    if (byId) return byId;
  }
  return prisma.product.findFirst({
    where: { name: { contains: String(val), mode: 'insensitive' } }
  });
}

async function resolveDept(val) {
  if (!val && val !== 0) return null;
  const n = Number(val);
  if (!isNaN(n) && n > 0) {
    const byId = await prisma.department.findUnique({ where: { id: n } });
    if (byId) return byId;
  }
  return prisma.department.findFirst({
    where: {
      OR: [
        { name: { contains: String(val), mode: 'insensitive' } },
        { code: { contains: String(val), mode: 'insensitive' } }
      ]
    }
  });
}

async function resolveRole(val) {
  if (!val && val !== 0) return null;
  const n = Number(val);
  if (!isNaN(n) && n > 0) {
    const byId = await prisma.role.findUnique({ where: { id: n } });
    if (byId) return byId;
  }
  return prisma.role.findFirst({
    where: { title: { contains: String(val), mode: 'insensitive' } }
  });
}

async function getDefaultDept() {
  return prisma.department.findFirst({ orderBy: { id: 'asc' } });
}

async function getDefaultRole() {
  return prisma.role.findFirst({ orderBy: { level: 'asc' } });
}

/* ─────────────────────────────────────────────────────────────
   MAIN HANDLER
───────────────────────────────────────────────────────────── */
export async function POST(request) {
  try {
    const { type, data } = await request.json();
    if (!type) return NextResponse.json({ error: 'Action type required' }, { status: 400 });

    switch (type) {

      /* ── Create production record ─────────────────────────── */
      case 'create_production': {
        // Resolve product by ID or name
        const product = await resolveProduct(data.productId ?? data.product ?? data.productName);
        if (!product) {
          const firstProduct = await prisma.product.findFirst({ orderBy: { id: 'asc' } });
          if (!firstProduct) return NextResponse.json({ error: 'No products found in database' }, { status: 404 });
          data.resolvedProduct = firstProduct;
        } else {
          data.resolvedProduct = product;
        }

        const units   = Number(data.units)   || 100;
        const defects = Number(data.defects) || 0;
        const revenue = units * (data.resolvedProduct.unitPrice || 0);
        const cost    = units * (data.resolvedProduct.unitCost  || 0);

        // Resolve employee if provided
        let empId = null;
        if (data.employeeId ?? data.employee ?? data.employeeCode) {
          const emp = await resolveEmployee(data.employeeId ?? data.employee ?? data.employeeCode);
          empId = emp?.id ?? null;
        }

        const record = await prisma.production.create({
          data: {
            units, defects,
            shift:          data.shift || 'MORNING',
            productId:      data.resolvedProduct.id,
            employeeId:     empId,
            productionDate: data.productionDate ? new Date(data.productionDate) : new Date(),
            revenue, cost, profit: revenue - cost,
          },
          include: { product: true, employee: { include: { department: true } } },
        });
        return NextResponse.json({ success: true, record, message: `Production record created: ${units} units of ${data.resolvedProduct.name}.` });
      }

      /* ── Update employee status ───────────────────────────── */
      case 'update_employee_status': {
        const emp = await resolveEmployee(data.employeeId ?? data.employee ?? data.employeeCode);
        if (!emp) return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
        const valid = ['ACTIVE', 'ON_LEAVE', 'RESIGNED', 'TERMINATED'];
        const status = data.status?.toUpperCase();
        if (!valid.includes(status)) return NextResponse.json({ error: `Status must be: ${valid.join(', ')}` }, { status: 400 });
        const updated = await prisma.employee.update({
          where: { id: emp.id }, data: { status },
          include: { department: true, role: true },
        });
        return NextResponse.json({ success: true, record: updated, message: `${updated.name}'s status updated to ${status}.` });
      }

      /* ── Promote employee ─────────────────────────────────── */
      case 'promote_employee': {
        const emp = await resolveEmployee(data.employeeId ?? data.employee ?? data.employeeCode);
        if (!emp) return NextResponse.json({ error: 'Employee not found' }, { status: 404 });

        const fullEmp = await prisma.employee.findUnique({ where: { id: emp.id }, include: { role: true } });
        const newRole = await resolveRole(data.newRoleId ?? data.newRole ?? data.role);
        if (!newRole) return NextResponse.json({ error: 'New role not found' }, { status: 404 });
        if (newRole.level <= fullEmp.role.level) return NextResponse.json({ error: `New role (${newRole.title}, L${newRole.level}) must be higher than current role (${fullEmp.role.title}, L${fullEmp.role.level})` }, { status: 400 });

        await prisma.$transaction([
          prisma.promotionHistory.create({
            data: { employeeId: fullEmp.id, oldRoleId: fullEmp.roleId, newRoleId: newRole.id, remarks: data.remarks || 'AI-assisted promotion' },
          }),
          prisma.employee.update({ where: { id: fullEmp.id }, data: { roleId: newRole.id } }),
        ]);
        return NextResponse.json({ success: true, message: `${fullEmp.name} promoted from ${fullEmp.role.title} → ${newRole.title}.` });
      }

      /* ── Create employee ──────────────────────────────────── */
      case 'create_employee': {
        if (!data.name) return NextResponse.json({ error: 'Employee name is required' }, { status: 400 });

        // Auto-generate code if missing
        const empCode = data.employeeCode ?? data.code ?? `EMP${Date.now().toString().slice(-5)}`;

        // Resolve or pick default dept
        let dept = null;
        if (data.departmentId ?? data.department ?? data.dept) {
          dept = await resolveDept(data.departmentId ?? data.department ?? data.dept);
        }
        if (!dept) dept = await getDefaultDept();
        if (!dept) return NextResponse.json({ error: 'No departments found. Create one first.' }, { status: 400 });

        // Resolve or pick default role
        let role = null;
        if (data.roleId ?? data.role) {
          role = await resolveRole(data.roleId ?? data.role);
        }
        if (!role) role = await getDefaultRole();
        if (!role) return NextResponse.json({ error: 'No roles found. Create one first.' }, { status: 400 });

        const emp = await prisma.employee.create({
          data: {
            name:         data.name.trim(),
            employeeCode: empCode.trim(),
            email:        data.email || null,
            phone:        data.phone || null,
            experience:   Number(data.experience) || 0,
            departmentId: dept.id,
            roleId:       role.id,
            status:       'ACTIVE',
          },
          include: { department: true, role: true },
        });
        return NextResponse.json({ success: true, record: emp, message: `Employee ${emp.name} (${emp.employeeCode}) created in ${emp.department.name} as ${emp.role.title}.` });
      }

      /* ── Update employee (any fields) ────────────────────────── */
      case 'update_employee': {
        const emp = await resolveEmployee(data.employeeId ?? data.employee ?? data.employeeCode ?? data.code);
        if (!emp) return NextResponse.json({ error: 'Employee not found — try using the employee code (e.g. EMP001)' }, { status: 404 });

        const updateData = {};
        if (data.name  !== undefined && data.name !== null) updateData.name = data.name.trim();
        if (data.email !== undefined) updateData.email = data.email ? data.email.trim() : null;
        if (data.phone !== undefined) updateData.phone = data.phone ? data.phone.trim() : null;
        if (data.experience !== undefined) updateData.experience = Number(data.experience);
        if (data.departmentId ?? data.department ?? data.dept) {
          const dept = await resolveDept(data.departmentId ?? data.department ?? data.dept);
          if (dept) updateData.departmentId = dept.id;
        }
        if (data.roleId ?? data.role) {
          const role = await resolveRole(data.roleId ?? data.role);
          if (role) updateData.roleId = role.id;
        }
        if (data.status !== undefined) {
          const valid = ['ACTIVE', 'ON_LEAVE', 'RESIGNED', 'TERMINATED'];
          const s = data.status?.toUpperCase();
          if (valid.includes(s)) updateData.status = s;
        }

        if (Object.keys(updateData).length === 0) {
          return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
        }

        const updated = await prisma.employee.update({
          where: { id: emp.id }, data: updateData,
          include: { department: true, role: true },
        });
        const fields = Object.keys(updateData).join(', ');
        return NextResponse.json({ success: true, record: updated, message: `${updated.name} (${updated.employeeCode}) updated: ${fields}.` });
      }

      /* ── Delete employee ──────────────────────────────────── */
      case 'delete_employee': {
        const emp = await resolveEmployee(data.employeeId ?? data.employee ?? data.employeeCode ?? data.code);
        if (!emp) return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
        await prisma.employee.delete({ where: { id: emp.id } });
        return NextResponse.json({ success: true, message: `Employee ${emp.name} (${emp.employeeCode}) deleted.` });
      }

      /* ── Update production record ────────────────────────────── */
      case 'update_production': {
        if (!data.recordId) return NextResponse.json({ error: 'recordId required' }, { status: 400 });
        const existing = await prisma.production.findUnique({
          where: { id: Number(data.recordId) }, include: { product: true },
        });
        if (!existing) return NextResponse.json({ error: 'Production record not found' }, { status: 404 });

        const updateData = {};
        if (data.units   !== undefined) updateData.units   = Number(data.units);
        if (data.defects !== undefined) updateData.defects = Number(data.defects);
        if (data.shift   !== undefined) updateData.shift   = data.shift;
        if (data.productId ?? data.product) {
          const prod = await resolveProduct(data.productId ?? data.product);
          if (prod) updateData.productId = prod.id;
        }
        if (data.employeeId ?? data.employee) {
          const emp = await resolveEmployee(data.employeeId ?? data.employee);
          updateData.employeeId = emp?.id ?? null;
        }
        if (updateData.units !== undefined) {
          const p = existing.product;
          updateData.revenue = updateData.units * (p.unitPrice || 0);
          updateData.cost    = updateData.units * (p.unitCost  || 0);
          updateData.profit  = updateData.revenue - updateData.cost;
        }
        const rec = await prisma.production.update({
          where: { id: Number(data.recordId) }, data: updateData,
          include: { product: true, employee: true },
        });
        return NextResponse.json({ success: true, record: rec, message: `Production record #${rec.id} updated.` });
      }

      /* ── Delete production record ─────────────────────────── */
      case 'delete_production': {
        const recId = Number(data.recordId ?? data.id);
        if (!recId) return NextResponse.json({ error: 'recordId required' }, { status: 400 });
        const rec = await prisma.production.findUnique({
          where: { id: recId }, include: { product: true },
        });
        if (!rec) return NextResponse.json({ error: 'Production record not found' }, { status: 404 });
        await prisma.production.delete({ where: { id: recId } });
        return NextResponse.json({ success: true, message: `Production record #${rec.id} (${rec.product?.name}, ${rec.units} units) deleted.` });
      }

      default:
        return NextResponse.json({ error: `Unknown action type: ${type}` }, { status: 400 });
    }
  } catch (err) {
    console.error('AI Action error:', err);
    return NextResponse.json({ error: err.message || 'Action failed' }, { status: 500 });
  }
}
