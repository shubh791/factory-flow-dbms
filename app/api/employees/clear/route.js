import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

/* =========================================================================
   DELETE ALL EMPLOYEES (ADMIN RESET)
======================================================================== */
export async function DELETE(request) {
  try {
    // delete dependent data first
    await prisma.promotionHistory.deleteMany();
    await prisma.production.deleteMany();
    await prisma.auditLog.deleteMany();

    const result = await prisma.employee.deleteMany();

    return NextResponse.json({
      success: true,
      deletedCount: result.count,
      message: "All employee-related data cleared safely.",
    });
  } catch (error) {
    console.error("Clear Employees Error:", error);
    return NextResponse.json(
      { error: "Bulk delete failed" },
      { status: 500 }
    );
  }
}
