import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { productionPredictionPrompt } from '@/lib/prompts';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function GET() {
  try {
    /* ── Fetch last 6 months of production ───────────────────── */
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const records = await prisma.production.findMany({
      where: { productionDate: { gte: sixMonthsAgo } },
      orderBy: { productionDate: 'asc' },
    });

    if (!records.length) {
      return NextResponse.json({ message: 'Insufficient data for prediction' });
    }

    /* ── Build monthly trend ─────────────────────────────────── */
    const monthly = {};
    let totalUnits = 0, totalDefects = 0;

    records.forEach((r) => {
      const d   = new Date(r.productionDate);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!monthly[key]) monthly[key] = { units: 0, defects: 0 };
      monthly[key].units   += r.units   ?? 0;
      monthly[key].defects += r.defects ?? 0;
      totalUnits   += r.units   ?? 0;
      totalDefects += r.defects ?? 0;
    });

    const monthlyTrend = Object.entries(monthly)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, v]) => ({ month, ...v }));

    const efficiency = totalUnits > 0
      ? ((totalUnits - totalDefects) / totalUnits) * 100
      : 0;

    /* ── Call Groq ───────────────────────────────────────────── */
    const prompt = productionPredictionPrompt(monthlyTrend, {
      totalUnits, totalDefects, efficiency,
    });

    const completion = await groq.chat.completions.create({
      model:       'llama-3.1-8b-instant',
      messages:    [{ role: 'user', content: prompt }],
      temperature: 0.2,
      max_tokens:  400,
    });

    const raw = completion.choices[0]?.message?.content ?? '{}';

    let prediction;
    try {
      const cleaned = raw.replace(/```json\n?|\n?```/g, '').trim();
      prediction = JSON.parse(cleaned);
    } catch {
      prediction = { reasoning: raw };
    }

    return NextResponse.json({
      prediction,
      monthlyTrend,
      dataPoints: records.length,
    });
  } catch (err) {
    console.error('PREDICT ERROR:', err);
    return NextResponse.json({ error: 'Prediction failed' }, { status: 500 });
  }
}
