import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function GET() {
  try {
    const dataset = await prisma.dataset.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    if (!dataset) return NextResponse.json({ message: 'No dataset found' });

    const rows = dataset.rows || [];

    let totalUnits = 0;
    let totalDefects = 0;
    const productMap = {};

    rows.forEach((r) => {
      const units = Number(r.units || r.Units || 0);
      const defects = Number(r.defects || r.Defects || 0);
      const product = r.product || r.Product || 'Unknown';

      totalUnits += units;
      totalDefects += defects;

      if (!productMap[product]) {
        productMap[product] = { units: 0, defects: 0 };
      }

      productMap[product].units += units;
      productMap[product].defects += defects;
    });

    const efficiency =
      totalUnits > 0
        ? ((totalUnits - totalDefects) / totalUnits) * 100
        : 0;

    const prompt = `
You are a senior industrial production analyst.

Here is REAL production data summary:

Total Units Produced: ${totalUnits}
Total Defective Units: ${totalDefects}
Overall Efficiency: ${efficiency.toFixed(2)}%

Production Breakdown by Product:
${JSON.stringify(productMap, null, 2)}

Generate a professional industrial report including:

1. Production performance analysis
2. Efficiency observations
3. Defect risk areas
4. Operational recommendations
5. Executive summary for management

Be specific to this data.
Avoid generic statements.
`;

    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
    });

    return NextResponse.json({
      insights: response.choices[0].message.content,
    });
  } catch (err) {
    console.error('AI ERROR:', err.response?.data || err);
    return NextResponse.json(
      { error: 'AI analysis failed' },
      { status: 500 }
    );
  }
}
