import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const [records, activeEmployeeCount] = await Promise.all([
      prisma.production.findMany({
        include: { product: true },
      }),
      prisma.employee.count({
        where: { status: 'ACTIVE' },
      }),
    ]);

    if (!records.length) {
      return NextResponse.json({
        totalProduction: 0,
        totalUnits: 0,
        totalDefects: 0,
        avgEfficiency: 0,
        efficiency: 0,
        avgDefectRate: 0,
        revenue: 0,
        cost: 0,
        profit: 0,
        activeEmployees: activeEmployeeCount,
        workforceProductivity: 0,
        productStats: {},
        empty: true,
      });
    }

    let totalUnits = 0;
    let totalDefects = 0;
    let revenue = 0;
    let cost = 0;

    const productMap = {};

    records.forEach((r) => {
      const units = Number(r.units) || 0;
      const defects = Number(r.defects) || 0;
      const goodUnits = units - defects;

      totalUnits += units;
      totalDefects += defects;

      revenue += goodUnits * (r.product?.unitPrice || 0);
      cost += units * (r.product?.unitCost || 0);

      if (!productMap[r.product.name]) {
        productMap[r.product.name] = { units: 0, defects: 0 };
      }
      productMap[r.product.name].units += units;
      productMap[r.product.name].defects += defects;
    });

    const efficiency =
      totalUnits > 0 ? ((totalUnits - totalDefects) / totalUnits) * 100 : 0;

    const avgDefectRate =
      totalUnits > 0 ? (totalDefects / totalUnits) * 100 : 0;

    const profit = revenue - cost;

    const workforceProductivity =
      activeEmployeeCount > 0
        ? Math.round(totalUnits / activeEmployeeCount)
        : 0;

    const result = {
      totalProduction: totalUnits,
      totalUnits,
      totalDefects,
      avgEfficiency: Number(efficiency.toFixed(2)),
      efficiency: Number(efficiency.toFixed(2)),
      avgDefectRate: Number(avgDefectRate.toFixed(2)),
      revenue,
      cost,
      profit,
      activeEmployees: activeEmployeeCount,
      workforceProductivity,
      productStats: productMap,
    };

    return NextResponse.json(result);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: 'Analytics fetch failed' },
      { status: 500 }
    );
  }
}
