import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [
      records, activeEmployeeCount, totalEmployeeCount,
      currentMonthAggr, lastMonthAggr,
      todayAggr, recentTrend,
    ] = await Promise.all([
      prisma.production.findMany({ include: { product: true } }),
      prisma.employee.count({ where: { status: 'ACTIVE' } }),
      prisma.employee.count({ where: { isDeleted: false } }),

      // Current month
      prisma.production.aggregate({
        where: { productionDate: { gte: startOfMonth } },
        _sum: { units: true, defects: true },
      }),

      // Last month
      prisma.production.aggregate({
        where: { productionDate: { gte: startOfLastMonth, lte: endOfLastMonth } },
        _sum: { units: true, defects: true },
      }),

      // Today
      prisma.production.aggregate({
        where: { productionDate: { gte: todayStart } },
        _sum: { units: true, defects: true },
        _count: true,
      }),

      // Last 30 days for trend
      prisma.production.findMany({
        where: { productionDate: { gte: new Date(now - 30 * 24 * 60 * 60 * 1000) } },
        select: { units: true, defects: true, productionDate: true },
        orderBy: { productionDate: 'asc' },
      }),
    ]);

    if (!records.length) {
      return NextResponse.json({
        totalProduction: 0, totalUnits: 0, totalDefects: 0,
        avgEfficiency: 0, efficiency: 0, avgDefectRate: 0,
        revenue: 0, cost: 0, profit: 0,
        activeEmployees: activeEmployeeCount, totalEmployees: totalEmployeeCount,
        workforceProductivity: 0, productStats: {},
        productionChange: '+0.0%', efficiencyChange: '+0.0%',
        defectChange: '+0.0%', todayUnits: 0, todayDefects: 0,
        trend: 'stable', empty: true,
      });
    }

    let totalUnits = 0, totalDefects = 0, revenue = 0, cost = 0;
    const productMap = {};

    records.forEach((r) => {
      const units   = Number(r.units)   || 0;
      const defects = Number(r.defects) || 0;
      const goodUnits = units - defects;

      totalUnits   += units;
      totalDefects += defects;
      revenue += goodUnits * (r.product?.unitPrice || 0);
      cost    += units     * (r.product?.unitCost  || 0);

      const pName = r.product?.name || 'Unknown';
      if (!productMap[pName]) productMap[pName] = { units: 0, defects: 0 };
      productMap[pName].units   += units;
      productMap[pName].defects += defects;
    });

    const efficiency    = totalUnits > 0 ? ((totalUnits - totalDefects) / totalUnits) * 100 : 0;
    const avgDefectRate = totalUnits > 0 ? (totalDefects / totalUnits) * 100 : 0;
    const profit        = revenue - cost;
    const workforceProductivity = activeEmployeeCount > 0
      ? Math.round(totalUnits / activeEmployeeCount) : 0;

    // Period comparison
    const curUnits  = currentMonthAggr._sum.units  ?? 0;
    const prevUnits = lastMonthAggr._sum.units      ?? 0;
    const curDef    = currentMonthAggr._sum.defects ?? 0;
    const prevDef   = lastMonthAggr._sum.defects    ?? 0;

    const calcChange = (cur, prev) => {
      if (prev === 0 && cur === 0) return '+0.0%';
      if (prev === 0) return `+${cur > 0 ? '100.0' : '0.0'}%`;
      const pct = ((cur - prev) / prev * 100).toFixed(1);
      return pct >= 0 ? `+${pct}%` : `${pct}%`;
    };

    const productionChange = calcChange(curUnits, prevUnits);

    // Efficiency change
    const curEff  = curUnits  > 0 ? ((curUnits  - curDef)  / curUnits  * 100) : 0;
    const prevEff = prevUnits > 0 ? ((prevUnits - prevDef) / prevUnits * 100) : 0;
    const effDiff = (curEff - prevEff).toFixed(1);
    const efficiencyChange = effDiff >= 0 ? `+${effDiff}%` : `${effDiff}%`;

    // Defect rate change
    const curDefRate  = curUnits  > 0 ? (curDef  / curUnits  * 100) : 0;
    const prevDefRate = prevUnits > 0 ? (prevDef / prevUnits * 100) : 0;
    const defDiff = (curDefRate - prevDefRate).toFixed(1);
    const defectChange = defDiff >= 0 ? `+${defDiff}%` : `${defDiff}%`;

    // Trend detection
    let trend = 'stable';
    if (recentTrend.length >= 6) {
      const half   = Math.floor(recentTrend.length / 2);
      const first  = recentTrend.slice(0, half).reduce((s, r) => s + r.units, 0);
      const second = recentTrend.slice(half).reduce((s, r) => s + r.units, 0);
      if (second > first * 1.05) trend = 'increasing';
      else if (second < first * 0.95) trend = 'declining';
    }

    return NextResponse.json({
      totalProduction: totalUnits,
      totalUnits, totalDefects,
      avgEfficiency: Number(efficiency.toFixed(2)),
      efficiency:    Number(efficiency.toFixed(2)),
      avgDefectRate: Number(avgDefectRate.toFixed(2)),
      revenue: Math.round(revenue),
      cost:    Math.round(cost),
      profit:  Math.round(profit),
      activeEmployees: activeEmployeeCount,
      totalEmployees:  totalEmployeeCount,
      workforceProductivity,
      productStats: productMap,
      productionChange,
      efficiencyChange,
      defectChange,
      todayUnits:   todayAggr._sum.units   ?? 0,
      todayDefects: todayAggr._sum.defects ?? 0,
      todayRecords: todayAggr._count       ?? 0,
      trend,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Analytics fetch failed' }, { status: 500 });
  }
}
