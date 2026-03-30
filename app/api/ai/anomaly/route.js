import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { anomalyDetectionPrompt } from '@/lib/prompts';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function GET() {
  try {
    /* ── Fetch last 60 days of production ─────────────────────── */
    const since = new Date();
    since.setDate(since.getDate() - 60);

    const records = await prisma.production.findMany({
      where: { productionDate: { gte: since } },
      select: {
        units:         true,
        defects:       true,
        productionDate: true,
        product:       { select: { name: true } },
      },
      orderBy: { productionDate: 'asc' },
    });

    if (!records.length) {
      return NextResponse.json({
        anomalies: [],
        riskLevel: 'low',
        summary:   'No production records in the last 60 days.',
      });
    }

    /* ── Also compute statistical baseline ───────────────────── */
    const defectRates = records
      .filter((r) => r.units > 0)
      .map((r) => (r.defects / r.units) * 100);

    const avgRate = defectRates.reduce((s, v) => s + v, 0) / defectRates.length;
    const std     = Math.sqrt(
      defectRates.reduce((s, v) => s + (v - avgRate) ** 2, 0) / defectRates.length
    );

    /* ── Call Groq ───────────────────────────────────────────── */
    const prompt = anomalyDetectionPrompt(records);

    const completion = await groq.chat.completions.create({
      model:       'llama-3.1-8b-instant',
      messages:    [{ role: 'user', content: prompt }],
      temperature: 0.15,
      max_tokens:  600,
    });

    const raw = completion.choices[0]?.message?.content ?? '{}';

    let result;
    try {
      const cleaned = raw.replace(/```json\n?|\n?```/g, '').trim();
      result = JSON.parse(cleaned);
    } catch {
      result = { anomalies: [], riskLevel: 'unknown', summary: raw };
    }

    return NextResponse.json({
      ...result,
      baseline: {
        avgDefectRate: Number(avgRate.toFixed(2)),
        stdDeviation:  Number(std.toFixed(2)),
        recordsAnalysed: records.length,
      },
    });
  } catch (err) {
    console.error('ANOMALY ERROR:', err);
    return NextResponse.json({ error: 'Anomaly detection failed' }, { status: 500 });
  }
}
