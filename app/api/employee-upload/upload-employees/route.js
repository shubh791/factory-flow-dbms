import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

/* ── Field alias map ─────────────────────────────────────────────── */
const FIELD_ALIASES = {
  // Name
  name:            'name',
  full_name:       'name',
  employee_name:   'name',
  worker_name:     'name',

  // Employee code
  employeecode:    'employeeCode',
  employee_code:   'employeeCode',
  emp_code:        'employeeCode',
  emp_id:          'employeeCode',
  employee_id:     'employeeCode',
  worker_id:       'employeeCode',
  badge_no:        'employeeCode',
  badge_number:    'employeeCode',

  // Experience
  experience:      'experience',
  years:           'experience',
  exp:             'experience',
  tenure:          'experience',
  years_of_service:'experience',
  experience_years:'experience',

  // Department
  department:      'department',
  dept:            'department',
  department_name: 'department',
  division:        'department',
  departmentid:    'departmentId',
  department_id:   'departmentId',

  // Role
  role:            'role',
  designation:     'role',
  position:        'role',
  job_title:       'role',
  title:           'role',
  roleid:          'roleId',
  role_id:         'roleId',
};

/* ── Parse CSV ───────────────────────────────────────────────────── */
function parseCSV(text) {
  const lines = text.split('\n').filter((l) => l.trim() && !l.trim().startsWith('#'));
  if (lines.length < 2) return [];

  const rawHeaders = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/\s+/g, '_'));

  return lines.slice(1).map((line) => {
    const values = line.split(',').map((v) => v.trim().replace(/^["']|["']$/g, ''));
    const obj = {};
    rawHeaders.forEach((rawH, i) => {
      const mapped = FIELD_ALIASES[rawH] ?? rawH;
      obj[mapped] = values[i] ?? '';
    });
    return obj;
  });
}

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file     = formData.get('file');
    if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });

    const text = await file.text();
    const rows = parseCSV(text);
    if (!rows.length) return NextResponse.json({ error: 'CSV is empty or has no data rows' }, { status: 400 });

    /* ── Preload reference data ──────────────────────────────── */
    const [departments, roles, existingEmployees] = await Promise.all([
      prisma.department.findMany(),
      prisma.role.findMany({ orderBy: { level: 'asc' } }),
      prisma.employee.findMany({ select: { employeeCode: true } }),
    ]);

    const deptMap     = Object.fromEntries(departments.map((d) => [d.name.toLowerCase(), d.id]));
    const roleMap     = Object.fromEntries(roles.map((r) => [r.title.toLowerCase(), r.id]));
    const existingSet = new Set(existingEmployees.map((e) => e.employeeCode));
    const defaultRole = roles[roles.length - 1]?.id; // lowest rank = last (highest level number)

    /* ── Generate sequential codes ───────────────────────────── */
    const lastEmp  = await prisma.employee.findFirst({ orderBy: { id: 'desc' } });
    let nextNumber = lastEmp ? lastEmp.id + 1 : 1;

    const toInsert    = [];
    const skipped     = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];

      try {
        /* --- Name --- */
        const name = (row.name ?? '').trim();
        if (!name) { skipped.push({ row: i + 2, reason: 'missing name' }); continue; }

        /* --- Employee code --- */
        let employeeCode = (row.employeeCode ?? '').trim();
        if (!employeeCode) {
          employeeCode = `E${500 + nextNumber}`;
          nextNumber++;
        }
        if (existingSet.has(employeeCode)) {
          skipped.push({ row: i + 2, reason: `duplicate code: ${employeeCode}` });
          continue;
        }
        existingSet.add(employeeCode); // prevent duplicates within same upload

        /* --- Department --- */
        let departmentId = row.departmentId ? Number(row.departmentId) : null;
        if (!departmentId && row.department) {
          departmentId = deptMap[row.department.trim().toLowerCase()];
        }
        if (!departmentId) {
          skipped.push({ row: i + 2, reason: `department not found: "${row.department}"` });
          continue;
        }

        /* --- Role --- */
        let roleId = row.roleId ? Number(row.roleId) : null;
        if (!roleId && row.role) {
          roleId = roleMap[row.role.trim().toLowerCase()];
        }
        if (!roleId) roleId = defaultRole;

        /* --- Experience --- */
        const experience = Number(row.experience) || 0;

        toInsert.push({ employeeCode, name, experience, departmentId, roleId });
      } catch (err) {
        skipped.push({ row: i + 2, reason: err.message });
      }
    }

    /* ── Bulk insert ─────────────────────────────────────────── */
    const result = await prisma.employee.createMany({
      data:           toInsert,
      skipDuplicates: true,
    });

    return NextResponse.json({
      success:        true,
      inserted:       result.count,
      skipped:        skipped.length,
      totalRows:      rows.length,
      skippedDetails: skipped.slice(0, 10),
    });
  } catch (err) {
    console.error('EMPLOYEE CSV ERROR:', err);
    return NextResponse.json({ error: 'Employee CSV upload failed' }, { status: 500 });
  }
}
