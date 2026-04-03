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

/* ── Scoring helpers ─────────────────────────────────────────────────── */
function scoreHeader(header, variants) {
  const h = header.toLowerCase().trim();
  for (const v of variants) {
    if (h === v) return 100;
    if (h.includes(v) || v.includes(h)) return 80;
    const overlap = [...h].filter(c => v.includes(c)).length;
    const score = Math.round((overlap / Math.max(h.length, v.length)) * 100);
    if (score > 60) return score;
  }
  return 0;
}

function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => i === 0 ? j : j === 0 ? i : 0)
  );
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
  return dp[m][n];
}

function fuzzyMatch(value, candidates) {
  const v = value.toLowerCase().trim();
  let best = null, bestScore = 0;
  for (const c of candidates) {
    const names = [
      c.name?.toLowerCase(),
      c.code?.toLowerCase(),
      c.employeeCode?.toLowerCase(),
      c.title?.toLowerCase(),
    ].filter(Boolean);
    for (const name of names) {
      if (v === name) return { ...c, score: 100, matchType: 'exact' };
      if (name.includes(v) || v.includes(name)) {
        if (80 > bestScore) { bestScore = 80; best = c; }
      }
      const maxLen = Math.max(v.length, name.length);
      if (maxLen === 0) continue;
      const dist = levenshtein(v, name);
      const score = Math.round((1 - dist / maxLen) * 100);
      if (score > bestScore) { bestScore = score; best = c; }
    }
  }
  if (!best || bestScore < 50) return null;
  return {
    ...best,
    score: bestScore,
    matchType: bestScore >= 99 ? 'exact' : bestScore >= 75 ? 'fuzzy' : 'weak',
  };
}

/* ── Greedy column assignment ────────────────────────────────────────── */
function scoreAndAssignColumns(headers, mapDef) {
  // Build all (field, header, score) triples
  const candidates = [];
  for (const [field, variants] of Object.entries(mapDef)) {
    for (const header of headers) {
      const score = scoreHeader(header, variants);
      if (score > 0) candidates.push({ field, header, score });
    }
  }
  // Sort descending by score
  candidates.sort((a, b) => b.score - a.score);

  const assignedFields = new Set();
  const assignedHeaders = new Set();
  const result = {}; // field → { csvCol, headerScore, confidence }

  for (const { field, header, score } of candidates) {
    if (assignedFields.has(field) || assignedHeaders.has(header)) continue;
    assignedFields.add(field);
    assignedHeaders.add(header);
    const confidence = score >= 90 ? 'exact' : score >= 65 ? 'fuzzy' : 'unknown';
    result[field] = { csvCol: header, headerScore: score, confidence };
  }

  // Fill in unmapped fields
  for (const field of Object.keys(mapDef)) {
    if (!result[field]) {
      result[field] = { csvCol: null, headerScore: 0, confidence: 'unmapped' };
    }
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

    // Score against both maps to detect type
    let prodTotal = 0, empTotal = 0;
    for (const header of headers) {
      const ps = Math.max(...Object.values(PRODUCTION_MAP).map(v => scoreHeader(header, v)), 0);
      const es = Math.max(...Object.values(EMPLOYEE_MAP).map(v => scoreHeader(header, v)), 0);
      prodTotal += ps;
      empTotal += es;
    }

    let detectedType;
    let detectionScore;
    if (importType && importType !== 'auto') {
      detectedType = importType;
      detectionScore = importType === 'production'
        ? Math.round((prodTotal / Math.max(prodTotal + empTotal, 1)) * 100)
        : Math.round((empTotal / Math.max(prodTotal + empTotal, 1)) * 100);
    } else {
      detectedType = prodTotal >= empTotal ? 'production' : 'employee';
      const total = prodTotal + empTotal;
      detectionScore = total === 0 ? 50 : Math.round((Math.max(prodTotal, empTotal) / total) * 100);
    }

    const mapDef = detectedType === 'employee' ? EMPLOYEE_MAP : PRODUCTION_MAP;
    const columnMapping = scoreAndAssignColumns(headers, mapDef);

    // Build a simple csvCol map for preview
    const simpleCsvColMap = {};
    for (const [field, info] of Object.entries(columnMapping)) {
      simpleCsvColMap[field] = info.csvCol;
    }

    // Preview first 5 rows
    const preview = rows.slice(0, 5).map(row => {
      const mapped = {};
      for (const [field, info] of Object.entries(columnMapping)) {
        if (info.csvCol) mapped[field] = row[info.csvCol];
      }
      return { original: row, mapped };
    });

    // Collect unique values for linked fields (max 50 each)
    const linkedFields = detectedType === 'production'
      ? ['product', 'employee', 'shift', 'status']
      : ['department', 'role', 'shift', 'status'];
    const allLinkedFields = ['product', 'employee', 'shift', 'department', 'role', 'status'];

    const uniqueValues = {};
    for (const field of allLinkedFields) {
      const col = columnMapping[field]?.csvCol;
      if (col) {
        const seen = new Set();
        for (const row of rows) {
          const val = row[col]?.trim();
          if (val) seen.add(val);
          if (seen.size >= 50) break;
        }
        uniqueValues[field] = [...seen];
      } else {
        uniqueValues[field] = [];
      }
    }

    // Fetch DB data
    const [products, employees, departments, roles] = await Promise.all([
      prisma.product.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } }),
      prisma.employee.findMany({
        select: { id: true, employeeCode: true, name: true },
        where: { status: 'ACTIVE' },
        orderBy: { employeeCode: 'asc' },
        take: 300,
      }),
      prisma.department.findMany({ select: { id: true, name: true } }),
      prisma.role.findMany({ select: { id: true, title: true, level: true }, orderBy: { level: 'asc' } }),
    ]);

    // Build value suggestions for linked entity fields
    const valueSuggestions = {
      product: {},
      employee: {},
      department: {},
      role: {},
    };

    for (const csvVal of uniqueValues.product) {
      valueSuggestions.product[csvVal] = fuzzyMatch(csvVal, products);
    }
    for (const csvVal of uniqueValues.employee) {
      valueSuggestions.employee[csvVal] = fuzzyMatch(csvVal, employees);
    }
    for (const csvVal of uniqueValues.department) {
      valueSuggestions.department[csvVal] = fuzzyMatch(csvVal, departments);
    }
    for (const csvVal of uniqueValues.role) {
      // roles use title field
      const roleCandidates = roles.map(r => ({ ...r, name: r.title }));
      const match = fuzzyMatch(csvVal, roleCandidates);
      if (match) {
        const { name, ...rest } = match;
        valueSuggestions.role[csvVal] = rest;
      } else {
        valueSuggestions.role[csvVal] = null;
      }
    }

    // Legacy meta for backward compat
    const meta = { products, employees, departments, roles };

    return NextResponse.json({
      detectedType,
      detectionScore,
      headers,
      totalRows: rows.length,
      columnMapping,
      uniqueValues,
      valueSuggestions,
      dbData: { products, employees, departments, roles },
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
    const {
      csvText,
      importType,
      columnMapping,
      valueMappings,
      defaultDate,
      defaultUnits,
      defaultDefects,
      defaultProductId,
      defaultDeptId,
      defaultRoleId,
    } = body;

    if (!csvText || !importType || !columnMapping) {
      return NextResponse.json({ error: 'csvText, importType, and columnMapping required' }, { status: 400 });
    }

    const { rows } = parseCSV(csvText);

    // Helper: get value from a row using columnMapping (which may be object {csvCol} or plain string)
    const getCol = (field) => {
      const v = columnMapping[field];
      if (!v) return null;
      if (typeof v === 'string') return v;
      if (v && typeof v === 'object' && v.csvCol) return v.csvCol;
      return null;
    };

    const get = (row, field) => {
      const col = getCol(field);
      return col ? row[col]?.trim() || null : null;
    };

    let imported = 0, skipped = 0, errors = [];
    let newProducts = 0, newEmployees = 0, newDepartments = 0;

    if (importType === 'production') {
      // Resolve product value mappings
      const productIdMap = {}; // csvVal → productId
      const prodMappings = valueMappings?.product ?? {};

      for (const [csvVal, action] of Object.entries(prodMappings)) {
        if (action.action === 'map' && action.mappedId) {
          productIdMap[csvVal] = Number(action.mappedId);
        } else if (action.action === 'new') {
          const name = action.newName || csvVal;
          const p = await prisma.product.upsert({
            where: { name },
            update: {},
            create: { name, unitPrice: 0, unitCost: 0 },
          });
          productIdMap[csvVal] = p.id;
          newProducts++;
        }
        // 'skip' → leave undefined
      }

      // Resolve employee value mappings
      const employeeIdMap = {};
      const empMappings = valueMappings?.employee ?? {};
      let empAutoIdx = 0;

      for (const [csvVal, action] of Object.entries(empMappings)) {
        if (action.action === 'map' && action.mappedId) {
          employeeIdMap[csvVal] = Number(action.mappedId);
        } else if (action.action === 'new') {
          const name = action.newName || csvVal;
          const code = `IMP${Date.now()}${empAutoIdx++}`;
          const e = await prisma.employee.upsert({
            where: { employeeCode: code },
            update: {},
            create: {
              name,
              employeeCode: code,
              departmentId: defaultDeptId ? Number(defaultDeptId) : undefined,
              roleId: defaultRoleId ? Number(defaultRoleId) : undefined,
              status: 'ACTIVE',
              experience: 0,
            },
          });
          employeeIdMap[csvVal] = e.id;
          newEmployees++;
        }
      }

      const shifts = ['MORNING', 'EVENING', 'NIGHT'];
      const fallbackProduct = defaultProductId ? await prisma.product.findUnique({ where: { id: Number(defaultProductId) } }) : null;

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        try {
          const productVal = get(row, 'product');
          let productId = null;

          if (productVal) {
            const mapping = prodMappings[productVal];
            if (mapping?.action === 'skip') { skipped++; continue; }
            productId = productIdMap[productVal] ?? null;
          }

          if (!productId && fallbackProduct) productId = fallbackProduct.id;
          if (!productId) { skipped++; continue; }

          const unitsRaw = get(row, 'units');
          const units = Number(unitsRaw ?? defaultUnits ?? 0);
          if (units <= 0) { skipped++; continue; }

          const shiftRaw = get(row, 'shift')?.toUpperCase();
          const shift = shifts.includes(shiftRaw) ? shiftRaw : 'MORNING';
          const defects = Number(get(row, 'defects') ?? defaultDefects ?? 0);

          // Resolve employee
          let empId = null;
          const empVal = get(row, 'employee');
          if (empVal) {
            const empMapping = empMappings[empVal];
            if (empMapping?.action === 'skip') {
              // still import row but without employee
            } else if (empMapping?.action === 'map' || empMapping?.action === 'new') {
              empId = employeeIdMap[empVal] ?? null;
            } else {
              // fallback: try DB lookup
              const emp = await prisma.employee.findFirst({
                where: {
                  OR: [
                    { name: { contains: empVal, mode: 'insensitive' } },
                    { employeeCode: { equals: empVal, mode: 'insensitive' } },
                  ],
                },
              });
              empId = emp?.id ?? null;
            }
          }

          const dateRaw = get(row, 'date');
          const fallback = defaultDate ? new Date(defaultDate) : new Date();
          const prodDate = dateRaw ? new Date(dateRaw) : fallback;
          const validDate = isNaN(prodDate.getTime()) ? fallback : prodDate;

          const product = await prisma.product.findUnique({ where: { id: productId } });
          const revenue = units * (product?.unitPrice || 0);
          const cost = units * (product?.unitCost || 0);

          await prisma.production.create({
            data: {
              units,
              defects,
              shift,
              productId,
              employeeId: empId,
              productionDate: validDate,
              revenue,
              cost,
              profit: revenue - cost,
            },
          });
          imported++;
        } catch (e) {
          errors.push(`Row ${i + 2}: ${e.message}`);
          skipped++;
        }
      }
    } else {
      // Employee import
      // Resolve department mappings
      const deptIdMap = {};
      const deptMappings = valueMappings?.department ?? {};

      for (const [csvVal, action] of Object.entries(deptMappings)) {
        if (action.action === 'map' && action.mappedId) {
          deptIdMap[csvVal] = Number(action.mappedId);
        } else if (action.action === 'new') {
          const name = action.newName || csvVal;
          const code = name.toUpperCase().replace(/\s+/g, '_').slice(0, 20) + '_' + Date.now().toString().slice(-4);
          const d = await prisma.department.upsert({
            where: { name },
            update: {},
            create: { name, code },
          });
          deptIdMap[csvVal] = d.id;
          newDepartments++;
        }
      }

      // Resolve role mappings
      const roleIdMap = {};
      const roleMappings = valueMappings?.role ?? {};

      for (const [csvVal, action] of Object.entries(roleMappings)) {
        if (action.action === 'map' && action.mappedId) {
          roleIdMap[csvVal] = Number(action.mappedId);
        } else if (action.action === 'new') {
          const title = action.newName || csvVal;
          const r = await prisma.role.upsert({
            where: { title },
            update: {},
            create: { title, level: 1 },
          });
          roleIdMap[csvVal] = r.id;
        }
      }

      const fallbackDept = defaultDeptId ? await prisma.department.findUnique({ where: { id: Number(defaultDeptId) } }) : null;
      const fallbackRole = defaultRoleId ? await prisma.role.findUnique({ where: { id: Number(defaultRoleId) } }) : null;

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        try {
          const name = get(row, 'name');
          if (!name) { skipped++; continue; }

          const code = get(row, 'employeeCode') || `IMP${Date.now().toString().slice(-4)}${i}`;

          const deptVal = get(row, 'department');
          let deptId = deptVal ? (deptIdMap[deptVal] ?? null) : null;
          if (!deptId && deptMappings[deptVal]?.action === 'skip') { skipped++; continue; }
          if (!deptId && fallbackDept) deptId = fallbackDept.id;
          if (!deptId) { errors.push(`Row ${i + 2}: no department found`); skipped++; continue; }

          const roleVal = get(row, 'role');
          let roleId = roleVal ? (roleIdMap[roleVal] ?? null) : null;
          if (!roleId && roleMappings[roleVal]?.action === 'skip') { skipped++; continue; }
          if (!roleId && fallbackRole) roleId = fallbackRole.id;
          if (!roleId) { errors.push(`Row ${i + 2}: no role found`); skipped++; continue; }

          const statusRaw = get(row, 'status')?.toUpperCase();
          const validStatuses = ['ACTIVE', 'ON_LEAVE', 'RESIGNED', 'TERMINATED'];
          const status = validStatuses.includes(statusRaw) ? statusRaw : 'ACTIVE';

          await prisma.employee.upsert({
            where: { employeeCode: code },
            update: {
              name,
              email: get(row, 'email'),
              phone: get(row, 'phone'),
              experience: Number(get(row, 'experience') || 0),
              departmentId: deptId,
              roleId,
              status,
            },
            create: {
              name,
              employeeCode: code,
              email: get(row, 'email'),
              phone: get(row, 'phone'),
              experience: Number(get(row, 'experience') || 0),
              departmentId: deptId,
              roleId,
              status,
            },
          });
          imported++;
        } catch (e) {
          errors.push(`Row ${i + 2}: ${e.message}`);
          skipped++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      imported,
      skipped,
      newProducts,
      newEmployees,
      newDepartments,
      errors: errors.slice(0, 10),
      message: `Imported ${imported} records. Skipped ${skipped}.`,
    });
  } catch (err) {
    console.error('Smart import execute error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
