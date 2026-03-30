import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

/* =========================================================================
   GET ALL PROMOTIONS
======================================================================== */
export async function GET(request) {
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

    return NextResponse.json(promotions);
  } catch (error) {
    console.error("GET PROMOTIONS ERROR:", error);
    return NextResponse.json(
      { error: "Failed to fetch promotions" },
      { status: 500 }
    );
  }
}

/* =========================================================================
   CREATE PROMOTION (TRANSACTION SAFE)
======================================================================== */
export async function POST(request) {
  try {
    const body = await request.json();
    const { employeeId, newRoleId, remarks } = body;

    if (!employeeId || !newRoleId) {
      return NextResponse.json(
        { error: "Employee and new role are required" },
        { status: 400 }
      );
    }

    const employee = await prisma.employee.findUnique({
      where: { id: Number(employeeId) },
      include: { role: true },
    });

    if (!employee) {
      return NextResponse.json(
        { error: "Employee not found" },
        { status: 404 }
      );
    }

    const newRole = await prisma.role.findUnique({
      where: { id: Number(newRoleId) },
    });

    if (!newRole) {
      return NextResponse.json(
        { error: "Role not found" },
        { status: 404 }
      );
    }

    if (employee.roleId === Number(newRoleId)) {
      return NextResponse.json(
        { error: "Employee already holds this role" },
        { status: 400 }
      );
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
          action: "PROMOTION",
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

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("PROMOTION ERROR:", error);
    return NextResponse.json(
      { error: error.message || "Promotion failed" },
      { status: 500 }
    );
  }
}
