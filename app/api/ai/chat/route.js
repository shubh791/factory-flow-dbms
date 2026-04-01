import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { chatSystemPrompt } from '@/lib/prompts';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(request) {
  try {
    const { message, history = [] } = await request.json();
    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    /* ── Context snapshot from DB (all parallel) ─────────────────── */
    const [
      empCount, deptCount, prodCount, aggr, activeEmp,
      productionByProduct, deptPerf, topEmpProd,
      todayAggr, latestRecord,
      allEmployees, allDepts, allRoles,
    ] = await Promise.all([
      prisma.employee.count(),
      prisma.department.count(),
      prisma.production.count(),
      prisma.production.aggregate({ _sum: { units: true, defects: true, revenue: true, profit: true } }),
      prisma.employee.count({ where: { status: 'ACTIVE' } }),

      // Per-product breakdown sorted by defect rate
      prisma.production.groupBy({
        by: ['productId'],
        _sum: { units: true, defects: true },
        orderBy: { _sum: { defects: 'desc' } },
      }),

      // Per-department efficiency (recent 500 records)
      prisma.production.findMany({
        select: {
          units: true, defects: true,
          employee: { select: { department: { select: { name: true } } } },
        },
        take: 500,
        orderBy: { productionDate: 'desc' },
      }),

      // Top 10 employee producers
      prisma.production.groupBy({
        by: ['employeeId'],
        _sum: { units: true, defects: true },
        orderBy: { _sum: { units: 'desc' } },
        take: 10,
      }),

      // Today's production stats
      prisma.production.aggregate({
        where: { productionDate: { gte: todayStart } },
        _sum: { units: true, defects: true },
        _count: true,
      }),

      // Latest production record
      prisma.production.findFirst({
        orderBy: { createdAt: 'desc' },
        include: { product: true, employee: { select: { name: true, department: { select: { name: true } } } } },
      }),

      // All employees for AI lookups
      prisma.employee.findMany({ select: { id: true, name: true, employeeCode: true, email: true, departmentId: true, roleId: true, status: true, department: { select: { name: true } }, role: { select: { title: true, level: true } } }, where: { isDeleted: false } }),

      // All departments
      prisma.department.findMany({ select: { id: true, name: true, code: true }, orderBy: { id: 'asc' } }),

      // All roles
      prisma.role.findMany({ select: { id: true, title: true, level: true }, orderBy: { level: 'asc' } }),
    ]);

    /* ── Product name lookup ─────────────────────────────────────── */
    const productRows = await prisma.product.findMany({ select: { id: true, name: true } });
    const productName = Object.fromEntries(productRows.map(p => [p.id, p.name]));

    const productStats = productionByProduct.map(p => {
      const units   = p._sum.units   ?? 0;
      const defects = p._sum.defects ?? 0;
      return {
        product:    productName[p.productId] ?? `Product #${p.productId}`,
        units, defects,
        defectRate: units > 0 ? ((defects / units) * 100).toFixed(2) : '0',
      };
    }).sort((a, b) => parseFloat(b.defectRate) - parseFloat(a.defectRate));

    /* ── Department efficiency ───────────────────────────────────── */
    const deptMap = {};
    deptPerf.forEach(r => {
      const name = r.employee?.department?.name;
      if (!name) return;
      if (!deptMap[name]) deptMap[name] = { units: 0, defects: 0 };
      deptMap[name].units   += r.units   ?? 0;
      deptMap[name].defects += r.defects ?? 0;
    });
    const deptStats = Object.entries(deptMap).map(([dept, v]) => ({
      department: dept,
      efficiency: v.units > 0 ? ((v.units - v.defects) / v.units * 100).toFixed(1) : '0',
      defectRate: v.units > 0 ? (v.defects / v.units * 100).toFixed(2) : '0',
    })).sort((a, b) => parseFloat(a.efficiency) - parseFloat(b.efficiency));

    /* ── Top producers ───────────────────────────────────────────── */
    const topEmpIds     = topEmpProd.map(e => e.employeeId).filter(Boolean);
    const topEmpDetails = await prisma.employee.findMany({
      where: { id: { in: topEmpIds } },
      select: { id: true, name: true, department: { select: { name: true } } },
    });
    const empById = Object.fromEntries(topEmpDetails.map(e => [e.id, e]));
    const topProducers = topEmpProd.filter(e => e.employeeId).map(e => {
      const emp     = empById[e.employeeId];
      const units   = e._sum.units   ?? 0;
      const defects = e._sum.defects ?? 0;
      return {
        name:       emp?.name ?? `Employee #${e.employeeId}`,
        department: emp?.department?.name ?? '—',
        units, defects,
        defectRate: units > 0 ? ((defects / units) * 100).toFixed(2) : '0',
      };
    });

    /* ── Overall KPIs ────────────────────────────────────────────── */
    const totalUnits   = aggr._sum.units   ?? 0;
    const totalDefects = aggr._sum.defects ?? 0;
    const efficiency   = totalUnits > 0
      ? ((totalUnits - totalDefects) / totalUnits * 100).toFixed(1)
      : '0';

    /* ── Today & latest ──────────────────────────────────────────── */
    const todayUnits   = todayAggr._sum.units   ?? 0;
    const todayDefects = todayAggr._sum.defects ?? 0;
    const todayRecords = todayAggr._count ?? 0;

    const latestInfo = latestRecord
      ? `${latestRecord.product?.name ?? '?'} — ${latestRecord.units} units, ${latestRecord.defects} defects by ${latestRecord.employee?.name ?? 'unknown'} on ${new Date(latestRecord.productionDate).toLocaleDateString('en-IN')}`
      : 'No records yet';

    /* ── Build system prompt ─────────────────────────────────────── */
    const metrics = {
      employeeCount: empCount, activeEmployees: activeEmp, departmentCount: deptCount,
      productionRecords: prodCount, totalUnits, totalDefects, efficiency,
      totalRevenue: Math.round(aggr._sum.revenue ?? 0),
      totalProfit:  Math.round(aggr._sum.profit  ?? 0),
      productStats, deptStats, topProducers,
      today: { units: todayUnits, defects: todayDefects, records: todayRecords },
      latestRecord: latestInfo,
      // Pass product and employee lists for action guidance
      products:  productRows,
      employees: topEmpDetails.map(e => ({ id: e.id, name: e.name, dept: e.department?.name })),
      allEmployees: allEmployees.map(e => ({ id: e.id, name: e.name, code: e.employeeCode, email: e.email, deptId: e.departmentId, roleId: e.roleId, dept: e.department?.name, role: e.role?.title, level: e.role?.level, status: e.status })),
      allDepts: allDepts.map(d => ({ id: d.id, name: d.name, code: d.code })),
      allRoles: allRoles.map(r => ({ id: r.id, title: r.title, level: r.level })),
    };

    const systemMsg = chatSystemPrompt(metrics);
    const recentHistory = history.slice(-12).map(m => ({ role: m.role, content: m.content }));
    const messages = [
      { role: 'system', content: systemMsg },
      ...recentHistory,
      { role: 'user',   content: message.trim() },
    ];

    /* ── Streaming response ──────────────────────────────────────── */
    const stream = await groq.chat.completions.create({
      model:       'llama-3.3-70b-versatile',
      messages,
      temperature: 0.45,
      max_tokens:  1200,
      stream:      true,
    });

    const encoder  = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content ?? '';
            if (text) controller.enqueue(encoder.encode(text));
          }
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type':      'text/plain; charset=utf-8',
        'Cache-Control':     'no-cache',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (err) {
    console.error('CHAT ERROR:', err);
    return NextResponse.json({ error: 'AI chat unavailable' }, { status: 500 });
  }
}
