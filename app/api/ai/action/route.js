import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

/**
 * POST /api/ai/action
 * Executes AI-suggested CRUD actions confirmed by the user in the chat UI.
 * Body: { type: string, data: object }
 */
export async function POST(request) {
  try {
    const { type, data } = await request.json();
    if (!type) return NextResponse.json({ error: 'Action type required' }, { status: 400 });

    switch (type) {

      /* ── Create production record ─────────────────────────── */
      case 'create_production': {
        if (!data.productId) return NextResponse.json({ error: 'productId required' }, { status: 400 });
        const product = await prisma.product.findUnique({ where: { id: Number(data.productId) } });
        if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

        const units   = Number(data.units)   || 0;
        const defects = Number(data.defects) || 0;
        const revenue = units   * (product.unitPrice || 0);
        const cost    = units   * (product.unitCost  || 0);

        const record = await prisma.production.create({
          data: {
            units,
            defects,
            shift:          data.shift        || 'MORNING',
            productId:      product.id,
            employeeId:     data.employeeId   ? Number(data.employeeId)  : null,
            productionDate: data.productionDate ? new Date(data.productionDate) : new Date(),
            revenue,
            cost,
            profit: revenue - cost,
          },
          include: { product: true, employee: { include: { department: true } } },
        });
        return NextResponse.json({ success: true, record, message: `Production record created: ${units} units of ${product.name}.` });
      }

      /* ── Update employee status ───────────────────────────── */
      case 'update_employee_status': {
        if (!data.employeeId || !data.status) return NextResponse.json({ error: 'employeeId and status required' }, { status: 400 });
        const valid = ['ACTIVE', 'ON_LEAVE', 'RESIGNED', 'TERMINATED'];
        if (!valid.includes(data.status)) return NextResponse.json({ error: `Status must be one of: ${valid.join(', ')}` }, { status: 400 });

        const emp = await prisma.employee.update({
          where: { id: Number(data.employeeId) },
          data:  { status: data.status },
          include: { department: true, role: true },
        });
        return NextResponse.json({ success: true, record: emp, message: `${emp.name}'s status updated to ${data.status}.` });
      }

      /* ── Promote employee ─────────────────────────────────── */
      case 'promote_employee': {
        if (!data.employeeId || !data.newRoleId) return NextResponse.json({ error: 'employeeId and newRoleId required' }, { status: 400 });

        const emp     = await prisma.employee.findUnique({ where: { id: Number(data.employeeId) }, include: { role: true } });
        if (!emp) return NextResponse.json({ error: 'Employee not found' }, { status: 404 });

        const newRole = await prisma.role.findUnique({ where: { id: Number(data.newRoleId) } });
        if (!newRole) return NextResponse.json({ error: 'Role not found' }, { status: 404 });
        if (newRole.level <= emp.role.level) return NextResponse.json({ error: 'New role must have a higher level than current role' }, { status: 400 });

        await prisma.$transaction([
          prisma.promotionHistory.create({
            data: { employeeId: emp.id, oldRoleId: emp.roleId, newRoleId: newRole.id, remarks: data.remarks || 'AI-assisted promotion' },
          }),
          prisma.employee.update({ where: { id: emp.id }, data: { roleId: newRole.id } }),
        ]);
        return NextResponse.json({ success: true, message: `${emp.name} successfully promoted from ${emp.role.title} to ${newRole.title}.` });
      }

      /* ── Create employee ──────────────────────────────────── */
      case 'create_employee': {
        if (!data.name || !data.employeeCode || !data.departmentId || !data.roleId) {
          return NextResponse.json({ error: 'name, employeeCode, departmentId, roleId required' }, { status: 400 });
        }
        const emp = await prisma.employee.create({
          data: {
            name:         data.name,
            employeeCode: data.employeeCode,
            email:        data.email  || null,
            phone:        data.phone  || null,
            experience:   Number(data.experience) || 0,
            departmentId: Number(data.departmentId),
            roleId:       Number(data.roleId),
            status:       data.status || 'ACTIVE',
          },
          include: { department: true, role: true },
        });
        return NextResponse.json({ success: true, record: emp, message: `Employee ${emp.name} (${emp.employeeCode}) created successfully.` });
      }

      default:
        return NextResponse.json({ error: `Unknown action type: ${type}` }, { status: 400 });
    }
  } catch (err) {
    console.error('AI Action error:', err);
    return NextResponse.json({ error: err.message || 'Action failed' }, { status: 500 });
  }
}
