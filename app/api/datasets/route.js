import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const datasets = await prisma.dataset.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(datasets);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch datasets' }, { status: 500 });
  }
}
