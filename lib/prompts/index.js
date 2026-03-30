/**
 * Modular AI prompt builders for FactoryFlow.
 * Each builder takes structured data and returns a focused prompt string.
 * Prompts are kept lean — the smaller the prompt, the faster the response.
 */

/* ── Context header ─────────────────────────────────────────────── */
export function systemContext(metrics) {
  return `You are FactoryFlow AI, an embedded industrial performance analyst.
Current system snapshot:
- Employees: ${metrics.employeeCount ?? '?'}
- Departments: ${metrics.departmentCount ?? '?'}
- Production records: ${metrics.productionRecords ?? '?'}
- Total units produced: ${metrics.totalUnits ?? '?'}
- Total defective units: ${metrics.totalDefects ?? '?'}
- Overall efficiency: ${metrics.efficiency ?? '?'}%
Always be concise, data-driven, and actionable.`;
}

/* ── Production prediction prompt ───────────────────────────────── */
export function productionPredictionPrompt(monthlyTrend, stats) {
  const last3 = monthlyTrend.slice(-3);
  return `Based on these last 3 months of production data:
${JSON.stringify(last3, null, 2)}

Overall stats: ${stats.totalUnits} total units, ${stats.totalDefects} defects, ${stats.efficiency?.toFixed(1)}% efficiency.

Predict next month's production. Return ONLY valid JSON (no markdown):
{
  "predictedUnits": <integer>,
  "predictedDefects": <integer>,
  "predictedEfficiency": <number 0-100>,
  "trend": "increasing" | "stable" | "declining",
  "confidence": <integer 0-100>,
  "reasoning": "<1-2 sentence explanation>"
}`;
}

/* ── Anomaly detection prompt ───────────────────────────────────── */
export function anomalyDetectionPrompt(records) {
  // Summarize records into daily buckets to keep prompt short
  const daily = {};
  records.forEach((r) => {
    const d = new Date(r.productionDate).toISOString().slice(0, 10);
    if (!daily[d]) daily[d] = { units: 0, defects: 0 };
    daily[d].units   += r.units   ?? 0;
    daily[d].defects += r.defects ?? 0;
  });
  const buckets = Object.entries(daily)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({
      date,
      defectRate: v.units > 0 ? ((v.defects / v.units) * 100).toFixed(1) : '0',
      units:      v.units,
    }));

  return `Analyze this daily production data for anomalies:
${JSON.stringify(buckets.slice(-30), null, 2)}

Return ONLY valid JSON (no markdown):
{
  "anomalies": [
    { "date": "<YYYY-MM-DD>", "type": "<spike|drop|outlier>", "severity": "<high|medium|low>", "detail": "<short explanation>" }
  ],
  "riskLevel": "low" | "medium" | "high" | "critical",
  "summary": "<1-2 sentence overall assessment>"
}`;
}

/* ── Workforce optimization prompt ──────────────────────────────── */
export function workforceOptimizationPrompt(deptStats, empCount) {
  return `Workforce data: ${empCount} employees.
Department performance:
${JSON.stringify(deptStats, null, 2)}

Provide workforce optimization recommendations. Return ONLY valid JSON (no markdown):
{
  "recommendations": ["<string>", ...],
  "topDept": "<name>",
  "underperformingDept": "<name>",
  "actionItems": ["<string>", ...]
}`;
}

/* ── System summary structured prompt ───────────────────────────── */
export function systemSummaryPrompt(metrics) {
  return `Analyze this industrial DBMS performance data:
${JSON.stringify(metrics, null, 2)}

Return ONLY valid JSON (no markdown, no extra text):
{
  "overallScore": <integer 0-100>,
  "strengths": ["<string>", ...],
  "risks": ["<string>", ...],
  "recommendations": ["<string>", ...]
}
Provide 3-4 strengths, 2-3 risks, 3-4 recommendations. Be specific to the numbers.`;
}

/* ── Interactive chat system prompt ─────────────────────────────── */
export function chatSystemPrompt(metrics) {
  return `You are FactoryFlow AI, an embedded industrial analytics assistant.
The user is an executive or plant manager using FactoryFlow DBMS.

Live system data:
- ${metrics.employeeCount} employees across ${metrics.departmentCount} departments
- ${metrics.productionRecords} production records | ${metrics.totalUnits?.toLocaleString()} total units
- ${metrics.totalDefects?.toLocaleString()} defects | Efficiency: ${metrics.efficiency}%

Answer questions concisely and professionally. Reference real numbers when relevant.
If asked to analyse, give structured bullet points.
Never fabricate data beyond what is provided.`;
}
