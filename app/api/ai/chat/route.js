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

    /* ── Quick context snapshot from DB ─────────────────────── */
    const [empCount, deptCount, prodCount, aggr] = await Promise.all([
      prisma.employee.count(),
      prisma.department.count(),
      prisma.production.count(),
      prisma.production.aggregate({ _sum: { units: true, defects: true } }),
    ]);

    const totalUnits   = aggr._sum.units   ?? 0;
    const totalDefects = aggr._sum.defects ?? 0;
    const efficiency   = totalUnits > 0
      ? ((totalUnits - totalDefects) / totalUnits * 100).toFixed(1)
      : '0';

    const metrics = {
      employeeCount:    empCount,
      departmentCount:  deptCount,
      productionRecords: prodCount,
      totalUnits,
      totalDefects,
      efficiency,
    };

    /* ── Build message array ─────────────────────────────────── */
    const systemMsg = chatSystemPrompt(metrics);

    // Keep last 6 turns for context window efficiency
    const recentHistory = history.slice(-12).map((m) => ({
      role:    m.role,
      content: m.content,
    }));

    const messages = [
      { role: 'system',  content: systemMsg },
      ...recentHistory,
      { role: 'user',    content: message.trim() },
    ];

    /* ── Streaming response ──────────────────────────────────── */
    const stream = await groq.chat.completions.create({
      model:       'llama-3.1-8b-instant',
      messages,
      temperature: 0.4,
      max_tokens:  800,
      stream:      true,
    });

    const encoder = new TextEncoder();
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
        'Content-Type':  'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (err) {
    console.error('CHAT ERROR:', err);
    return NextResponse.json({ error: 'AI chat unavailable' }, { status: 500 });
  }
}
