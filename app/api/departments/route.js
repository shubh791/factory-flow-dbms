import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const departments = await prisma.department.findMany();
    return NextResponse.json(departments);
  } catch (error) {
    return NextResponse.json({ error: 'Department creation failed' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const dept = await prisma.department.create({
      data: { name: body.name.trim() },
    });
    return NextResponse.json(dept);
  } catch (error) {
    return NextResponse.json({ error: 'Department creation failed' }, { status: 500 });
  }
}
