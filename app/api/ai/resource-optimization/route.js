import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function GET() {
  try {
    /* ── Gather comprehensive resource data ──────────────────────── */
    const [employees, production, departments] = await Promise.all([
      prisma.employee.findMany({
        where: { isDeleted: false },
        include: {
          department: { select: { name: true } },
          role: { select: { title: true, level: true } },
          productions: {
            where: { productionDate: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
            select: { units: true, defects: true, shift: true },
          },
        },
      }),
      prisma.production.aggregate({
        _sum: { units: true, defects: true, revenue: true, cost: true },
        _avg: { units: true, defects: true },
      }),
      prisma.department.findMany({
        include: {
          employees: { where: { isDeleted: false }, select: { id: true } },
        },
      }),
    ]);

    /* ── Calculate department efficiency ─────────────────────────── */
    const deptMetrics = departments.map(dept => ({
      name: dept.name,
      headcount: dept.employees.length,
      code: dept.code,
    }));

    /* ── Employee productivity analysis ──────────────────────────── */
    const empProductivity = employees.map(emp => ({
      name: emp.name,
      department: emp.department.name,
      role: emp.role.title,
      recentUnits: emp.productions.reduce((s, p) => s + p.units, 0),
      recentDefects: emp.productions.reduce((s, p) => s + p.defects, 0),
      efficiency: emp.productions.length > 0
        ? ((emp.productions.reduce((s, p) => s + p.units - p.defects, 0) / emp.productions.reduce((s, p) => s + p.units, 0)) * 100).toFixed(1)
        : 0,
    })).sort((a, b) => b.recentUnits - a.recentUnits).slice(0, 20);

    const prompt = `You are a resource optimization AI consultant for an industrial facility.

Current State:
- Total employees: ${employees.length}
- Departments: ${JSON.stringify(deptMetrics)}
- Total production (30d): ${production._sum.units || 0} units
- Total defects: ${production._sum.defects || 0}
- Top performers: ${JSON.stringify(empProductivity.slice(0, 5))}

Analyze and provide:
1. **staffingRecommendations**: Overstaffed/understaffed departments with specific headcount changes
2. **shiftOptimization**: Better shift allocation strategies
3. **trainingNeeds**: Skills gaps and training priorities
4. **crossDepartmentOpportunities**: Resource sharing opportunities
5. **expectedImpact**: Productivity increase % and cost savings

Respond with valid JSON only.`;

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.25,
      max_tokens: 900,
    });

    const raw = completion.choices[0]?.message?.content ?? '{}';
    let result;
    try {
      const cleaned = raw.replace(/```json\n?|\n?```/g, '').trim();
      result = JSON.parse(cleaned);
    } catch {
      result = { staffingRecommendations: [], message: raw };
    }

    return NextResponse.json({
      ...result,
      currentMetrics: {
        totalEmployees: employees.length,
        departmentCount: departments.length,
        avgProductivity: Number((production._avg.units || 0).toFixed(1)),
      },
    });
  } catch (err) {
    console.error('RESOURCE OPTIMIZATION ERROR:', err);
    return NextResponse.json({ error: 'Optimization failed' }, { status: 500 });
  }
}
