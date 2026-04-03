import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { systemSummaryPrompt } from '@/lib/prompts';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function GET() {
  try {
    /* ── Aggregate DB metrics ─────────────────────────────────── */
    const [employeeCount, departmentCount, productionCount, defectAgg, unitAgg] =
      await Promise.all([
        prisma.employee.count(),
        prisma.department.count(),
        prisma.production.count(),
        prisma.production.aggregate({ _sum: { defects: true } }),
        prisma.production.aggregate({ _sum: { units: true } }),
      ]);

    const totalUnits   = unitAgg._sum.units   ?? 0;
    const totalDefects = defectAgg._sum.defects ?? 0;
    const efficiency   = totalUnits > 0
      ? Number(((totalUnits - totalDefects) / totalUnits * 100).toFixed(2))
      : 0;

    const metrics = {
      employeeCount,
      departmentCount,
      productionRecords: productionCount,
      totalUnits,
      totalDefects,
      efficiency,
    };

    /* ── Ask Groq for structured analysis ─────────────────────── */
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 500,
      messages: [
        {
          role:    'system',
          content: 'You are an industrial performance analyst. Return ONLY valid JSON with no markdown or explanation.',
        },
        {
          role:    'user',
          content: systemSummaryPrompt(metrics),
        },
      ],
      temperature: 0.3,
      max_tokens:  700,
    });

    const raw = completion.choices[0]?.message?.content ?? '{}';

    /* ── Parse — strip markdown code fences if model adds them ── */
    let analysis;
    try {
      const cleaned = raw.replace(/```json\n?|\n?```/g, '').trim();
      analysis = JSON.parse(cleaned);
    } catch {
      // Fallback: return raw text (system-summary page handles both)
      analysis = raw;
    }

    return NextResponse.json({ metrics, analysis });
  } catch (error) {
    console.error('SYSTEM SUMMARY ERROR:', error);
    return NextResponse.json(
      { error: 'System summary generation failed' },
      { status: 500 }
    );
  }
}
