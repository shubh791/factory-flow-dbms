import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

/* =========================================================================
   DELETE ALL PRODUCTION RECORDS
======================================================================== */
export async function DELETE(request) {
  try {
    const result = await prisma.production.deleteMany();

    return NextResponse.json({
      success: true,
      deletedCount: result.count,
      message: "All production records cleared successfully.",
    });
  } catch (error) {
    console.error("Clear Production Error:", error);
    return NextResponse.json(
      { error: "Bulk delete failed" },
      { status: 500 }
    );
  }
}
