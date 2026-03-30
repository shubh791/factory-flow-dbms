import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

/* ── Field alias map — maps real manufacturing CSV columns to schema ─ */
const FIELD_ALIASES = {
  // Units produced
  units:          'units',
  production_qty: 'units',
  qty:            'units',
  quantity:       'units',
  produced_qty:   'units',
  good_units:     'units',
  output:         'units',

  // Defects
  defects:        'defects',
  defect_count:   'defects',
  defective_qty:  'defects',
  rejected_qty:   'defects',
  scrap:          'defects',
  rejects:        'defects',

  // Product name
  product:        'product',
  product_name:   'product',
  item:           'product',
  part_name:      'product',
  sku:            'product',
  part_no:        'product',

  // Employee / worker
  employeecode:   'employeeCode',
  employee_code:  'employeeCode',
  worker_id:      'employeeCode',
  employee_id:    'employeeCode',
  workerid:       'employeeCode',
  operator_id:    'employeeCode',

  // Shift
  shift:          'shift',
  work_shift:     'shift',

  // Production date / timestamp
  productiondate: 'productionDate',
  production_date:'productionDate',
  date:           'productionDate',
  timestamp:      'productionDate',
  created_at:     'productionDate',
  record_date:    'productionDate',

  // Financial (optional — direct pass-through)
  revenue:        'revenue',
  cost:           'cost',
  profit:         'profit',

  // Defect rate (alternative to defect count)
  defect_rate:    'defectRate',
  defect_pct:     'defectRate',
  defect_percent: 'defectRate',
  scrap_rate:     'defectRate',
};

/* ── Normalize a shift string → Prisma enum ─────────────────────── */
function normalizeShift(raw) {
  if (!raw) return 'MORNING';
  const s = String(raw).trim().toUpperCase();
  if (s === 'MORNING'  || s === 'A' || s === '1' || s === 'FIRST')  return 'MORNING';
  if (s === 'EVENING'  || s === 'B' || s === '2' || s === 'SECOND') return 'EVENING';
  if (s === 'NIGHT'    || s === 'C' || s === '3' || s === 'THIRD')  return 'NIGHT';
  return 'MORNING';
}

/* ── Parse CSV text → array of objects with normalised keys ─────── */
function parseCSV(text) {
  const lines = text.split('\n').filter((l) => l.trim() && !l.trim().startsWith('#'));
  if (lines.length < 2) return { headers: [], rows: [] };

  const rawHeaders = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/\s+/g, '_'));
  const headers    = rawHeaders.map((h) => FIELD_ALIASES[h] ?? h);

  const rows = lines.slice(1).map((line) => {
    const values = line.split(',').map((v) => v.trim().replace(/^["']|["']$/g, ''));
    const obj = {};
    rawHeaders.forEach((rawH, i) => {
      const mapped = FIELD_ALIASES[rawH] ?? rawH;
      obj[mapped] = values[i] ?? '';
    });
    return obj;
  });

  return { headers, rows };
}

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file     = formData.get('file');

    if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });

    const text = await file.text();
    const { rows } = parseCSV(text);

    if (!rows.length) {
      return NextResponse.json({ error: 'CSV is empty or has no data rows' }, { status: 400 });
    }

    /* ── Preload reference data ──────────────────────────────── */
    const [employees, products] = await Promise.all([
      prisma.employee.findMany({ select: { id: true, employeeCode: true } }),
      prisma.product.findMany({ select: { id: true, name: true, unitPrice: true, unitCost: true } }),
    ]);

    const employeeMap = Object.fromEntries(employees.map((e) => [e.employeeCode.toLowerCase(), e.id]));
    const productMap  = Object.fromEntries(products.map((p) => [p.name.toLowerCase(), p]));

    /* ── Process rows ────────────────────────────────────────── */
    const toInsert     = [];
    const skippedRows  = [];
    const createdProducts = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];

      try {
        /* --- Units --- */
        let units = Number(row.units) || 0;

        /* --- Defects: either direct count or rate-based --- */
        let defects;
        if (row.defects !== undefined && row.defects !== '') {
          defects = Number(row.defects) || 0;
        } else if (row.defectRate !== undefined && row.defectRate !== '') {
          const rate = parseFloat(row.defectRate);
          defects = Math.round((rate / 100) * units);
        } else {
          defects = 0;
        }

        if (units <= 0)       { skippedRows.push({ row: i + 2, reason: 'units = 0' }); continue; }
        if (defects > units)  { defects = units; } // clamp
        if (defects < 0)      { defects = 0; }

        /* --- Product --- */
        const productName = (row.product ?? '').trim();
        if (!productName) { skippedRows.push({ row: i + 2, reason: 'missing product name' }); continue; }

        let product = productMap[productName.toLowerCase()];
        if (!product) {
          product = await prisma.product.create({
            data: { name: productName, unitPrice: 20, unitCost: 10 },
          });
          productMap[productName.toLowerCase()] = product;
          createdProducts.push(productName);
        }

        /* --- Employee --- */
        const empCode = (row.employeeCode ?? '').trim().toLowerCase();
        if (!empCode) { skippedRows.push({ row: i + 2, reason: 'missing employee code' }); continue; }
        const employeeId = employeeMap[empCode];
        if (!employeeId) { skippedRows.push({ row: i + 2, reason: `employee not found: ${empCode}` }); continue; }

        /* --- Shift --- */
        const shift = normalizeShift(row.shift);

        /* --- Production date --- */
        let productionDate;
        if (row.productionDate) {
          const parsed = new Date(row.productionDate);
          productionDate = isNaN(parsed.getTime()) ? new Date() : parsed;
        } else {
          productionDate = new Date();
        }

        /* --- Financial fields --- */
        const goodUnits = units - defects;
        const revenue   = row.revenue   !== undefined && row.revenue   !== ''
          ? Number(row.revenue)
          : goodUnits * (product.unitPrice ?? 20);
        const cost      = row.cost      !== undefined && row.cost      !== ''
          ? Number(row.cost)
          : units * (product.unitCost ?? 10);
        const profit    = row.profit    !== undefined && row.profit    !== ''
          ? Number(row.profit)
          : revenue - cost;

        toInsert.push({
          units,
          defects,
          shift,
          productId: product.id,
          employeeId,
          productionDate,
          revenue,
          cost,
          profit,
        });
      } catch (err) {
        skippedRows.push({ row: i + 2, reason: err.message });
      }
    }

    /* ── Bulk insert ─────────────────────────────────────────── */
    const result = await prisma.production.createMany({ data: toInsert });

    return NextResponse.json({
      success:        true,
      recordsCreated: result.count,
      skipped:        skippedRows.length,
      totalRows:      rows.length,
      newProducts:    createdProducts,
      skippedDetails: skippedRows.slice(0, 10), // first 10 for display
    });
  } catch (error) {
    console.error('PRODUCTION CSV ERROR:', error);
    return NextResponse.json({ error: 'CSV processing failed' }, { status: 500 });
  }
}
