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
        shift: true,
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
    const { units, defects, productId, shift, employeeId, productionDate } = body;

    const parsedUnits   = Number(units)   || 0;
    const parsedDefects = Number(defects) || 0;

    if (parsedUnits <= 0) {
      return NextResponse.json({ error: 'Units must be greater than 0' }, { status: 400 });
    }
    if (parsedDefects > parsedUnits) {
      return NextResponse.json({ error: 'Defects cannot exceed produced units' }, { status: 400 });
    }
    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    const product = await prisma.product.findUnique({ where: { id: Number(productId) } });
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const goodUnits = parsedUnits - parsedDefects;
    const revenue   = goodUnits * (product.unitPrice || 0);
    const cost      = parsedUnits * (product.unitCost || 0);

    const record = await prisma.production.create({
      data: {
        units:          parsedUnits,
        defects:        parsedDefects,
        productId:      Number(productId),
        employeeId:     employeeId ? Number(employeeId) : null,
        shift:          shift || 'MORNING',
        productionDate: productionDate ? new Date(productionDate) : new Date(),
        revenue,
        cost,
        profit: revenue - cost,
      },
      include: { product: true, employee: true },
    });

    return NextResponse.json(record);
  } catch (error) {
    console.error('Production Create Error:', error);
    return NextResponse.json({ error: 'Production record failed' }, { status: 500 });
  }
}
