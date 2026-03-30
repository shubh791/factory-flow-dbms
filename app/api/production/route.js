import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

/* =========================================================================
   GET ALL PRODUCTION RECORDS
======================================================================== */
export async function GET(request) {
  try {
    const data = await prisma.production.findMany({
      select: {
        id: true,
        units: true,
        defects: true,
        revenue: true,
        cost: true,
        profit: true,
        productionDate: true,

        product: {
          select: {
            id: true,
            name: true,
          },
        },

        employee: {
          select: {
            id: true,
            name: true,
            employeeCode: true,
            department: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },

      orderBy: {
        productionDate: "desc",
      },
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error("Production Fetch Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch production data" },
      { status: 500 }
    );
  }
}

/* =========================================================================
   CREATE PRODUCTION RECORD
======================================================================== */
export async function POST(request) {
  try {
    const body = await request.json();
    const { units, defects, productId, shift, employeeId } = body;

    if (!employeeId) {
      return NextResponse.json(
        { error: "Employee ID is required" },
        { status: 400 }
      );
    }

    const parsedUnits = Number(units) || 0;
    const parsedDefects = Number(defects) || 0;

    if (parsedDefects > parsedUnits) {
      return NextResponse.json(
        { error: "Defects cannot exceed produced units" },
        { status: 400 }
      );
    }

    const product = await prisma.product.findUnique({
      where: { id: Number(productId) },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    const unitPrice = product.unitPrice || 20;
    const unitCost = product.unitCost || 10;

    /* ================= INDUSTRIAL CALCULATION ================= */

    const goodUnits = parsedUnits - parsedDefects;

    const revenue = goodUnits * unitPrice;
    const cost = parsedUnits * unitCost;
    const profit = revenue - cost;

    const record = await prisma.production.create({
      data: {
        units: parsedUnits,
        defects: parsedDefects,
        productId: Number(productId),
        employeeId: Number(employeeId),
        shift: shift || "MORNING",
        productionDate: new Date(),
        revenue,
        cost,
        profit,
      },
    });

    return NextResponse.json(record);
  } catch (error) {
    console.error("Production Create Error:", error);
    return NextResponse.json(
      { error: "Production record failed" },
      { status: 500 }
    );
  }
}
