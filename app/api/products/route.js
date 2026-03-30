import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const products = await prisma.product.findMany({
      orderBy: { id: 'asc' },
    });
    return NextResponse.json(products);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const product = await prisma.product.create({
      data: { name: body.name.trim() },
    });
    return NextResponse.json(product);
  } catch (error) {
    return NextResponse.json({ error: 'Product creation failed' }, { status: 500 });
  }
}
