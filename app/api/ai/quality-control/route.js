import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function GET() {
  try {
    /* ── Detailed defect pattern analysis ────────────────────────── */
    const last60Days = new Date();
    last60Days.setDate(last60Days.getDate() - 60);

    const records = await prisma.production.findMany({
      where: { productionDate: { gte: last60Days } },
      include: {
        product: { select: { name: true } },
        employee: {
          select: {
            name: true,
            department: { select: { name: true } },
          },
        },
      },
      orderBy: { productionDate: 'desc' },
    });

    if (!records.length) {
      return NextResponse.json({
        defectPatterns: [],
        qualityScore: 0,
        recommendations: ['Insufficient data'],
      });
    }

    /* ── Analyze defects by multiple dimensions ──────────────────── */
    const byProduct = {};
    const byShift = {};
    const byDepartment = {};
    const byDate = {};

    records.forEach(r => {
      const defectRate = r.units > 0 ? (r.defects / r.units) * 100 : 0;
      
      // By product
      if (!byProduct[r.product.name]) byProduct[r.product.name] = { units: 0, defects: 0 };
      byProduct[r.product.name].units += r.units;
      byProduct[r.product.name].defects += r.defects;

      // By shift
      if (!byShift[r.shift]) byShift[r.shift] = { units: 0, defects: 0 };
      byShift[r.shift].units += r.units;
      byShift[r.shift].defects += r.defects;

      // By department
      if (r.employee?.department?.name) {
        const deptName = r.employee.department.name;
        if (!byDepartment[deptName]) byDepartment[deptName] = { units: 0, defects: 0 };
        byDepartment[deptName].units += r.units;
        byDepartment[deptName].defects += r.defects;
      }

      // By date (weekly)
      const week = Math.floor((new Date() - new Date(r.productionDate)) / (7 * 24 * 60 * 60 * 1000));
      if (!byDate[`Week-${week}`]) byDate[`Week-${week}`] = { units: 0, defects: 0 };
      byDate[`Week-${week}`].units += r.units;
      byDate[`Week-${week}`].defects += r.defects;
    });

    // Calculate defect rates
    const productDefectRates = Object.entries(byProduct).map(([name, data]) => ({
      product: name,
      defectRate: data.units > 0 ? ((data.defects / data.units) * 100).toFixed(2) : '0',
      totalDefects: data.defects,
    }));

    const shiftDefectRates = Object.entries(byShift).map(([shift, data]) => ({
      shift,
      defectRate: data.units > 0 ? ((data.defects / data.units) * 100).toFixed(2) : '0',
    }));

    const totalUnits = records.reduce((s, r) => s + r.units, 0);
    const totalDefects = records.reduce((s, r) => s + r.defects, 0);
    const overallDefectRate = totalUnits > 0 ? ((totalDefects / totalUnits) * 100).toFixed(2) : '0';
    const qualityScore = Math.max(0, 100 - parseFloat(overallDefectRate) * 10).toFixed(1);

    const prompt = `You are a quality control AI specialist analyzing defect patterns.

Defect Analysis:
- Overall defect rate: ${overallDefectRate}%
- Quality score: ${qualityScore}/100
- By product: ${JSON.stringify(productDefectRates)}
- By shift: ${JSON.stringify(shiftDefectRates)}
- By department: ${JSON.stringify(byDepartment)}
- Weekly trends: ${JSON.stringify(byDate)}

Provide:
1. **defectPatterns**: Array of identified patterns (category, severity, trend, rootCause)
2. **priorityActions**: Immediate quality improvements needed
3. **longTermStrategy**: Systematic quality enhancement plan
4. **targetMetrics**: Achievable quality targets for next 30/60/90 days

Respond with valid JSON only.`;

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      max_tokens: 900,
    });

    const raw = completion.choices[0]?.message?.content ?? '{}';
    let result;
    try {
      const cleaned = raw.replace(/```json\n?|\n?```/g, '').trim();
      result = JSON.parse(cleaned);
    } catch {
      result = { defectPatterns: [], message: raw };
    }

    return NextResponse.json({
      ...result,
      currentMetrics: {
        qualityScore: Number(qualityScore),
        overallDefectRate: Number(overallDefectRate),
        totalRecordsAnalyzed: records.length,
        timeRange: '60 days',
      },
      detailedBreakdown: {
        byProduct: productDefectRates,
        byShift: shiftDefectRates,
      },
    });
  } catch (err) {
    console.error('QUALITY CONTROL ERROR:', err);
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 });
  }
}
