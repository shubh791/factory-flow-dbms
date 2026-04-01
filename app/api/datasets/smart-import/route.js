import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

/* ── Column name → DB field mapping ─────────────────────────────────── */
const EMPLOYEE_MAP = {
  name:         ['name', 'employee name', 'full name', 'fullname', 'emp name', 'worker name', 'staff name'],
  employeeCode: ['code', 'emp code', 'employee code', 'employee id', 'emp id', 'staff code', 'id', 'employee_code', 'emp_id'],
  email:        ['email', 'email address', 'mail', 'e-mail', 'email_address'],
  phone:        ['phone', 'mobile', 'contact', 'phone number', 'mobile number', 'contact number', 'telephone', 'tel'],
  experience:   ['experience', 'exp', 'years', 'years of experience', 'work experience', 'exp years', 'experience_years'],
  department:   ['department', 'dept', 'division', 'team', 'section', 'department name'],
  role:         ['role', 'designation', 'position', 'title', 'job title', 'post', 'rank'],
  status:       ['status', 'employment status', 'emp status', 'active', 'state'],
};

const PRODUCTION_MAP = {
  product:      ['product', 'product name', 'item', 'item name', 'goods', 'material', 'product_name'],
  units:        ['units', 'quantity', 'qty', 'produced', 'output', 'units produced', 'production', 'count'],
  defects:      ['defects', 'defective', 'rejected', 'faulty', 'defect count', 'bad units', 'waste', 'defect'],
  shift:        ['shift', 'work shift', 'time slot', 'shift type'],
  employee:     ['employee', 'worker', 'operator', 'staff', 'emp', 'employee name', 'done by'],
  date:         ['date', 'production date', 'created at', 'timestamp', 'day', 'record date', 'work date'],
};

function detectType(headers) {
  const h = headers.map(x => x.toLowerCase().trim());
  let empScore = 0, prodScore = 0;
  for (const col of h) {
    for (const variants of Object.values(EMPLOYEE_MAP)) {
      if (variants.some(v => col.includes(v) || v.includes(col))) { empScore++; break; }
    }
    for (const variants of Object.values(PRODUCTION_MAP)) {
      if (variants.some(v => col.includes(v) || v.includes(col))) { prodScore++; break; }
    }
  }
  return empScore >= prodScore ? 'employee' : 'production';
}

function mapColumns(headers, mapDef) {
  const result = {};
  const lHeaders = headers.map((h, i) => ({ original: h, lower: h.toLowerCase().trim(), idx: i }));
  for (const [field, variants] of Object.entries(mapDef)) {
    const found = lHeaders.find(h => variants.some(v => h.lower.includes(v) || v.includes(h.lower)));
    result[field] = found ? found.original : null;
  }
  return result;
}

/* ── Parse CSV text ────────────────────────────────────────────────── */
function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) throw new Error('CSV must have at least a header row and one data row');

  function parseLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      if (line[i] === '"') { inQuotes = !inQuotes; }
      else if (line[i] === ',' && !inQuotes) { result.push(current.trim()); current = ''; }
      else { current += line[i]; }
    }
    result.push(current.trim());
    return result;
  }

  const headers = parseLine(lines[0]);
  const rows = lines.slice(1).filter(l => l.trim()).map(l => {
    const vals = parseLine(l);
    const obj = {};
    headers.forEach((h, i) => { obj[h] = vals[i] ?? ''; });
    return obj;
  });
  return { headers, rows };
}

/* ── POST: analyze CSV ─────────────────────────────────────────────── */
export async function POST(request) {
  try {
    const body = await request.json();
    const { csvText, importType } = body;
    if (!csvText) return NextResponse.json({ error: 'csvText required' }, { status: 400 });

    const { headers, rows } = parseCSV(csvText);
    const detectedType = importType || detectType(headers);
    const mapDef = detectedType === 'employee' ? EMPLOYEE_MAP : PRODUCTION_MAP;
    const columnMapping = mapColumns(headers, mapDef);

    // Preview first 5 rows
    const preview = rows.slice(0, 5).map(row => {
      const mapped = {};
      for (const [field, col] of Object.entries(columnMapping)) {
        if (col) mapped[field] = row[col];
      }
      return { original: row, mapped };
    });

    // Load departments and roles for employee import
    let meta = {};
    if (detectedType === 'employee') {
      const [depts, roles] = await Promise.all([
        prisma.department.findMany({ select: { id: true, name: true } }),
        prisma.role.findMany({ select: { id: true, title: true, level: true }, orderBy: { level: 'asc' } }),
      ]);
      meta = { departments: depts, roles };
    } else {
      const products = await prisma.product.findMany({ select: { id: true, name: true } });
      meta = { products };
    }

    return NextResponse.json({
      detectedType,
      headers,
      totalRows: rows.length,
      columnMapping,
      preview,
      meta,
    });
  } catch (err) {
    console.error('Smart import analyze error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/* ── PUT: execute import ────────────────────────────────────────────── */
export async function PUT(request) {
  try {
    const body = await request.json();
    const { csvText, importType, columnMapping, defaultDeptId, defaultRoleId, defaultProductId } = body;
    if (!csvText || !importType || !columnMapping) {
      return NextResponse.json({ error: 'csvText, importType, and columnMapping required' }, { status: 400 });
    }

    const { rows } = parseCSV(csvText);
    let imported = 0, skipped = 0, errors = [];

    if (importType === 'employee') {
      // Cache dept/role lookups
      const [depts, roles] = await Promise.all([
        prisma.department.findMany(),
        prisma.role.findMany({ orderBy: { level: 'asc' } }),
      ]);
      const deptByName = Object.fromEntries(depts.map(d => [d.name.toLowerCase(), d]));
      const roleByTitle = Object.fromEntries(roles.map(r => [r.title.toLowerCase(), r]));
      const defaultDept = depts.find(d => d.id === Number(defaultDeptId)) || depts[0];
      const defaultRole = roles.find(r => r.id === Number(defaultRoleId)) || roles[0];

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        try {
          const get = (field) => columnMapping[field] ? row[columnMapping[field]]?.trim() || null : null;
          const name = get('name');
          if (!name) { skipped++; continue; }

          const code = get('employeeCode') || `IMP${Date.now().toString().slice(-4)}${i}`;
          const deptName = get('department')?.toLowerCase();
          const roleName = get('role')?.toLowerCase();
          const dept = (deptName && deptByName[deptName]) || defaultDept;
          const role = (roleName && roleByTitle[roleName]) || defaultRole;
          if (!dept || !role) { errors.push(`Row ${i+2}: no dept/role found`); skipped++; continue; }

          const statusRaw = get('status')?.toUpperCase();
          const validStatuses = ['ACTIVE','ON_LEAVE','RESIGNED','TERMINATED'];
          const status = validStatuses.includes(statusRaw) ? statusRaw : 'ACTIVE';

          await prisma.employee.upsert({
            where: { employeeCode: code },
            update: { name, email: get('email'), phone: get('phone'), experience: Number(get('experience') || 0), departmentId: dept.id, roleId: role.id, status },
            create: { name, employeeCode: code, email: get('email'), phone: get('phone'), experience: Number(get('experience') || 0), departmentId: dept.id, roleId: role.id, status },
          });
          imported++;
        } catch (e) {
          errors.push(`Row ${i+2}: ${e.message}`);
          skipped++;
        }
      }
    } else {
      // Production import
      const products = await prisma.product.findMany();
      const productByName = Object.fromEntries(products.map(p => [p.name.toLowerCase(), p]));
      const defaultProduct = products.find(p => p.id === Number(defaultProductId)) || products[0];
      const shifts = ['MORNING','EVENING','NIGHT'];

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        try {
          const get = (field) => columnMapping[field] ? row[columnMapping[field]]?.trim() || null : null;
          const productName = get('product')?.toLowerCase();
          const product = (productName && productByName[productName]) || defaultProduct;
          if (!product) { errors.push(`Row ${i+2}: no product found`); skipped++; continue; }

          const units = Number(get('units') || 0);
          if (units <= 0) { skipped++; continue; }

          const shiftRaw = get('shift')?.toUpperCase();
          const shift = shifts.includes(shiftRaw) ? shiftRaw : 'MORNING';
          const defects = Number(get('defects') || 0);

          let empId = null;
          const empVal = get('employee');
          if (empVal) {
            const emp = await prisma.employee.findFirst({ where: { OR: [ { name: { contains: empVal, mode: 'insensitive' } }, { employeeCode: { equals: empVal, mode: 'insensitive' } } ] } });
            empId = emp?.id ?? null;
          }

          const dateRaw = get('date');
          const prodDate = dateRaw ? new Date(dateRaw) : new Date();
          const validDate = isNaN(prodDate.getTime()) ? new Date() : prodDate;

          const revenue = units * (product.unitPrice || 0);
          const cost    = units * (product.unitCost  || 0);

          await prisma.production.create({
            data: { units, defects, shift, productId: product.id, employeeId: empId, productionDate: validDate, revenue, cost, profit: revenue - cost },
          });
          imported++;
        } catch (e) {
          errors.push(`Row ${i+2}: ${e.message}`);
          skipped++;
        }
      }
    }

    return NextResponse.json({ success: true, imported, skipped, errors: errors.slice(0, 10), message: `Imported ${imported} records. Skipped ${skipped}.` });
  } catch (err) {
    console.error('Smart import execute error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
