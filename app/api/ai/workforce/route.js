import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { workforceOptimizationPrompt } from '@/lib/prompts';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function GET() {
  try {
    /* ── Aggregate department-level stats ─────────────────────── */
    const records = await prisma.production.findMany({
      include: {
        employee: { include: { department: true } },
      },
    });

    const empCount = await prisma.employee.count();

    if (!records.length) {
      return NextResponse.json({ message: 'No production data for workforce analysis' });
    }

    const deptMap = {};
    records.forEach((r) => {
      const dept = r.employee?.department?.name ?? 'Unknown';
      if (!deptMap[dept]) deptMap[dept] = { units: 0, defects: 0, employees: new Set() };
      deptMap[dept].units   += r.units   ?? 0;
      deptMap[dept].defects += r.defects ?? 0;
      if (r.employee?.id) deptMap[dept].employees.add(r.employee.id);
    });

    const deptStats = Object.entries(deptMap).map(([name, d]) => ({
      name,
      totalUnits:   d.units,
      totalDefects: d.defects,
      efficiency:   d.units > 0 ? Number(((d.units - d.defects) / d.units * 100).toFixed(1)) : 0,
      headcount:    d.employees.size,
      unitsPerHead: d.employees.size > 0 ? Math.round(d.units / d.employees.size) : 0,
    }));

    /* ── Call Groq ─────────────────────────────────────────────── */
    const prompt = workforceOptimizationPrompt(deptStats, empCount);

    const completion = await groq.chat.completions.create({
      model:       'llama-3.1-8b-instant',
      messages:    [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens:  500,
    });

    const raw = completion.choices[0]?.message?.content ?? '{}';
    let result;
    try {
      const cleaned = raw.replace(/```json\n?|\n?```/g, '').trim();
      result = JSON.parse(cleaned);
    } catch {
      result = { recommendations: [raw] };
    }

    return NextResponse.json({ ...result, deptStats });
  } catch (err) {
    console.error('WORKFORCE AI ERROR:', err);
    return NextResponse.json({ error: 'Workforce analysis failed' }, { status: 500 });
  }
}
