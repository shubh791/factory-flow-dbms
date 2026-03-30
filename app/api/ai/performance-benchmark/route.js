import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function GET() {
  try {
    /* ── Gather all performance data ─────────────────────────────── */
    const [productionStats, employeeStats, departmentStats, financialStats] = await Promise.all([
      prisma.production.aggregate({
        _sum: { units: true, defects: true, revenue: true, cost: true, profit: true },
        _avg: { units: true, defects: true },
        _count: true,
      }),
      prisma.employee.aggregate({ _count: true }),
      prisma.department.aggregate({ _count: true }),
      prisma.production.groupBy({
        by: ['shift'],
        _sum: { units: true, defects: true },
        _avg: { units: true },
      }),
    ]);

    /* ── Calculate KPIs ──────────────────────────────────────────── */
    const totalUnits = productionStats._sum.units || 0;
    const totalDefects = productionStats._sum.defects || 0;
    const efficiency = totalUnits > 0 ? ((totalUnits - totalDefects) / totalUnits * 100).toFixed(1) : '0';
    const avgUnitsPerRecord = productionStats._avg.units || 0;
    const totalRevenue = productionStats._sum.revenue || 0;
    const totalCost = productionStats._sum.cost || 0;
    const totalProfit = productionStats._sum.profit || 0;
    const profitMargin = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : '0';

    // Units per employee
    const unitsPerEmployee = employeeStats._count > 0 ? (totalUnits / employeeStats._count).toFixed(0) : '0';

    // Industry benchmarks (typical manufacturing)
    const industryBenchmarks = {
      efficiency: 92, // 92% is good
      defectRate: 2.5, // 2.5% is acceptable
      unitsPerEmployee: 1500, // monthly
      profitMargin: 15, // 15%
    };

    const currentDefectRate = totalUnits > 0 ? ((totalDefects / totalUnits) * 100).toFixed(2) : '0';

    const prompt = `You are an industrial performance benchmarking AI consultant.

Current Performance:
- Efficiency: ${efficiency}% (Benchmark: ${industryBenchmarks.efficiency}%)
- Defect Rate: ${currentDefectRate}% (Benchmark: ${industryBenchmarks.defectRate}%)
- Units per Employee: ${unitsPerEmployee} (Benchmark: ${industryBenchmarks.unitsPerEmployee})
- Profit Margin: ${profitMargin}% (Benchmark: ${industryBenchmarks.profitMargin}%)
- Total Production: ${totalUnits} units
- Employees: ${employeeStats._count}
- Shift Performance: ${JSON.stringify(financialStats)}

Provide:
1. **performanceGrade**: Overall grade (A+ to F) with justification
2. **strengths**: Top 3 areas performing above benchmark
3. **weaknesses**: Top 3 areas needing improvement
4. **competitivePosition**: How this facility ranks (Top 10%, Average, Below Average)
5. **actionPlan**: 5 concrete steps to reach top-tier performance
6. **projectedImpact**: Expected improvements in 3/6/12 months

Respond with valid JSON only.`;

    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.25,
      max_tokens: 1000,
    });

    const raw = completion.choices[0]?.message?.content ?? '{}';
    let result;
    try {
      const cleaned = raw.replace(/```json\n?|\n?```/g, '').trim();
      result = JSON.parse(cleaned);
    } catch {
      result = { performanceGrade: 'N/A', message: raw };
    }

    return NextResponse.json({
      ...result,
      currentMetrics: {
        efficiency: Number(efficiency),
        defectRate: Number(currentDefectRate),
        unitsPerEmployee: Number(unitsPerEmployee),
        profitMargin: Number(profitMargin),
      },
      benchmarks: industryBenchmarks,
      gaps: {
        efficiencyGap: (Number(efficiency) - industryBenchmarks.efficiency).toFixed(1),
        defectRateGap: (Number(currentDefectRate) - industryBenchmarks.defectRate).toFixed(2),
        productivityGap: (Number(unitsPerEmployee) - industryBenchmarks.unitsPerEmployee).toFixed(0),
        profitMarginGap: (Number(profitMargin) - industryBenchmarks.profitMargin).toFixed(1),
      },
    });
  } catch (err) {
    console.error('BENCHMARK ERROR:', err);
    return NextResponse.json({ error: 'Benchmarking failed' }, { status: 500 });
  }
}
