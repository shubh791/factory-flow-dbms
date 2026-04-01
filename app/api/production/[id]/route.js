import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

/* =========================================================================
   DELETE SINGLE PRODUCTION RECORD
======================================================================== */
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;

    await prisma.production.delete({
      where: { id: Number(id) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete Production Error:", error);
    return NextResponse.json(
      { error: "Delete failed" },
      { status: 500 }
    );
  }
}

/* =========================================================================
   UPDATE PRODUCTION RECORD
======================================================================== */
export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { units, defects, productId, employeeId, shift } = body;

    const existing = await prisma.production.findUnique({
      where: { id: Number(id) },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Record not found" },
        { status: 404 }
      );
    }

    const newUnits = units !== undefined ? Number(units) : existing.units;
    const newDefects = defects !== undefined ? Number(defects) : existing.defects;

    if (newDefects > newUnits) {
      return NextResponse.json(
        { error: "Defects cannot exceed produced units" },
        { status: 400 }
      );
    }

    const newProductId = productId ? Number(productId) : existing.productId;

    const product = await prisma.product.findUnique({
      where: { id: newProductId },
    });

    const unitPrice = product.unitPrice || 20;
    const unitCost = product.unitCost || 10;

    const goodUnits = newUnits - newDefects;

    const revenue = goodUnits * unitPrice;
    const cost = newUnits * unitCost;
    const profit = revenue - cost;

    const updated = await prisma.production.update({
      where: { id: Number(id) },
      data: {
        units: newUnits,
        defects: newDefects,
        ...(productId && { productId: newProductId }),
        ...(employeeId !== undefined && { employeeId: employeeId ? Number(employeeId) : null }),
        ...(shift && { shift }),
        ...(body.productionDate && { productionDate: new Date(body.productionDate) }),
        revenue,
        cost,
        profit,
      },
      include: { product: true, employee: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Update Production Error:", error);
    return NextResponse.json(
      { error: "Production update failed" },
      { status: 500 }
    );
  }
}
