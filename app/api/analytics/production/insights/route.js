import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const records = await prisma.production.findMany({
      include: {
        product: true,
        employee: {
          include: {
            department: true,
          },
        },
      },
      orderBy: {
        productionDate: 'asc',
      },
    });

    if (!records.length) {
      return NextResponse.json(null);
    }

    let totalUnits = 0;
    let totalDefects = 0;
    let revenue = 0;
    let cost = 0;

    const monthlyMap = {};
    const departmentMap = {};

    records.forEach((r) => {
      const units = Number(r.units) || 0;
      const defects = Number(r.defects) || 0;

      totalUnits += units;
      totalDefects += defects;

      revenue += units * (r.product?.unitPrice || 0);
      cost += units * (r.product?.unitCost || 0);

      /* Monthly Aggregation */
      const d = new Date(r.productionDate);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;

      if (!monthlyMap[key]) {
        monthlyMap[key] = { units: 0, defects: 0 };
      }

      monthlyMap[key].units += units;
      monthlyMap[key].defects += defects;

      /* Department Aggregation */
      const dept = r.employee?.department?.name || 'Unknown';

      if (!departmentMap[dept]) {
        departmentMap[dept] = { units: 0, defects: 0 };
      }

      departmentMap[dept].units += units;
      departmentMap[dept].defects += defects;
    });

    const efficiency =
      totalUnits > 0
        ? ((totalUnits - totalDefects) / totalUnits) * 100
        : 0;

    const profit = revenue - cost;

    const months = Object.keys(monthlyMap).sort(
      (a, b) => new Date(a) - new Date(b)
    );

    const monthlyTrend = months.map((m) => {
      const [year, month] = m.split('-');
      return {
        month: new Date(year, month - 1).toLocaleString('default', {
          month: 'short',
          year: '2-digit',
        }),
        units: monthlyMap[m].units,
        defects: monthlyMap[m].defects,
      };
    });

    const departmentStats = Object.entries(departmentMap).map(
      ([name, data]) => ({
        name,
        efficiency:
          data.units > 0
            ? ((data.units - data.defects) / data.units) * 100
            : 0,
      })
    );

    const worstDepartment =
      departmentStats.length > 0
        ? departmentStats.sort(
            (a, b) => a.efficiency - b.efficiency
          )[0]
        : null;

    return NextResponse.json({
      totalUnits,
      totalDefects,
      efficiency,
      revenue,
      cost,
      profit,
      projectedUnits:
        monthlyTrend.length > 1
          ? monthlyTrend[monthlyTrend.length - 1].units
          : null,
      worstDepartment,
      monthlyTrend,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: 'Production insights failed' },
      { status: 500 }
    );
  }
}
