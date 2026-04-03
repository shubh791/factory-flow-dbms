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

    /* ── All DB queries in parallel ───────────────────────────────── */
    const [
      totalCounts,
      aggr,
      statusCounts,
      productionByProduct,
      productionByShift,
      empProdStats,
      deptPerfRaw,
      todayAggr,
      latestRecord,
      allEmployees,
      allDepts,
      allRoles,
      productRows,
      promotionCount,
      recentProdRaw,
    ] = await Promise.all([

      // Total counts
      Promise.all([
        prisma.employee.count(),
        prisma.department.count(),
        prisma.production.count(),
      ]),

      // All-time production aggregates
      prisma.production.aggregate({
        _sum: { units: true, defects: true, revenue: true, profit: true },
      }),

      // Employee count by status (ACTIVE / ON_LEAVE / RESIGNED / TERMINATED)
      prisma.employee.groupBy({
        by: ['status'],
        _count: { id: true },
        where: { isDeleted: false },
      }),

      // Per-product totals (for analytics questions)
      prisma.production.groupBy({
        by: ['productId'],
        _sum: { units: true, defects: true, revenue: true, profit: true },
      }),

      // Per-shift totals (for "which shift has most production" questions)
      prisma.production.groupBy({
        by: ['shift'],
        _sum: { units: true, defects: true },
        _count: { id: true },
      }),

      // Per-employee production totals — ALL employees, no limit
      prisma.production.groupBy({
        by: ['employeeId'],
        _sum: { units: true, defects: true },
        where: { employeeId: { not: null } },
      }),

      // Per-department efficiency (recent 300 records is enough for accurate stats)
      prisma.production.findMany({
        select: {
          units: true, defects: true,
          employee: { select: { department: { select: { name: true } } } },
        },
        take: 300,
        orderBy: { productionDate: 'desc' },
      }),

      // Today's production
      prisma.production.aggregate({
        where: { productionDate: { gte: todayStart } },
        _sum: { units: true, defects: true },
        _count: true,
      }),

      // Latest production record
      prisma.production.findFirst({
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, units: true, defects: true, shift: true, productionDate: true,
          product:  { select: { name: true } },
          employee: { select: { name: true } },
        },
      }),

      // ALL employees — no cap, needed for CRUD verification
      prisma.employee.findMany({
        select: {
          id: true, employeeCode: true, name: true, experience: true,
          departmentId: true, roleId: true, status: true,
          department: { select: { name: true } },
          role:       { select: { title: true, level: true } },
        },
        where:   { isDeleted: false },
        orderBy: { employeeCode: 'asc' },
      }),

      // All departments
      prisma.department.findMany({
        select: { id: true, name: true, code: true },
        orderBy: { id: 'asc' },
      }),

      // All roles ordered entry → senior
      prisma.role.findMany({
        select: { id: true, title: true, level: true },
        orderBy: { level: 'desc' },   // level 1=top, so desc = entry first
      }),

      // All products
      prisma.product.findMany({
        select: { id: true, name: true, unitPrice: true, unitCost: true },
        orderBy: { name: 'asc' },
      }),

      // Total promotions ever
      prisma.promotionHistory.count(),

      // Recent 30 production records for CRUD identification
      prisma.production.findMany({
        take: 30,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, units: true, defects: true, shift: true, productionDate: true,
          product:  { select: { name: true } },
          employee: { select: { name: true, employeeCode: true } },
        },
      }),
    ]);

    const [empCount, deptCount, prodCount] = totalCounts;

    /* ── Product name / stats lookup maps ────────────────────────── */
    const productMap = Object.fromEntries(productRows.map(p => [p.id, p]));

    const productStats = productionByProduct.map(p => {
      const units   = p._sum.units   ?? 0;
      const defects = p._sum.defects ?? 0;
      const prod    = productMap[p.productId];
      return {
        product:    prod?.name ?? `#${p.productId}`,
        units, defects,
        revenue:    Math.round(p._sum.revenue ?? 0),
        profit:     Math.round(p._sum.profit  ?? 0),
        defectRate: units > 0 ? ((defects / units) * 100).toFixed(1) : '0',
      };
    }).sort((a, b) => parseFloat(b.defectRate) - parseFloat(a.defectRate));

    /* ── Department efficiency ───────────────────────────────────── */
    const deptMap = {};
    deptPerfRaw.forEach(r => {
      const name = r.employee?.department?.name;
      if (!name) return;
      if (!deptMap[name]) deptMap[name] = { units: 0, defects: 0 };
      deptMap[name].units   += r.units   ?? 0;
      deptMap[name].defects += r.defects ?? 0;
    });
    const deptStats = Object.entries(deptMap).map(([dept, v]) => ({
      department: dept,
      units:      v.units,
      defects:    v.defects,
      efficiency: v.units > 0 ? ((v.units - v.defects) / v.units * 100).toFixed(1) : '0',
      defectRate: v.units > 0 ? (v.defects / v.units * 100).toFixed(1) : '0',
    })).sort((a, b) => parseFloat(a.efficiency) - parseFloat(b.efficiency));

    /* ── Per-employee production map ─────────────────────────────── */
    const empProdMap = Object.fromEntries(
      empProdStats.map(e => [e.employeeId, { units: e._sum.units ?? 0, defects: e._sum.defects ?? 0 }])
    );

    /* ── Top 5 producers (from empProdStats + allEmployees — no extra query) */
    const empById = Object.fromEntries(allEmployees.map(e => [e.id, e]));
    const topProducers = [...empProdStats]
      .sort((a, b) => (b._sum.units ?? 0) - (a._sum.units ?? 0))
      .slice(0, 5)
      .map(e => {
        const emp  = empById[e.employeeId];
        const u    = e._sum.units   ?? 0;
        const d    = e._sum.defects ?? 0;
        return {
          code:       emp?.employeeCode ?? '?',
          name:       emp?.name        ?? `#${e.employeeId}`,
          department: emp?.department?.name ?? '—',
          units: u, defects: d,
          defectRate: u > 0 ? ((d / u) * 100).toFixed(1) : '0',
        };
      });

    /* ── Shift breakdown ─────────────────────────────────────────── */
    const shiftStats = productionByShift.map(s => ({
      shift:      s.shift,
      units:      s._sum.units   ?? 0,
      defects:    s._sum.defects ?? 0,
      records:    s._count.id,
      defectRate: (s._sum.units ?? 0) > 0
        ? (((s._sum.defects ?? 0) / (s._sum.units ?? 0)) * 100).toFixed(1)
        : '0',
    }));

    /* ── Status counts ───────────────────────────────────────────── */
    const statusMap = Object.fromEntries(statusCounts.map(s => [s.status, s._count.id]));

    /* ── Overall KPIs ────────────────────────────────────────────── */
    const totalUnits   = aggr._sum.units   ?? 0;
    const totalDefects = aggr._sum.defects ?? 0;
    const efficiency   = totalUnits > 0
      ? ((totalUnits - totalDefects) / totalUnits * 100).toFixed(1)
      : '0';

    const latestInfo = latestRecord
      ? `#${latestRecord.id} — ${latestRecord.product?.name ?? '?'}, ${latestRecord.units} units, ${latestRecord.defects} defects, ${latestRecord.shift} shift by ${latestRecord.employee?.name ?? 'unassigned'} on ${new Date(latestRecord.productionDate).toLocaleDateString('en-IN')}`
      : 'No records yet';

    /* ── Assemble metrics for prompt ─────────────────────────────── */
    const metrics = {
      // KPIs
      employeeCount:     empCount,
      activeEmployees:   statusMap['ACTIVE']     ?? 0,
      onLeaveEmployees:  statusMap['ON_LEAVE']    ?? 0,
      resignedEmployees: statusMap['RESIGNED']    ?? 0,
      terminatedEmployees: statusMap['TERMINATED'] ?? 0,
      departmentCount:   deptCount,
      productionRecords: prodCount,
      totalUnits, totalDefects, efficiency,
      totalRevenue: Math.round(aggr._sum.revenue ?? 0),
      totalProfit:  Math.round(aggr._sum.profit  ?? 0),
      promotionCount,

      // Today
      today: {
        units:   todayAggr._sum.units   ?? 0,
        defects: todayAggr._sum.defects ?? 0,
        records: todayAggr._count       ?? 0,
      },
      latestRecord: latestInfo,

      // Analytics breakdowns
      productStats,
      deptStats,
      shiftStats,
      topProducers,

      // Master data for CRUD (all employees, no cap)
      allEmployees: allEmployees.map(e => {
        const ps = empProdMap[e.id];
        return {
          id:      e.id,
          code:    e.employeeCode,
          name:    e.name,
          dept:    e.department?.name,
          deptId:  e.departmentId,
          role:    e.role?.title,
          level:   e.role?.level,
          roleId:  e.roleId,
          status:  e.status,
          exp:     e.experience,
          // production stats merged in
          units:   ps?.units   ?? 0,
          defects: ps?.defects ?? 0,
        };
      }),
      allDepts:  allDepts.map(d => ({ id: d.id, name: d.name, code: d.code })),
      allRoles:  allRoles.map(r => ({ id: r.id, title: r.title, level: r.level })),
      products:  productRows.map(p => ({ id: p.id, name: p.name })),

      // Recent production records for update/delete CRUD
      recentProduction: recentProdRaw.map(r => ({
        id:       r.id,
        product:  r.product?.name ?? '?',
        units:    r.units,
        defects:  r.defects,
        shift:    r.shift,
        date:     new Date(r.productionDate).toLocaleDateString('en-IN'),
        employee: r.employee ? `${r.employee.name}(${r.employee.employeeCode})` : '-',
      })),
    };

    /* ── Build messages ──────────────────────────────────────────── */
    const systemMsg    = chatSystemPrompt(metrics);
    const recentHistory = history.slice(-4).map(m => ({ role: m.role, content: m.content }));
    const messages = [
      { role: 'system', content: systemMsg },
      ...recentHistory,
      { role: 'user',   content: message.trim() },
    ];

    /* ── Groq streaming ──────────────────────────────────────────── */
    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ error: 'GROQ_API_KEY is not configured in .env' }, { status: 500 });
    }

    const MODELS = ['meta-llama/llama-4-scout-17b-16e-instruct', 'llama-3.3-70b-versatile', 'llama-3.1-8b-instant'];
    let stream, lastGroqErr;

    for (const model of MODELS) {
      try {
        stream = await groq.chat.completions.create({
          model,
          messages,
          temperature: 0.3,
          max_tokens:  400,
          stream:      true,
        });
        break;
      } catch (groqErr) {
        console.error(`GROQ MODEL ${model} ERROR:`, groqErr?.status, groqErr?.message);
        lastGroqErr = groqErr;
        if (groqErr?.status !== 404 && groqErr?.status !== 503) break;
      }
    }

    if (!stream) {
      const status = lastGroqErr?.status ?? lastGroqErr?.statusCode ?? 500;
      const detail = lastGroqErr?.error?.error?.message ?? lastGroqErr?.message ?? 'Groq API call failed';
      return NextResponse.json({ error: detail }, { status });
    }

    const encoder  = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content ?? '';
            if (text) controller.enqueue(encoder.encode(text));
          }
        } catch (streamErr) {
          console.error('STREAM ERROR:', streamErr);
          controller.enqueue(encoder.encode(`\n\n⚠ Stream interrupted: ${streamErr.message}`));
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
    const detail = err.error?.error?.message ?? err.message ?? 'AI chat unavailable';
    return NextResponse.json({ error: detail }, { status: err.status ?? 500 });
  }
}
