import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const roles = await prisma.role.findMany({
      orderBy: { level: 'asc' },
    });
    return NextResponse.json(roles);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch roles' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { title, level } = body;
    const role = await prisma.role.create({
      data: { title, level: Number(level) },
    });
    return NextResponse.json(role);
  } catch (error) {
    return NextResponse.json({ error: 'Role creation failed' }, { status: 500 });
  }
}
