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
      model:       'llama-3.3-70b-versatile',
      messages:    [{ role: 'user', content: prompt }],
      temperature: 0.15,
      max_tokens:  600,
    });

    const raw = completion.choices[0]?.message?.content ?? '{}';

    /* ── Parse AI JSON; fall back to statistical detection if model returns code ── */
    const looksLikeCode = (s) => /def |import |print\(|python|\.append\(|enumerate\(|threshold/i.test(s);
    let result;

    try {
      const cleaned = raw.replace(/```[\s\S]*?```/g, '').trim();
      const parsed  = JSON.parse(cleaned);
      // If summary field leaked code, replace with a clean one
      if (parsed && typeof parsed.summary === 'string' && looksLikeCode(parsed.summary)) {
        delete parsed.summary;
      }
      result = parsed;
    } catch {
      // Model returned code — compute anomalies statistically ourselves
      const dailyMap = {};
      records.forEach((r) => {
        const d = new Date(r.productionDate).toISOString().slice(0, 10);
        if (!dailyMap[d]) dailyMap[d] = { units: 0, defects: 0 };
        dailyMap[d].units   += r.units   ?? 0;
        dailyMap[d].defects += r.defects ?? 0;
      });

      const buckets = Object.entries(dailyMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, v]) => ({ date, defectRate: v.units > 0 ? (v.defects / v.units) * 100 : 0, units: v.units }));

      const anomalies = buckets
        .filter(b => b.defectRate > avgRate + 2 * std || b.units < avgRate * 0.5)
        .map(b => ({
          date: b.date,
          type: b.defectRate > avgRate + 2 * std ? 'spike' : 'drop',
          severity: b.defectRate > avgRate + 3 * std ? 'high' : 'medium',
          detail: b.defectRate > avgRate + 2 * std
            ? `Defect rate ${b.defectRate.toFixed(1)}% exceeded threshold (avg ${avgRate.toFixed(1)}%)`
            : `Unit output dropped significantly on this date`,
        }));

      const riskLevel = anomalies.filter(a => a.severity === 'high').length > 2
        ? 'critical' : anomalies.length > 4 ? 'high' : anomalies.length > 1 ? 'medium' : 'low';

      const summaryText = anomalies.length > 0
        ? `Detected ${anomalies.length} anomalies over the last 60 days. Risk level is ${riskLevel}. Average defect rate is ${avgRate.toFixed(1)}% with ±${std.toFixed(1)}% deviation.`
        : `No significant anomalies detected. Average defect rate is ${avgRate.toFixed(1)}% — production quality is stable.`;

      result = { anomalies, riskLevel, summary: summaryText };
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
