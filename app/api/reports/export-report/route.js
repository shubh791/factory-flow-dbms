import prisma from '@/lib/prisma';
import PDFDocument from 'pdfkit';
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/* ── Palette (white/professional theme) ──────────────────────────────── */
const C = {
  indigo:  '#4f46e5',
  indigoL: '#6366f1',
  indigoXL:'#818cf8',
  white:   '#ffffff',
  bg:      '#f8fafc',
  card:    '#ffffff',
  border:  '#e2e8f0',
  borderD: '#cbd5e1',
  h1:      '#0f172a',
  h2:      '#1e293b',
  body:    '#334155',
  muted:   '#64748b',
  faint:   '#94a3b8',
  green:   '#059669',
  greenL:  '#d1fae5',
  red:     '#dc2626',
  redL:    '#fee2e2',
  amber:   '#d97706',
  amberL:  '#fef3c7',
  purple:  '#7c3aed',
  purpleL: '#ede9fe',
  teal:    '#0d9488',
  tealL:   '#ccfbf1',
  blue:    '#2563eb',
  blueL:   '#dbeafe',
};

/* ── Page dimensions (A4) ────────────────────────────────────────────── */
const W = 595.28; // A4 width in points
const H = 841.89; // A4 height in points
const ML = 48;    // margin left
const MR = 48;    // margin right
const CW = W - ML - MR; // content width

/* ── Header ──────────────────────────────────────────────────────────── */
function pageHeader(doc, pageNum) {
  // Top bar
  doc.rect(0, 0, W, 40).fill(C.indigo);
  doc.fillColor(C.white).fontSize(7.5).font('Helvetica-Bold')
     .text('FACTORYFLOW DBMS  ·  INDUSTRIAL INTELLIGENCE REPORT', ML, 14, { width: CW - 60 });
  doc.fillColor('rgba(255,255,255,0.7)').fontSize(7.5).font('Helvetica')
     .text(`Page ${pageNum}`, 0, 14, { width: W - ML, align: 'right' });
  // Thin accent line
  doc.rect(0, 40, W, 2).fill(C.indigoL);
}

/* ── Footer ──────────────────────────────────────────────────────────── */
function pageFooter(doc, generatedAt) {
  const fy = H - 32;
  doc.rect(0, fy - 4, W, 36).fill(C.bg);
  doc.moveTo(ML, fy - 4).lineTo(W - MR, fy - 4).strokeColor(C.border).lineWidth(0.5).stroke();
  doc.fillColor(C.faint).fontSize(6.5).font('Helvetica')
     .text(`Generated: ${generatedAt}  ·  Confidential — Internal Use Only`, ML, fy + 4, { width: CW / 2 })
     .text('FactoryFlow DBMS Platform  v2.0', ML, fy + 4, { width: CW, align: 'right' });
}

/* ── Section title ───────────────────────────────────────────────────── */
function sectionTitle(doc, label, y) {
  doc.rect(ML, y, 4, 20).fill(C.indigo);
  doc.fillColor(C.h1).fontSize(13).font('Helvetica-Bold')
     .text(label, ML + 12, y + 2, { width: CW - 12 });
  doc.moveTo(ML, y + 25).lineTo(W - MR, y + 25).strokeColor(C.border).lineWidth(0.5).stroke();
  return y + 36;
}

/* ── KPI box ─────────────────────────────────────────────────────────── */
function kpiBox(doc, x, y, w, h, label, value, sub, accent, lightBg) {
  doc.rect(x, y, w, h).fill(lightBg || C.bg);
  doc.rect(x, y, w, h).strokeColor(C.border).lineWidth(0.5).stroke();
  doc.rect(x, y, 4, h).fill(accent);
  doc.fillColor(C.muted).fontSize(7).font('Helvetica-Bold')
     .text(label.toUpperCase(), x + 12, y + 9, { width: w - 18 });
  doc.fillColor(C.h1).fontSize(16).font('Helvetica-Bold')
     .text(value, x + 12, y + 21, { width: w - 18 });
  if (sub) {
    doc.fillColor(C.muted).fontSize(7.5).font('Helvetica')
       .text(sub, x + 12, y + 42, { width: w - 18 });
  }
}

/* ── Table ───────────────────────────────────────────────────────────── */
function drawTable(doc, startX, startY, columns, rows) {
  const totalW = columns.reduce((s, c) => s + c.width, 0);
  const rowH = 20;

  // Header
  doc.rect(startX, startY, totalW, 24).fill(C.indigoL);
  let cx = startX;
  columns.forEach((col) => {
    doc.fillColor(C.white).fontSize(7).font('Helvetica-Bold')
       .text(col.label.toUpperCase(), cx + 6, startY + 8, { width: col.width - 10 });
    cx += col.width;
  });

  // Rows
  let ry = startY + 24;
  rows.forEach((row, ri) => {
    const bg = ri % 2 === 0 ? C.white : C.bg;
    doc.rect(startX, ry, totalW, rowH).fill(bg);
    doc.rect(startX, ry, totalW, rowH).strokeColor(C.border).lineWidth(0.25).stroke();
    cx = startX;
    row.forEach((cell, ci) => {
      const col   = columns[ci];
      const color = col.color ? col.color(cell) : C.body;
      const font  = col.bold ? 'Helvetica-Bold' : (col.mono ? 'Courier' : 'Helvetica');
      doc.fillColor(color).fontSize(col.mono ? 8 : 8.5).font(font)
         .text(String(cell ?? '—'), cx + 6, ry + 5, { width: col.width - 10, ellipsis: true });
      cx += col.width;
    });
    ry += rowH;
  });

  doc.moveTo(startX, ry).lineTo(startX + totalW, ry).strokeColor(C.borderD).lineWidth(0.5).stroke();
  return ry;
}

/* ── Bullet list ─────────────────────────────────────────────────────── */
function bulletList(doc, items, x, startY) {
  let y = startY;
  const BW = W - x - MR;
  items.forEach((item) => {
    doc.circle(x + 5, y + 6, 3).fill(C.indigo);
    doc.fillColor(C.body).fontSize(9.5).font('Helvetica')
       .text(String(item), x + 14, y, { width: BW - 14 });
    const h = doc.heightOfString(String(item), { width: BW - 14 });
    y += Math.max(h, 14) + 5;
  });
  return y;
}

/* ── Numbered recommendation card ────────────────────────────────────── */
function recCard(doc, num, text, x, y) {
  const bw = W - x - MR;
  doc.rect(x, y, bw, 36).fill(C.bg).strokeColor(C.border).lineWidth(0.5).stroke();
  doc.rect(x, y, 4, 36).fill(C.indigo);
  doc.fillColor(C.indigoL).fontSize(9).font('Helvetica-Bold')
     .text(String(num).padStart(2, '0'), x + 10, y + 6);
  doc.fillColor(C.body).fontSize(9.5).font('Helvetica')
     .text(text, x + 28, y + 6, { width: bw - 36 });
  return y + 44;
}

/* ── Main handler ──────────────────────────────────────────────────────── */
export async function GET() {
  try {
    /* ── Queries ──────────────────────────────────────────────────── */
    const [productions, employees, departments, roles, promotions] = await Promise.all([
      prisma.production.findMany({
        include: { employee: { include: { department: true, role: true } }, product: true },
        orderBy: { productionDate: 'asc' },
      }),
      prisma.employee.findMany({ include: { department: true, role: true } }),
      prisma.department.findMany(),
      prisma.role.findMany({ orderBy: { level: 'asc' } }),
      prisma.promotionHistory.findMany({
        orderBy: { promotedAt: 'desc' }, take: 20,
        include: { employee: { select: { name: true } }, oldRole: { select: { title: true } }, newRole: { select: { title: true } } },
      }),
    ]);

    const generatedAt = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    const reportDate  = new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });

    /* ── Core KPIs ────────────────────────────────────────────────── */
    let totalUnits = 0, totalDefects = 0, totalRevenue = 0, totalCost = 0;
    productions.forEach((p) => {
      totalUnits   += p.units   ?? 0;
      totalDefects += p.defects ?? 0;
      totalRevenue += Number(p.revenue ?? 0);
      totalCost    += Number(p.cost    ?? 0);
    });
    const efficiency   = totalUnits > 0 ? (totalUnits - totalDefects) / totalUnits * 100 : 0;
    const defectRate   = totalUnits > 0 ? totalDefects / totalUnits * 100 : 0;
    const grossProfit  = totalRevenue - totalCost;
    const profitMargin = totalRevenue > 0 ? grossProfit / totalRevenue * 100 : 0;

    /* ── Monthly trend ────────────────────────────────────────────── */
    const monthMap = {};
    productions.forEach((p) => {
      const key = new Date(p.productionDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'short' });
      if (!monthMap[key]) monthMap[key] = { units: 0, defects: 0, revenue: 0, records: 0 };
      monthMap[key].units   += p.units   ?? 0;
      monthMap[key].defects += p.defects ?? 0;
      monthMap[key].revenue += Number(p.revenue ?? 0);
      monthMap[key].records += 1;
    });
    const monthlyRows = Object.entries(monthMap).slice(-12).map(([mo, d]) => [
      mo,
      d.units.toLocaleString('en-IN'),
      d.defects.toLocaleString('en-IN'),
      `${d.units > 0 ? ((d.units - d.defects) / d.units * 100).toFixed(1) : 0}%`,
      `₹${d.revenue.toLocaleString('en-IN')}`,
      String(d.records),
    ]);

    /* ── Product breakdown ────────────────────────────────────────── */
    const prodMap = {};
    productions.forEach((p) => {
      const name = p.product?.name ?? 'Unknown';
      if (!prodMap[name]) prodMap[name] = { units: 0, defects: 0, revenue: 0, batches: 0 };
      prodMap[name].units   += p.units   ?? 0;
      prodMap[name].defects += p.defects ?? 0;
      prodMap[name].revenue += Number(p.revenue ?? 0);
      prodMap[name].batches += 1;
    });
    const productRows = Object.entries(prodMap)
      .sort((a, b) => b[1].units - a[1].units).slice(0, 15)
      .map(([name, d]) => [
        name,
        d.units.toLocaleString('en-IN'),
        d.defects.toLocaleString('en-IN'),
        `${d.units > 0 ? ((d.units - d.defects) / d.units * 100).toFixed(1) : 0}%`,
        `₹${d.revenue.toLocaleString('en-IN')}`,
        String(d.batches),
      ]);

    /* ── Department stats ─────────────────────────────────────────── */
    const deptMap = {};
    productions.forEach((p) => {
      const dept = p.employee?.department?.name ?? 'Unassigned';
      if (!deptMap[dept]) deptMap[dept] = { units: 0, defects: 0, revenue: 0, empSet: new Set() };
      deptMap[dept].units   += p.units   ?? 0;
      deptMap[dept].defects += p.defects ?? 0;
      deptMap[dept].revenue += Number(p.revenue ?? 0);
      if (p.employee?.id) deptMap[dept].empSet.add(p.employee.id);
    });
    const deptRows = Object.entries(deptMap)
      .sort((a, b) => b[1].units - a[1].units)
      .map(([name, d]) => [
        name,
        String(d.empSet.size),
        d.units.toLocaleString('en-IN'),
        d.defects.toLocaleString('en-IN'),
        `${d.units > 0 ? ((d.units - d.defects) / d.units * 100).toFixed(1) : 0}%`,
        `₹${d.revenue.toLocaleString('en-IN')}`,
      ]);

    /* ── Employee stats ───────────────────────────────────────────── */
    const avgExp = employees.length
      ? (employees.reduce((s, e) => s + (e.experience ?? 0), 0) / employees.length).toFixed(1)
      : '0';
    const activeCount = employees.filter(e => e.status === 'ACTIVE').length;
    const empByDept = {};
    employees.forEach((e) => {
      const d = e.department?.name ?? 'Unknown';
      empByDept[d] = (empByDept[d] ?? 0) + 1;
    });
    const employeeRows = Object.entries(empByDept)
      .sort((a, b) => b[1] - a[1])
      .map(([dept, cnt]) => [dept, String(cnt), `${((cnt / employees.length) * 100).toFixed(1)}%`]);

    /* ── Top producers ────────────────────────────────────────────── */
    const empProdMap = {};
    productions.forEach((p) => {
      const id = p.employee?.id;
      if (!id) return;
      if (!empProdMap[id]) empProdMap[id] = { name: p.employee.name ?? '—', dept: p.employee.department?.name ?? '—', units: 0, defects: 0, role: p.employee.role?.title ?? '—' };
      empProdMap[id].units   += p.units   ?? 0;
      empProdMap[id].defects += p.defects ?? 0;
    });
    const topProducerRows = Object.values(empProdMap)
      .sort((a, b) => b.units - a.units).slice(0, 15)
      .map((e, i) => [
        String(i + 1), e.name, e.dept, e.role,
        e.units.toLocaleString('en-IN'),
        e.defects.toLocaleString('en-IN'),
        `${e.units > 0 ? ((e.units - e.defects) / e.units * 100).toFixed(1) : 0}%`,
      ]);

    /* ── Risks ────────────────────────────────────────────────────── */
    const risks = [];
    if (defectRate > 10) risks.push(`Defect rate ${defectRate.toFixed(1)}% exceeds 10% threshold — immediate QC review required`);
    if (efficiency < 75) risks.push(`Efficiency ${efficiency.toFixed(1)}% is below the 75% industry benchmark`);
    if (profitMargin < 15 && totalRevenue > 0) risks.push(`Profit margin ${profitMargin.toFixed(1)}% is below the 15% minimum`);
    Object.entries(deptMap).forEach(([dept, d]) => {
      const eff = d.units > 0 ? (d.units - d.defects) / d.units * 100 : 0;
      if (eff < 70) risks.push(`${dept}: efficiency at ${eff.toFixed(1)}% — targeted intervention recommended`);
    });
    if (!risks.length) risks.push('No critical risks detected. All KPIs are within acceptable ranges.');

    /* ── AI insights via Groq ─────────────────────────────────────── */
    let ai = { strengths: [], recommendations: [], outlook: '' };
    try {
      const prompt = `Industrial analytics AI. Metrics: units=${totalUnits}, defects=${totalDefects}, efficiency=${efficiency.toFixed(1)}%, defectRate=${defectRate.toFixed(1)}%, employees=${employees.length}, depts=${departments.length}, revenue=${totalRevenue.toFixed(0)}, profit=${grossProfit.toFixed(0)}, margin=${profitMargin.toFixed(1)}%. Return ONLY JSON: {"strengths":["...","...","..."],"recommendations":["...","...","...","...","..."],"outlook":"2-3 sentence executive outlook"}`;
      const resp = await groq.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 550,
      });
      const raw = resp.choices[0]?.message?.content ?? '{}';
      ai = JSON.parse(raw.replace(/```json\n?|\n?```/g, '').trim());
    } catch { /* fallback below */ }

    if (!ai.strengths?.length)       ai.strengths       = ['DBMS-driven analytics enable real-time data-backed decisions', 'Centralized production records improve full traceability', 'Relational schema enables cross-department performance joins'];
    if (!ai.recommendations?.length) ai.recommendations = ['Implement predictive maintenance to reduce defect rates', 'Invest in workforce training for lower-performing departments', 'Optimize shift scheduling using historical trend data', 'Automate anomaly alerts to reduce response time', 'Expand product line analytics to identify high-margin SKUs'];
    if (!ai.outlook)                 ai.outlook         = `With ${employees.length} employees across ${departments.length} departments and an efficiency of ${efficiency.toFixed(1)}%, the organization is positioned for continuous improvement through data-driven operations.`;

    /* ═══════════════════════ BUILD PDF ═══════════════════════════ */
    const doc  = new PDFDocument({ size: 'A4', margin: 0, autoFirstPage: true });
    const bufs = [];
    doc.on('data', (b) => bufs.push(b));
    let pg = 0;

    function newPage() {
      if (pg > 0) doc.addPage();
      pg++;
      // White page background
      doc.rect(0, 0, W, H).fill(C.white);
      pageHeader(doc, pg);
      pageFooter(doc, generatedAt);
    }

    return new Promise((resolve, reject) => {
      doc.on('error', reject);
      doc.on('end', () => {
        resolve(new Response(Buffer.concat(bufs), {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename=FactoryFlow_Report_${Date.now()}.pdf`,
          },
        }));
      });

      try {
        /* ── COVER PAGE ──────────────────────────────────────────── */
        pg++;

        // White background
        doc.rect(0, 0, W, H).fill(C.white);

        // Top indigo bar (full width, tall)
        doc.rect(0, 0, W, 240).fill(C.indigo);

        // Diagonal accent stripe
        doc.save();
        doc.polygon([0, 200], [W, 240], [W, 260], [0, 225]).fill(C.indigoL);
        doc.restore();

        // Logo badge
        doc.circle(W / 2, 110, 48).fill('rgba(255,255,255,0.12)');
        doc.circle(W / 2, 110, 38).fill('rgba(255,255,255,0.15)');
        doc.fillColor(C.white).fontSize(26).font('Helvetica-Bold')
           .text('FF', W / 2 - 17, 96);

        // Title
        doc.fillColor(C.white).fontSize(28).font('Helvetica-Bold')
           .text('Industrial Executive Report', ML, 270, { align: 'center', width: CW });
        doc.fillColor('rgba(255,255,255,0.75)').fontSize(12).font('Helvetica')
           .text('FactoryFlow DBMS Intelligence Platform', ML, 308, { align: 'center', width: CW });

        // Divider
        doc.moveTo(ML + 60, 334).lineTo(W - MR - 60, 334).strokeColor(C.border).lineWidth(1).stroke();

        // Meta grid
        const metaItems = [
          ['Report Date', reportDate],
          ['Total Employees', String(employees.length)],
          ['Departments', String(departments.length)],
          ['Production Records', productions.length.toLocaleString('en-IN')],
          ['Overall Efficiency', `${efficiency.toFixed(2)}%`],
          ['Report Version', 'v2.0 — AI Enhanced'],
        ];
        const mw = (CW - 12) / 2;
        metaItems.forEach(([k, v], i) => {
          const col = i % 2, row = Math.floor(i / 2);
          const bx = ML + col * (mw + 12), by = 348 + row * 60;
          doc.rect(bx, by, mw, 50).fill(C.bg).strokeColor(C.border).lineWidth(0.5).stroke();
          doc.rect(bx, by, 4, 50).fill(C.indigo);
          doc.fillColor(C.muted).fontSize(7.5).font('Helvetica-Bold')
             .text(k.toUpperCase(), bx + 12, by + 10, { width: mw - 20 });
          doc.fillColor(C.h1).fontSize(15).font('Helvetica-Bold')
             .text(v, bx + 12, by + 24, { width: mw - 20 });
        });

        // Status pill
        const sCol = efficiency >= 85 ? C.green : efficiency >= 70 ? C.amber : C.red;
        const sLbl = efficiency >= 85 ? 'OPERATIONS: EXCELLENT' : efficiency >= 70 ? 'OPERATIONS: MODERATE' : 'OPERATIONS: CRITICAL';
        doc.rect(ML + 60, 540, CW - 120, 36).fill(C.bg).strokeColor(C.border).lineWidth(0.5).stroke();
        doc.rect(ML + 60, 540, 4, 36).fill(sCol);
        doc.fillColor(sCol).fontSize(9).font('Helvetica-Bold')
           .text(sLbl, ML + 76, 552, { width: CW - 140 });

        // Bottom watermark
        doc.fillColor(C.faint).fontSize(8).font('Helvetica')
           .text('Confidential — Internal Use Only · All data sourced from live DBMS', ML, H - 60, { align: 'center', width: CW });
        pageFooter(doc, generatedAt);

        /* ── PAGE 2 — EXECUTIVE KPI SUMMARY ─────────────────────── */
        newPage();
        let y = 58;
        y = sectionTitle(doc, '01  Executive KPI Summary', y);

        // Efficiency banner
        const effColor = efficiency >= 85 ? C.green : efficiency >= 70 ? C.amber : C.red;
        const effBg    = efficiency >= 85 ? C.greenL : efficiency >= 70 ? C.amberL : C.redL;
        const effLabel = efficiency >= 85 ? 'Excellent' : efficiency >= 70 ? 'Moderate' : 'Critical';
        doc.rect(ML, y, CW, 44).fill(effBg).strokeColor(effColor).lineWidth(0.5).stroke();
        doc.rect(ML, y, 4, 44).fill(effColor);
        doc.fillColor(effColor).fontSize(9).font('Helvetica-Bold')
           .text(`STATUS: ${effLabel.toUpperCase()}  ·  Efficiency ${efficiency.toFixed(2)}%`, ML + 12, y + 8, { width: CW - 20 });
        doc.fillColor(C.body).fontSize(8.5).font('Helvetica')
           .text(
             efficiency >= 85
               ? `Operations are performing excellently with ${efficiency.toFixed(1)}% efficiency and strong process control.`
               : efficiency >= 70
               ? `Moderate efficiency (${efficiency.toFixed(1)}%). QC improvements recommended in underperforming departments.`
               : `Critical level (${efficiency.toFixed(1)}%). Immediate operational review and corrective plans required.`,
             ML + 12, y + 24, { width: CW - 20 }
           );
        y += 56;

        // KPI boxes (2×3 grid)
        const kw = (CW - 10) / 3;
        const kh = 60;
        const kpis = [
          { label: 'Total Units Produced',  value: totalUnits.toLocaleString('en-IN'),  sub: `${productions.length} production records`,    accent: C.green,  bg: C.greenL  },
          { label: 'Total Defective Units', value: totalDefects.toLocaleString('en-IN'), sub: `${defectRate.toFixed(2)}% defect rate`,       accent: C.red,    bg: C.redL    },
          { label: 'Operational Efficiency',value: `${efficiency.toFixed(2)}%`,          sub: 'Units − Defects / Total Units',               accent: C.indigo, bg: C.blueL   },
          { label: 'Gross Revenue',         value: `₹${totalRevenue.toLocaleString('en-IN')}`, sub: 'Total output value',                   accent: C.purple, bg: C.purpleL },
          { label: 'Gross Profit',          value: `₹${grossProfit.toLocaleString('en-IN')}`,  sub: `${profitMargin.toFixed(1)}% margin`,   accent: C.amber,  bg: C.amberL  },
          { label: 'Total Employees',       value: String(employees.length),             sub: `${departments.length} depts · avg ${avgExp}y exp`, accent: C.teal, bg: C.tealL },
        ];
        kpis.forEach(({ label, value, sub, accent, bg }, i) => {
          kpiBox(doc, ML + (i % 3) * (kw + 5), y + Math.floor(i / 3) * (kh + 8), kw, kh, label, value, sub, accent, bg);
        });
        y += 2 * (kh + 8) + 14;

        // Defect rate bar
        doc.fillColor(C.muted).fontSize(7.5).font('Helvetica-Bold')
           .text(`DEFECT RATE  ${defectRate.toFixed(2)}%`, ML, y + 2);
        doc.rect(ML, y + 14, CW, 10).fill(C.bg).strokeColor(C.border).lineWidth(0.5).stroke();
        const fillW = Math.min(CW, (defectRate / 100) * CW);
        if (fillW > 0) doc.rect(ML, y + 14, fillW, 10).fill(defectRate > 10 ? C.red : C.green);

        /* ── PAGE 3 — MONTHLY TREND ──────────────────────────────── */
        newPage();
        y = 58;
        y = sectionTitle(doc, '02  Monthly Production Trend', y);
        doc.fillColor(C.muted).fontSize(8.5).font('Helvetica')
           .text('Month-over-month production, defects, efficiency, and revenue from indexed records.', ML, y, { width: CW });
        y += 18;

        drawTable(doc, ML, y, [
          { label: 'Month',      width: 66,  bold: true, color: () => C.h2      },
          { label: 'Units',      width: 74,  mono: true, color: () => C.green   },
          { label: 'Defects',    width: 64,  mono: true, color: () => C.red     },
          { label: 'Efficiency', width: 68,  color: (v) => parseFloat(v) >= 85 ? C.green : parseFloat(v) >= 70 ? C.amber : C.red },
          { label: 'Revenue',    width: 90,  mono: true, color: () => C.purple  },
          { label: 'Batches',    width: 54,  mono: true, color: () => C.muted   },
        ], monthlyRows);

        /* ── PAGE 4 — PRODUCT BREAKDOWN ──────────────────────────── */
        newPage();
        y = 58;
        y = sectionTitle(doc, '03  Product Performance Breakdown', y);
        doc.fillColor(C.muted).fontSize(8.5).font('Helvetica')
           .text(`Top ${productRows.length} products by units. Efficiency and revenue per product line.`, ML, y, { width: CW });
        y += 18;

        drawTable(doc, ML, y, [
          { label: 'Product',    width: 106, bold: true, color: () => C.h2     },
          { label: 'Units',      width: 70,  mono: true, color: () => C.green  },
          { label: 'Defects',    width: 62,  mono: true, color: () => C.red    },
          { label: 'Efficiency', width: 68,  color: (v) => parseFloat(v) >= 85 ? C.green : parseFloat(v) >= 70 ? C.amber : C.red },
          { label: 'Revenue',    width: 86,  mono: true, color: () => C.purple },
          { label: 'Batches',    width: 45,  mono: true, color: () => C.muted  },
        ], productRows);

        /* ── PAGE 5 — DEPARTMENT PERFORMANCE ─────────────────────── */
        newPage();
        y = 58;
        y = sectionTitle(doc, '04  Department Performance', y);
        doc.fillColor(C.muted).fontSize(8.5).font('Helvetica')
           .text('Department-level efficiency, headcount contribution, and revenue output.', ML, y, { width: CW });
        y += 18;

        const dEnd = drawTable(doc, ML, y, [
          { label: 'Department', width: 106, bold: true, color: () => C.h2       },
          { label: 'Employees',  width: 64,  mono: true, color: () => C.indigoL  },
          { label: 'Units',      width: 70,  mono: true, color: () => C.green    },
          { label: 'Defects',    width: 60,  mono: true, color: () => C.red      },
          { label: 'Efficiency', width: 68,  color: (v) => parseFloat(v) >= 85 ? C.green : parseFloat(v) >= 70 ? C.amber : C.red },
          { label: 'Revenue',    width: 69,  mono: true, color: () => C.purple   },
        ], deptRows);

        // Best / worst callouts
        const sortedDepts = Object.entries(deptMap)
          .filter(([, d]) => d.units > 0)
          .sort((a, b) => ((b[1].units - b[1].defects) / b[1].units) - ((a[1].units - a[1].defects) / a[1].units));
        if (sortedDepts.length >= 2) {
          const [bestName, bestD]   = sortedDepts[0];
          const [worstName, worstD] = sortedDepts[sortedDepts.length - 1];
          const bEff = ((bestD.units - bestD.defects) / bestD.units * 100).toFixed(1);
          const wEff = ((worstD.units - worstD.defects) / worstD.units * 100).toFixed(1);
          const hw   = (CW - 12) / 2;
          const cy   = dEnd + 16;
          if (cy < H - 100) {
            doc.rect(ML, cy, hw, 48).fill(C.greenL).strokeColor(C.green).lineWidth(0.5).stroke();
            doc.rect(ML, cy, 4, 48).fill(C.green);
            doc.fillColor(C.green).fontSize(7.5).font('Helvetica-Bold').text('TOP PERFORMING', ML + 12, cy + 8);
            doc.fillColor(C.h1).fontSize(13).font('Helvetica-Bold').text(bestName, ML + 12, cy + 20);
            doc.fillColor(C.muted).fontSize(8).font('Helvetica').text(`${bEff}% efficiency`, ML + 12, cy + 36);

            doc.rect(ML + hw + 12, cy, hw, 48).fill(C.redL).strokeColor(C.red).lineWidth(0.5).stroke();
            doc.rect(ML + hw + 12, cy, 4, 48).fill(C.red);
            doc.fillColor(C.red).fontSize(7.5).font('Helvetica-Bold').text('NEEDS ATTENTION', ML + hw + 24, cy + 8);
            doc.fillColor(C.h1).fontSize(13).font('Helvetica-Bold').text(worstName, ML + hw + 24, cy + 20);
            doc.fillColor(C.muted).fontSize(8).font('Helvetica').text(`${wEff}% efficiency`, ML + hw + 24, cy + 36);
          }
        }

        /* ── PAGE 6 — WORKFORCE ───────────────────────────────────── */
        newPage();
        y = 58;
        y = sectionTitle(doc, '05  Workforce & Employee Analytics', y);

        const wk = (CW - 15) / 4;
        [
          { label: 'Total Workforce', value: String(employees.length),  sub: 'All employees',       accent: C.indigo, bg: C.blueL   },
          { label: 'Active',          value: String(activeCount),        sub: 'Currently active',    accent: C.green,  bg: C.greenL  },
          { label: 'Avg Experience',  value: `${avgExp} yrs`,           sub: 'Across all roles',    accent: C.teal,   bg: C.tealL   },
          { label: 'Active Roles',    value: String(roles.length),       sub: 'Hierarchy levels',    accent: C.purple, bg: C.purpleL },
        ].forEach(({ label, value, sub, accent, bg }, i) => {
          kpiBox(doc, ML + i * (wk + 5), y, wk, 58, label, value, sub, accent, bg);
        });
        y += 74;

        y = sectionTitle(doc, 'Headcount by Department', y);
        const eEnd = drawTable(doc, ML, y, [
          { label: 'Department',     width: 220, bold: true, color: () => C.h2      },
          { label: 'Headcount',      width: 110, mono: true, color: () => C.indigo  },
          { label: '% of Workforce', width: 107, color: () => C.muted              },
        ], employeeRows);
        y = eEnd + 20;

        if (promotions.length > 0 && y < H - 110) {
          y = sectionTitle(doc, `Recent Promotions (${promotions.length} total)`, y);
          promotions.slice(0, 6).forEach((p) => {
            doc.circle(ML + 6, y + 6, 3).fill(C.purple);
            const txt = `${p.employee?.name ?? 'Unknown'}  ·  ${p.oldRole?.title ?? '?'} → ${p.newRole?.title ?? '?'}  ·  ${new Date(p.promotedAt).toLocaleDateString('en-IN')}`;
            doc.fillColor(C.body).fontSize(9).font('Helvetica').text(txt, ML + 16, y, { width: CW - 16 });
            y += 18;
          });
        }

        /* ── PAGE 6b — TOP EMPLOYEE PRODUCERS ────────────────────── */
        newPage();
        y = 58;
        y = sectionTitle(doc, '05b  Top Employee Producers', y);
        doc.fillColor(C.muted).fontSize(8.5).font('Helvetica')
           .text('Employees ranked by total units produced. Includes defect rate and department.', ML, y, { width: CW });
        y += 18;

        drawTable(doc, ML, y, [
          { label: '#',          width: 26,  mono: true, color: () => C.muted   },
          { label: 'Employee',   width: 94,  bold: true, color: () => C.h2      },
          { label: 'Department', width: 82,  color: () => C.body               },
          { label: 'Role',       width: 74,  color: () => C.body               },
          { label: 'Units',      width: 62,  mono: true, color: () => C.green   },
          { label: 'Defects',    width: 52,  mono: true, color: () => C.red     },
          { label: 'Efficiency', width: 57,  color: (v) => parseFloat(v) >= 90 ? C.green : parseFloat(v) >= 75 ? C.amber : C.red },
        ], topProducerRows);

        /* ── PAGE 7 — FINANCIAL SUMMARY ──────────────────────────── */
        newPage();
        y = 58;
        y = sectionTitle(doc, '06  Financial Summary', y);

        const fk = (CW - 10) / 3;
        [
          { label: 'Gross Revenue', value: `₹${totalRevenue.toLocaleString('en-IN')}`, sub: 'Total output value',   accent: C.green,  bg: C.greenL  },
          { label: 'Total Cost',    value: `₹${totalCost.toLocaleString('en-IN')}`,    sub: 'Production cost',      accent: C.red,    bg: C.redL    },
          { label: 'Gross Profit',  value: `₹${grossProfit.toLocaleString('en-IN')}`,  sub: `${profitMargin.toFixed(1)}% margin`, accent: C.amber, bg: C.amberL },
        ].forEach(({ label, value, sub, accent, bg }, i) => {
          kpiBox(doc, ML + i * (fk + 5), y, fk, 60, label, value, sub, accent, bg);
        });
        y += 76;

        y = sectionTitle(doc, 'Revenue by Department', y);
        drawTable(doc, ML, y, [
          { label: 'Department',    width: 158, bold: true, color: () => C.h2     },
          { label: 'Revenue',       width: 115, mono: true, color: () => C.green  },
          { label: 'Revenue Share', width: 84,  color: () => C.amber              },
          { label: 'Units',         width: 80,  mono: true, color: () => C.muted  },
        ], Object.entries(deptMap).sort((a, b) => b[1].revenue - a[1].revenue).map(([dept, d]) => [
          dept,
          `₹${d.revenue.toLocaleString('en-IN')}`,
          `${totalRevenue > 0 ? (d.revenue / totalRevenue * 100).toFixed(1) : 0}%`,
          d.units.toLocaleString('en-IN'),
        ]));

        /* ── PAGE 8 — DEFECT & RISK ──────────────────────────────── */
        newPage();
        y = 58;
        y = sectionTitle(doc, '07  Defect & Quality Risk Analysis', y);

        const dk = (CW - 10) / 3;
        [
          { label: 'Total Defects', value: totalDefects.toLocaleString('en-IN'), sub: 'Defective units',        accent: C.red,   bg: C.redL   },
          { label: 'Defect Rate',   value: `${defectRate.toFixed(2)}%`,          sub: defectRate > 10 ? 'ABOVE THRESHOLD' : 'Within range', accent: defectRate > 10 ? C.red : C.green, bg: defectRate > 10 ? C.redL : C.greenL },
          { label: 'Quality Score', value: `${efficiency.toFixed(1)}%`,          sub: 'Inverse defect rate',   accent: efficiency >= 85 ? C.green : C.amber, bg: efficiency >= 85 ? C.greenL : C.amberL },
        ].forEach(({ label, value, sub, accent, bg }, i) => {
          kpiBox(doc, ML + i * (dk + 5), y, dk, 60, label, value, sub, accent, bg);
        });
        y += 76;

        y = sectionTitle(doc, 'Defect Distribution by Department', y);
        const defectRows2 = Object.entries(deptMap).sort((a, b) => b[1].defects - a[1].defects).map(([dept, d]) => {
          const dr = d.units > 0 ? d.defects / d.units * 100 : 0;
          return [dept, d.defects.toLocaleString('en-IN'), d.units.toLocaleString('en-IN'), `${dr.toFixed(2)}%`, dr > 10 ? 'HIGH RISK' : dr > 5 ? 'MODERATE' : 'LOW RISK'];
        });
        const rEnd = drawTable(doc, ML, y, [
          { label: 'Department',  width: 124, bold: true, color: () => C.h2  },
          { label: 'Defects',     width: 74,  mono: true, color: () => C.red },
          { label: 'Total Units', width: 82,  mono: true, color: () => C.muted },
          { label: 'Defect Rate', width: 76,  color: (v) => parseFloat(v) > 10 ? C.red : parseFloat(v) > 5 ? C.amber : C.green },
          { label: 'Risk Level',  width: 81,  color: (v) => v === 'HIGH RISK' ? C.red : v === 'MODERATE' ? C.amber : C.green },
        ], defectRows2);

        y = rEnd + 16;
        if (y < H - 160) {
          y = sectionTitle(doc, 'Identified Risks', y);
          bulletList(doc, risks, ML, y);
        }

        /* ── PAGE 9 — AI STRATEGIC INSIGHTS ─────────────────────── */
        newPage();
        y = 58;
        y = sectionTitle(doc, '08  AI Strategic Insights', y);

        // AI badge
        doc.rect(ML, y, 220, 20).fill(C.blueL).strokeColor(C.indigoL).lineWidth(0.5).stroke();
        doc.rect(ML, y, 4, 20).fill(C.indigo);
        doc.fillColor(C.indigo).fontSize(7.5).font('Helvetica-Bold')
           .text('AI-GENERATED  ·  GROQ  ·  llama-3.1-8b-instant', ML + 12, y + 6);
        y += 28;

        // Outlook
        doc.rect(ML, y, CW, 60).fill(C.purpleL).strokeColor(C.purple).lineWidth(0.5).stroke();
        doc.rect(ML, y, 4, 60).fill(C.purple);
        doc.fillColor(C.purple).fontSize(8).font('Helvetica-Bold').text('EXECUTIVE OUTLOOK', ML + 12, y + 8);
        doc.fillColor(C.h2).fontSize(9.5).font('Helvetica')
           .text(ai.outlook ?? '', ML + 12, y + 22, { width: CW - 24 });
        y += 72;

        y = sectionTitle(doc, 'Identified Strengths', y);
        y = bulletList(doc, ai.strengths ?? [], ML, y);
        y += 10;

        y = sectionTitle(doc, 'Strategic Recommendations', y);
        (ai.recommendations ?? []).forEach((rec, i) => {
          if (y > H - 80) { newPage(); y = 58; }
          y = recCard(doc, i + 1, rec, ML, y);
        });

        /* ── CLOSING PAGE ─────────────────────────────────────────── */
        newPage();
        const cy2 = H / 2 - 60;

        // Closing card
        doc.rect(ML + 40, cy2 - 24, CW - 80, 120).fill(C.bg).strokeColor(C.border).lineWidth(0.5).stroke();
        doc.rect(ML + 40, cy2 - 24, 4, 120).fill(C.indigo);

        doc.fillColor(C.indigo).fontSize(9).font('Helvetica-Bold')
           .text('REPORT COMPLETE', ML + 40, cy2 - 12, { align: 'center', width: CW - 80 });
        doc.fillColor(C.h1).fontSize(22).font('Helvetica-Bold')
           .text('End of Report', ML + 40, cy2 + 8, { align: 'center', width: CW - 80 });
        doc.fillColor(C.muted).fontSize(9.5).font('Helvetica')
           .text(`Total pages: ${pg}  ·  ${generatedAt}`, ML + 40, cy2 + 40, { align: 'center', width: CW - 80 });
        doc.fillColor(C.faint).fontSize(8.5).font('Helvetica')
           .text('Auto-generated by FactoryFlow DBMS Intelligence Platform using live production data and AI analytics.', ML + 40, cy2 + 60, { align: 'center', width: CW - 80 });

        doc.end();
      } catch (innerErr) {
        reject(innerErr);
      }
    });
  } catch (err) {
    console.error('PDF export error:', err);
    return new Response(JSON.stringify({ error: `Report generation failed: ${err.message}` }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
