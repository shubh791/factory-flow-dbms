import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const records = await prisma.production.findMany({
      include: { product: true },
    });

    if (!records.length) return NextResponse.json({ empty: true });

    let totalUnits = 0;
    let totalDefects = 0;
    let revenue = 0;
    let cost = 0;

    const productMap = {};
    const employeeSet = new Set();

    records.forEach((r) => {
      const units = Number(r.units) || 0;
      const defects = Number(r.defects) || 0;
      const goodUnits = units - defects;

      totalUnits += units;
      totalDefects += defects;

      revenue += goodUnits * (r.product?.unitPrice || 0);
      cost += units * (r.product?.unitCost || 0);

      if (!productMap[r.product.name]) {
        productMap[r.product.name] = {
          units: 0,
          defects: 0,
        };
      }

      productMap[r.product.name].units += units;
      productMap[r.product.name].defects += defects;

      if (r.employeeId) {
        employeeSet.add(r.employeeId);
      }
    });

    const efficiency =
      totalUnits > 0
        ? ((totalUnits - totalDefects) / totalUnits) * 100
        : 0;

    const profit = revenue - cost;

    const activeEmployees = employeeSet.size;

    const workforceProductivity =
      activeEmployees > 0
        ? Math.round(totalUnits / activeEmployees)
        : 0;

    return NextResponse.json({
      totalUnits,
      totalDefects,
      efficiency: Number(efficiency.toFixed(2)),
      revenue,
      cost,
      profit,
      activeEmployees,
      workforceProductivity,
      productStats: productMap,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: 'Analytics fetch failed' },
      { status: 500 }
    );
  }
}
