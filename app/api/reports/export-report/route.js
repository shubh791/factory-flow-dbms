import prisma from '@/lib/prisma';
import PDFDocument from 'pdfkit';
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/* ── Palette ──────────────────────────────────────────────────────────── */
const P = {
  indigo:  '#6366f1',
  indigoL: '#818cf8',
  dark:    '#0c0c0f',
  dark2:   '#111116',
  card:    '#17171c',
  card2:   '#1f1f28',
  border:  '#2c2c38',
  t1:      '#f0f0f4',
  t2:      '#9090a4',
  t3:      '#54546a',
  green:   '#10b981',
  red:     '#f43f5e',
  amber:   '#f59e0b',
  purple:  '#a855f7',
  teal:    '#14b8a6',
};

/* ── Page header / footer ──────────────────────────────────────────────── */
function pageHeader(doc, pageNum) {
  doc.rect(0, 0, doc.page.width, 44).fill(P.dark2);
  doc.moveTo(0, 44).lineTo(doc.page.width, 44).strokeColor(P.indigo).lineWidth(1.5).stroke();
  doc.fillColor(P.indigoL).fontSize(7).font('Helvetica-Bold')
     .text('FACTORYFLOW DBMS  ·  INDUSTRIAL INTELLIGENCE REPORT', 42, 17, { width: 380 });
  doc.fillColor(P.t3).fontSize(7).font('Helvetica')
     .text(`Page ${pageNum}`, 0, 17, { width: doc.page.width - 42, align: 'right' });
}

function pageFooter(doc, generatedAt) {
  const fy = doc.page.height - 28;
  doc.moveTo(40, fy).lineTo(doc.page.width - 40, fy).strokeColor(P.border).lineWidth(0.5).stroke();
  doc.fillColor(P.t3).fontSize(6.5).font('Helvetica')
     .text(`Generated: ${generatedAt}  ·  Confidential — Internal Use Only`, 40, fy + 7, { width: 300 })
     .text('FactoryFlow DBMS Platform  v2.0', 0, fy + 7, { width: doc.page.width - 40, align: 'right' });
}

/* ── Section title ─────────────────────────────────────────────────────── */
function sectionTitle(doc, title, y) {
  doc.rect(40, y, 3, 20).fill(P.indigo);
  doc.fillColor(P.t1).fontSize(12).font('Helvetica-Bold').text(title, 50, y + 3);
  doc.moveTo(40, y + 24).lineTo(doc.page.width - 40, y + 24).strokeColor(P.border).lineWidth(0.5).stroke();
  return y + 34;
}

/* ── KPI box ───────────────────────────────────────────────────────────── */
function kpiBox(doc, x, y, w, h, label, value, sub, accent) {
  doc.rect(x, y, w, h).fill(P.card);
  doc.rect(x, y, 3, h).fill(accent);
  doc.fillColor(P.t3).fontSize(7).font('Helvetica-Bold')
     .text(label.toUpperCase(), x + 10, y + 8, { width: w - 16 });
  doc.fillColor(P.t1).fontSize(14).font('Helvetica-Bold')
     .text(value, x + 10, y + 20, { width: w - 16 });
  if (sub) {
    doc.fillColor(P.t3).fontSize(7).font('Helvetica')
       .text(sub, x + 10, y + 38, { width: w - 16 });
  }
}

/* ── Table ─────────────────────────────────────────────────────────────── */
function drawTable(doc, startX, startY, columns, rows) {
  const totalW = columns.reduce((s, c) => s + c.width, 0);
  const rowH   = 20;

  // Header row
  doc.rect(startX, startY, totalW, 22).fill(P.card2);
  let cx = startX;
  columns.forEach((col) => {
    doc.fillColor(P.indigoL).fontSize(7).font('Helvetica-Bold')
       .text(col.label.toUpperCase(), cx + 6, startY + 7, { width: col.width - 8 });
    cx += col.width;
  });

  // Data rows
  let ry = startY + 22;
  rows.forEach((row, ri) => {
    doc.rect(startX, ry, totalW, rowH).fill(ri % 2 === 0 ? '#0f0f14' : P.card);
    cx = startX;
    row.forEach((cell, ci) => {
      const col   = columns[ci];
      const color = col.color ? col.color(cell) : P.t2;
      const font  = col.bold ? 'Helvetica-Bold' : (col.mono ? 'Courier' : 'Helvetica');
      doc.fillColor(color).fontSize(col.mono ? 8 : 9).font(font)
         .text(String(cell ?? '—'), cx + 6, ry + 5, { width: col.width - 10, ellipsis: true });
      cx += col.width;
    });
    ry += rowH;
  });

  doc.moveTo(startX, ry).lineTo(startX + totalW, ry).strokeColor(P.border).lineWidth(0.5).stroke();
  return ry;
}

/* ── Bullet list ───────────────────────────────────────────────────────── */
function bulletList(doc, items, x, startY) {
  let y = startY;
  const W = doc.page.width - x - 56;
  items.forEach((item) => {
    doc.circle(x + 3, y + 5, 2.5).fill(P.indigo);
    doc.fillColor(P.t2).fontSize(9).font('Helvetica').text(String(item), x + 12, y, { width: W });
    const h = doc.heightOfString(String(item), { width: W });
    y += Math.max(h, 12) + 5;
  });
  return y;
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
      prisma.promotionHistory.findMany({ orderBy: { promotedAt: 'desc' }, take: 20,
        include: { employee: { select: { name: true } }, oldRole: { select: { title: true } }, newRole: { select: { title: true } } } }),
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

    /* ── Top producers per employee ───────────────────────────────── */
    const empProdMap = {};
    productions.forEach((p) => {
      const id = p.employee?.id;
      if (!id) return;
      if (!empProdMap[id]) empProdMap[id] = { name: p.employee.name ?? '—', dept: p.employee.department?.name ?? '—', units: 0, defects: 0, role: p.employee.role?.title ?? '—' };
      empProdMap[id].units   += p.units   ?? 0;
      empProdMap[id].defects += p.defects ?? 0;
    });
    const topProducerRows = Object.values(empProdMap)
      .sort((a, b) => b.units - a.units)
      .slice(0, 15)
      .map((e, i) => [
        String(i + 1),
        e.name,
        e.dept,
        e.role,
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
    const doc  = new PDFDocument({ size: 'A4', margins: { top: 58, left: 40, right: 40, bottom: 46 } });
    const bufs = [];
    doc.on('data', (b) => bufs.push(b));
    let pg = 0;

    function addPage() {
      if (pg > 0) doc.addPage();
      pg++;
      // Draw dark background first so content and footer render on top
      doc.rect(0, 44, doc.page.width, doc.page.height - 44).fill(P.dark);
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
        doc.rect(0, 0, doc.page.width, doc.page.height).fill(P.dark);
        doc.rect(0, 0, 5, doc.page.height).fill(P.indigo);
        // Subtle grid pattern
        for (let gx = 20; gx < doc.page.width; gx += 24)
          doc.moveTo(gx, 0).lineTo(gx, doc.page.height).strokeColor('#ffffff').opacity(0.015).lineWidth(0.5).stroke();
        doc.opacity(1);

        // Logo circle
        doc.circle(doc.page.width / 2, 190, 44).fill(P.dark2);
        doc.circle(doc.page.width / 2, 190, 44).strokeColor(P.indigo).lineWidth(2).stroke();
        doc.fillColor(P.indigoL).fontSize(18).font('Helvetica-Bold')
           .text('FF', doc.page.width / 2 - 11, 180);

        doc.fillColor(P.t1).fontSize(24).font('Helvetica-Bold')
           .text('Industrial Executive Report', 60, 255, { align: 'center', width: doc.page.width - 120 });
        doc.fillColor(P.t2).fontSize(11).font('Helvetica')
           .text('FactoryFlow DBMS Intelligence Platform', 60, 287, { align: 'center', width: doc.page.width - 120 });

        doc.moveTo(100, 314).lineTo(doc.page.width - 100, 314).strokeColor(P.border).lineWidth(1).stroke();

        // Meta grid (2×3)
        const metaItems = [
          ['Report Date', reportDate],
          ['Employees', String(employees.length)],
          ['Departments', String(departments.length)],
          ['Production Records', productions.length.toLocaleString('en-IN')],
          ['Efficiency', `${efficiency.toFixed(2)}%`],
          ['Report Version', 'v2.0 — AI Enhanced'],
        ];
        metaItems.forEach(([k, v], i) => {
          const col = i % 2, row = Math.floor(i / 2);
          const bx = 80 + col * 215, by = 328 + row * 52;
          doc.rect(bx, by, 200, 44).fill(P.card);
          doc.rect(bx, by, 2, 44).fill(P.indigo);
          doc.fillColor(P.t3).fontSize(7).font('Helvetica-Bold').text(k.toUpperCase(), bx + 9, by + 8);
          doc.fillColor(P.t1).fontSize(13).font('Helvetica-Bold').text(v, bx + 9, by + 20);
        });

        doc.fillColor(P.t3).fontSize(7.5).font('Helvetica')
           .text('Confidential — Internal Use Only · All data sourced from live DBMS', 60, doc.page.height - 52, { align: 'center', width: doc.page.width - 120 });
        pageFooter(doc, generatedAt);

        /* ── PAGE 2 — EXECUTIVE KPI SUMMARY ─────────────────────── */
        addPage();
        let y = 60;
        y = sectionTitle(doc, '01 · Executive KPI Summary', y);

        const kw = (doc.page.width - 80 - 10) / 3;
        const kh = 54;
        const kpis = [
          { label: 'Total Units Produced',   value: totalUnits.toLocaleString('en-IN'),   sub: `${productions.length} records`,              accent: P.green  },
          { label: 'Total Defective Units',   value: totalDefects.toLocaleString('en-IN'), sub: `${defectRate.toFixed(2)}% defect rate`,       accent: P.red    },
          { label: 'Operational Efficiency',  value: `${efficiency.toFixed(2)}%`,          sub: 'Units − Defects / Units',                    accent: P.indigo },
          { label: 'Gross Revenue',           value: `₹${totalRevenue.toLocaleString('en-IN')}`, sub: 'Total output value',                   accent: P.purple },
          { label: 'Gross Profit',            value: `₹${grossProfit.toLocaleString('en-IN')}`,  sub: `${profitMargin.toFixed(1)}% margin`,   accent: P.amber  },
          { label: 'Total Employees',         value: String(employees.length),             sub: `${departments.length} depts · avg ${avgExp}y exp`, accent: P.teal },
        ];
        kpis.forEach(({ label, value, sub, accent }, i) => {
          kpiBox(doc, 40 + (i % 3) * (kw + 5), y + Math.floor(i / 3) * (kh + 8), kw, kh, label, value, sub, accent);
        });
        y += 2 * (kh + 8) + 14;

        // Status banner
        const sColor = efficiency >= 85 ? P.green : efficiency >= 70 ? P.amber : P.red;
        const sLabel = efficiency >= 85 ? 'EXCELLENT' : efficiency >= 70 ? 'MODERATE' : 'CRITICAL';
        const sText  = efficiency >= 85
          ? `Operations are performing excellently. Efficiency of ${efficiency.toFixed(1)}% reflects strong process control.`
          : efficiency >= 70
          ? `Moderate efficiency (${efficiency.toFixed(1)}%). QC improvements in underperforming departments recommended.`
          : `Critical level (${efficiency.toFixed(1)}%). Immediate operational review and corrective plans required.`;
        doc.rect(40, y, doc.page.width - 80, 42).fill(P.card);
        doc.rect(40, y, 3, 42).fill(sColor);
        doc.fillColor(sColor).fontSize(8).font('Helvetica-Bold').text(`STATUS: ${sLabel}`, 50, y + 8, { width: doc.page.width - 100 });
        doc.fillColor(P.t2).fontSize(8.5).font('Helvetica').text(sText, 50, y + 22, { width: doc.page.width - 96 });
        y += 56;

        // Defect rate visual bar
        const defW = doc.page.width - 80;
        doc.rect(40, y, defW, 14).fill(P.card2);
        const fillW = Math.min(defW, (defectRate / 100) * defW);
        if (fillW > 0) doc.rect(40, y, fillW, 14).fill(P.red);
        doc.fillColor(P.t3).fontSize(7).font('Helvetica-Bold')
           .text(`DEFECT RATE  ${defectRate.toFixed(2)}%`, 40, y + 16);

        /* ── PAGE 3 — MONTHLY TREND ──────────────────────────────── */
        addPage();
        y = 60;
        y = sectionTitle(doc, '02 · Monthly Production Trend', y);
        doc.fillColor(P.t2).fontSize(8.5).font('Helvetica')
           .text('Month-over-month production, defects, efficiency, and revenue from indexed records.', 40, y, { width: doc.page.width - 80 });
        y += 20;

        drawTable(doc, 40, y, [
          { label: 'Month',      width: 62,  bold: true,  color: () => P.t1  },
          { label: 'Units',      width: 68,  mono: true,  color: () => P.green  },
          { label: 'Defects',    width: 62,  mono: true,  color: () => P.red    },
          { label: 'Efficiency', width: 66,  color: (v) => parseFloat(v) >= 85 ? P.green : parseFloat(v) >= 70 ? P.amber : P.red },
          { label: 'Revenue',    width: 88,  mono: true,  color: () => P.purple },
          { label: 'Batches',    width: 52,  mono: true,  color: () => P.t2     },
        ], monthlyRows);

        /* ── PAGE 4 — PRODUCT BREAKDOWN ──────────────────────────── */
        addPage();
        y = 60;
        y = sectionTitle(doc, '03 · Product Performance Breakdown', y);
        doc.fillColor(P.t2).fontSize(8.5).font('Helvetica')
           .text(`Top ${productRows.length} products by units. Efficiency and revenue per product line.`, 40, y, { width: doc.page.width - 80 });
        y += 20;

        drawTable(doc, 40, y, [
          { label: 'Product',    width: 100, bold: true,  color: () => P.t1  },
          { label: 'Units',      width: 68,  mono: true,  color: () => P.green  },
          { label: 'Defects',    width: 60,  mono: true,  color: () => P.red    },
          { label: 'Efficiency', width: 64,  color: (v) => parseFloat(v) >= 85 ? P.green : parseFloat(v) >= 70 ? P.amber : P.red },
          { label: 'Revenue',    width: 82,  mono: true,  color: () => P.purple },
          { label: 'Batches',    width: 44,  mono: true,  color: () => P.t2     },
        ], productRows);

        /* ── PAGE 5 — DEPARTMENT PERFORMANCE ─────────────────────── */
        addPage();
        y = 60;
        y = sectionTitle(doc, '04 · Department Performance', y);
        doc.fillColor(P.t2).fontSize(8.5).font('Helvetica')
           .text('Department-level efficiency, headcount contribution, and revenue output.', 40, y, { width: doc.page.width - 80 });
        y += 20;

        const dEnd = drawTable(doc, 40, y, [
          { label: 'Department',  width: 100, bold: true, color: () => P.t1     },
          { label: 'Employees',   width: 62,  mono: true, color: () => P.indigoL },
          { label: 'Units',       width: 68,  mono: true, color: () => P.green  },
          { label: 'Defects',     width: 58,  mono: true, color: () => P.red    },
          { label: 'Efficiency',  width: 64,  color: (v) => parseFloat(v) >= 85 ? P.green : parseFloat(v) >= 70 ? P.amber : P.red },
          { label: 'Revenue',     width: 66,  mono: true, color: () => P.purple },
        ], deptRows);

        // Best / worst dept callouts
        const sortedDepts = Object.entries(deptMap)
          .filter(([, d]) => d.units > 0)
          .sort((a, b) => ((b[1].units - b[1].defects) / b[1].units) - ((a[1].units - a[1].defects) / a[1].units));
        if (sortedDepts.length >= 2) {
          const [bestName, bestD]   = sortedDepts[0];
          const [worstName, worstD] = sortedDepts[sortedDepts.length - 1];
          const bEff = ((bestD.units  - bestD.defects)  / bestD.units  * 100).toFixed(1);
          const wEff = ((worstD.units - worstD.defects) / worstD.units * 100).toFixed(1);
          const hw   = (doc.page.width - 88) / 2;
          const cy   = dEnd + 16;
          if (cy < doc.page.height - 80) {
            doc.rect(40, cy, hw, 42).fill(P.card); doc.rect(40, cy, 3, 42).fill(P.green);
            doc.fillColor(P.green).fontSize(7).font('Helvetica-Bold').text('TOP PERFORMING', 50, cy + 8);
            doc.fillColor(P.t1).fontSize(12).font('Helvetica-Bold').text(bestName, 50, cy + 19);
            doc.fillColor(P.t3).fontSize(7.5).font('Helvetica').text(`${bEff}% efficiency`, 50, cy + 32);
            doc.rect(40 + hw + 8, cy, hw, 42).fill(P.card); doc.rect(40 + hw + 8, cy, 3, 42).fill(P.red);
            doc.fillColor(P.red).fontSize(7).font('Helvetica-Bold').text('NEEDS ATTENTION', 50 + hw + 8, cy + 8);
            doc.fillColor(P.t1).fontSize(12).font('Helvetica-Bold').text(worstName, 50 + hw + 8, cy + 19);
            doc.fillColor(P.t3).fontSize(7.5).font('Helvetica').text(`${wEff}% efficiency`, 50 + hw + 8, cy + 32);
          }
        }

        /* ── PAGE 6 — WORKFORCE ───────────────────────────────────── */
        addPage();
        y = 60;
        y = sectionTitle(doc, '05 · Workforce & Employee Analytics', y);

        const wk = (doc.page.width - 80 - 10) / 4;
        [
          { label: 'Total Workforce', value: String(employees.length),  sub: 'All employees',       accent: P.indigo },
          { label: 'Active',          value: String(activeCount),        sub: 'Currently active',    accent: P.green  },
          { label: 'Avg Experience',  value: `${avgExp} yrs`,           sub: 'Across all roles',    accent: P.teal   },
          { label: 'Active Roles',    value: String(roles.length),       sub: 'Hierarchy levels',    accent: P.purple },
        ].forEach(({ label, value, sub, accent }, i) => {
          kpiBox(doc, 40 + i * (wk + 4), y, wk - 1, 52, label, value, sub, accent);
        });
        y += 68;

        y = sectionTitle(doc, 'Headcount by Department', y);
        const eEnd = drawTable(doc, 40, y, [
          { label: 'Department',     width: 200, bold: true, color: () => P.t1     },
          { label: 'Headcount',      width: 100, mono: true, color: () => P.indigoL },
          { label: '% of Workforce', width: 100, color: () => P.t2                 },
        ], employeeRows);
        y = eEnd + 20;

        // Promotions
        if (promotions.length > 0 && y < doc.page.height - 100) {
          y = sectionTitle(doc, `Recent Promotions (${promotions.length} total)`, y);
          promotions.slice(0, 5).forEach((p) => {
            doc.circle(46, y + 5, 2).fill(P.purple);
            const txt = `${p.employee?.name ?? 'Unknown'}  ·  ${p.oldRole?.title ?? '?'} → ${p.newRole?.title ?? '?'}  ·  ${new Date(p.promotedAt).toLocaleDateString('en-IN')}`;
            doc.fillColor(P.t2).fontSize(8.5).font('Helvetica').text(txt, 54, y, { width: doc.page.width - 96 });
            y += 16;
          });
        }

        /* ── PAGE 6b — TOP EMPLOYEE PRODUCERS ────────────────────── */
        addPage();
        y = 60;
        y = sectionTitle(doc, '05b · Top Employee Producers', y);
        doc.fillColor(P.t2).fontSize(8.5).font('Helvetica')
           .text('Employees ranked by total units produced. Includes defect rate and department.', 40, y, { width: doc.page.width - 80 });
        y += 20;

        drawTable(doc, 40, y, [
          { label: '#',           width: 24,  mono: true, color: () => P.t3      },
          { label: 'Employee',    width: 90,  bold: true, color: () => P.t1      },
          { label: 'Department',  width: 80,  color: () => P.t2                  },
          { label: 'Role',        width: 70,  color: () => P.t2                  },
          { label: 'Units',       width: 60,  mono: true, color: () => P.green   },
          { label: 'Defects',     width: 50,  mono: true, color: () => P.red     },
          { label: 'Efficiency',  width: 60,  color: (v) => parseFloat(v) >= 90 ? P.green : parseFloat(v) >= 75 ? P.amber : P.red },
        ], topProducerRows);

        /* ── PAGE 7 — FINANCIAL SUMMARY ──────────────────────────── */
        addPage();
        y = 60;
        y = sectionTitle(doc, '06 · Financial Summary', y);

        const fk = (doc.page.width - 80 - 10) / 3;
        [
          { label: 'Gross Revenue', value: `₹${totalRevenue.toLocaleString('en-IN')}`, sub: 'Total output value', accent: P.green  },
          { label: 'Total Cost',    value: `₹${totalCost.toLocaleString('en-IN')}`,    sub: 'Production cost',   accent: P.red    },
          { label: 'Gross Profit',  value: `₹${grossProfit.toLocaleString('en-IN')}`,  sub: `${profitMargin.toFixed(1)}% margin`, accent: P.amber },
        ].forEach(({ label, value, sub, accent }, i) => {
          kpiBox(doc, 40 + i * (fk + 5), y, fk, 54, label, value, sub, accent);
        });
        y += 70;

        y = sectionTitle(doc, 'Revenue by Department', y);
        drawTable(doc, 40, y, [
          { label: 'Department',    width: 150, bold: true, color: () => P.t1    },
          { label: 'Revenue',       width: 110, mono: true, color: () => P.green },
          { label: 'Revenue Share', width: 80,  color: () => P.amber             },
          { label: 'Units',         width: 78,  mono: true, color: () => P.t2   },
        ], Object.entries(deptMap).sort((a, b) => b[1].revenue - a[1].revenue).map(([dept, d]) => [
          dept,
          `₹${d.revenue.toLocaleString('en-IN')}`,
          `${totalRevenue > 0 ? (d.revenue / totalRevenue * 100).toFixed(1) : 0}%`,
          d.units.toLocaleString('en-IN'),
        ]));

        /* ── PAGE 8 — DEFECT & RISK ──────────────────────────────── */
        addPage();
        y = 60;
        y = sectionTitle(doc, '07 · Defect & Quality Risk Analysis', y);

        const dk = (doc.page.width - 80 - 10) / 3;
        [
          { label: 'Total Defects', value: totalDefects.toLocaleString('en-IN'), sub: 'Defective units', accent: P.red },
          { label: 'Defect Rate',   value: `${defectRate.toFixed(2)}%`, sub: defectRate > 10 ? 'ABOVE THRESHOLD' : 'Within range', accent: defectRate > 10 ? P.red : P.green },
          { label: 'Quality Score', value: `${efficiency.toFixed(1)}%`, sub: 'Inverse defect rate', accent: efficiency >= 85 ? P.green : P.amber },
        ].forEach(({ label, value, sub, accent }, i) => {
          kpiBox(doc, 40 + i * (dk + 5), y, dk, 54, label, value, sub, accent);
        });
        y += 70;

        y = sectionTitle(doc, 'Defect Distribution by Department', y);
        const defectRows2 = Object.entries(deptMap).sort((a, b) => b[1].defects - a[1].defects).map(([dept, d]) => {
          const dr = d.units > 0 ? d.defects / d.units * 100 : 0;
          return [dept, d.defects.toLocaleString('en-IN'), d.units.toLocaleString('en-IN'), `${dr.toFixed(2)}%`, dr > 10 ? 'HIGH RISK' : dr > 5 ? 'MODERATE' : 'LOW RISK'];
        });
        const rEnd = drawTable(doc, 40, y, [
          { label: 'Department',  width: 120, bold: true, color: () => P.t1   },
          { label: 'Defects',     width: 72,  mono: true, color: () => P.red  },
          { label: 'Total Units', width: 80,  mono: true, color: () => P.t2   },
          { label: 'Defect Rate', width: 72,  color: (v) => parseFloat(v) > 10 ? P.red : parseFloat(v) > 5 ? P.amber : P.green },
          { label: 'Risk Level',  width: 74,  color: (v) => v === 'HIGH RISK' ? P.red : v === 'MODERATE' ? P.amber : P.green },
        ], defectRows2);

        y = rEnd + 16;
        if (y < doc.page.height - 150) {
          y = sectionTitle(doc, 'Identified Risks', y);
          bulletList(doc, risks, 40, y);
        }

        /* ── PAGE 9 — AI STRATEGIC INSIGHTS ─────────────────────── */
        addPage();
        y = 60;
        y = sectionTitle(doc, '08 · AI Strategic Insights', y);

        // AI badge
        doc.rect(40, y, 220, 18).fill(P.card2);
        doc.rect(40, y, 3, 18).fill(P.indigo);
        doc.fillColor(P.indigoL).fontSize(7).font('Helvetica-Bold')
           .text('AI-GENERATED VIA GROQ  ·  llama-3.1-8b-instant', 48, y + 5);
        y += 26;

        // Outlook box
        doc.rect(40, y, doc.page.width - 80, 54).fill(P.card);
        doc.rect(40, y, 3, 54).fill(P.purple);
        doc.fillColor(P.purple).fontSize(7.5).font('Helvetica-Bold').text('EXECUTIVE OUTLOOK', 50, y + 8);
        doc.fillColor(P.t2).fontSize(9).font('Helvetica').text(ai.outlook ?? '', 50, y + 22, { width: doc.page.width - 100 });
        y += 66;

        y = sectionTitle(doc, 'Identified Strengths', y);
        y = bulletList(doc, ai.strengths ?? [], 40, y);
        y += 10;

        y = sectionTitle(doc, 'Strategic Recommendations', y);
        (ai.recommendations ?? []).forEach((rec, i) => {
          if (y > doc.page.height - 72) {
            addPage();
            y = 60;
          }
          doc.rect(40, y, doc.page.width - 80, 34).fill(P.card);
          doc.rect(40, y, 3, 34).fill(P.indigo);
          doc.fillColor(P.indigoL).fontSize(8).font('Helvetica-Bold').text(String(i + 1).padStart(2, '0'), 50, y + 5);
          doc.fillColor(P.t2).fontSize(9).font('Helvetica').text(rec, 66, y + 5, { width: doc.page.width - 110 });
          y += 42;
        });

        /* ── CLOSING PAGE ─────────────────────────────────────────── */
        addPage();
        const cy2 = doc.page.height / 2 - 50;
        doc.rect(doc.page.width / 2 - 1, cy2 - 20, 2, 70).fill(P.indigo);
        doc.fillColor(P.t1).fontSize(18).font('Helvetica-Bold')
           .text('End of Report', 60, cy2 + 8, { align: 'center', width: doc.page.width - 120 });
        doc.fillColor(P.t3).fontSize(9).font('Helvetica')
           .text(`Total pages: ${pg}  ·  ${generatedAt}`, 60, cy2 + 34, { align: 'center', width: doc.page.width - 120 });
        doc.fillColor(P.t3).fontSize(8).font('Helvetica')
           .text('Auto-generated by FactoryFlow DBMS Intelligence Platform using live production data and AI analytics.', 80, cy2 + 54, { align: 'center', width: doc.page.width - 160 });

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
