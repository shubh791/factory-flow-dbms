import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function GET() {
  try {
    /* ── Fetch production data with defect patterns ──────────────── */
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);

    const records = await prisma.production.findMany({
      where: { productionDate: { gte: last30Days } },
      include: {
        product: { select: { name: true } },
        employee: { select: { name: true, department: { select: { name: true } } } },
      },
      orderBy: { productionDate: 'desc' },
      take: 200,
    });

    if (!records.length) {
      return NextResponse.json({
        maintenanceAlerts: [],
        recommendations: ['Insufficient data for analysis'],
      });
    }

    /* ── Calculate key metrics ─────────────────────────────────── */
    const defectRates = records
      .filter(r => r.units > 0)
      .map(r => ({
        date: r.productionDate,
        rate: (r.defects / r.units) * 100,
        product: r.product.name,
        shift: r.shift,
      }));

    const avgDefectRate = defectRates.reduce((s, r) => s + r.rate, 0) / defectRates.length;
    
    // Group by product to identify problem areas
    const productDefects = {};
    records.forEach(r => {
      if (!productDefects[r.product.name]) {
        productDefects[r.product.name] = { totalUnits: 0, totalDefects: 0 };
      }
      productDefects[r.product.name].totalUnits += r.units;
      productDefects[r.product.name].totalDefects += r.defects;
    });

    const prompt = `You are an industrial maintenance AI advisor analyzing production data.

Data Summary:
- Total records analyzed: ${records.length}
- Average defect rate: ${avgDefectRate.toFixed(2)}%
- Products with issues: ${JSON.stringify(productDefects)}
- Recent defect trends: ${JSON.stringify(defectRates.slice(0, 10))}

Analyze this data and provide:
1. **maintenanceAlerts**: Array of urgent maintenance issues (priority: HIGH/MEDIUM/LOW, machine/area, issue, estimatedImpact)
2. **recommendations**: Array of preventive actions
3. **predictedFailures**: Equipment likely to fail in next 7-30 days
4. **costSavings**: Estimated cost savings from preventive maintenance

Respond with valid JSON only.`;

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      max_tokens: 800,
    });

    const raw = completion.choices[0]?.message?.content ?? '{}';
    let result;
    try {
      const cleaned = raw.replace(/```json\n?|\n?```/g, '').trim();
      result = JSON.parse(cleaned);
    } catch {
      result = { maintenanceAlerts: [], recommendations: [raw] };
    }

    return NextResponse.json({
      ...result,
      dataAnalyzed: {
        recordCount: records.length,
        avgDefectRate: Number(avgDefectRate.toFixed(2)),
        timeRange: '30 days',
      },
    });
  } catch (err) {
    console.error('PREDICTIVE MAINTENANCE ERROR:', err);
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 });
  }
}
