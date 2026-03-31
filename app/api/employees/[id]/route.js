import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

/* =========================================================================
   DELETE SINGLE EMPLOYEE
======================================================================== */
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;

    await prisma.employee.delete({
      where: { id: Number(id) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete Employee Error:", error);
    return NextResponse.json(
      { error: "Delete failed" },
      { status: 500 }
    );
  }
}

/* =========================================================================
   UPDATE EMPLOYEE
======================================================================== */
export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, experience, departmentId, roleId, email, phone } = body;

    const updated = await prisma.employee.update({
      where: { id: Number(id) },
      data: {
        ...(name && { name: name.trim() }),
        ...(experience !== undefined && { experience: Number(experience) }),
        ...(departmentId && { departmentId: Number(departmentId) }),
        ...(roleId && { roleId: Number(roleId) }),
        ...(email !== undefined && { email: email ? email.trim() : null }),
        ...(phone !== undefined && { phone: phone ? phone.trim() : null }),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Update Employee Error:", error);
    return NextResponse.json(
      { error: "Update failed" },
      { status: 500 }
    );
  }
}
