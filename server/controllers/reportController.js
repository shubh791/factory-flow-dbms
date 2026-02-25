import prisma from "../prisma/client.js";
import Groq from "groq-sdk";
import PDFDocument from "pdfkit";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export const generateReport = async (req, res) => {
  try {
    const dataset = await prisma.dataset.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    });

    if (!dataset) {
      return res.status(404).json({ error: "No dataset found" });
    }

    const rows = dataset.rows || [];

    /* ===== DASHBOARD CALCULATIONS ===== */

    let totalUnits = 0;
    let totalDefects = 0;
    const productMap = {};

    rows.forEach((r) => {
      const units = Number(r.units || r.Units || 0);
      const defects = Number(r.defects || r.Defects || 0);
      const product = r.product || r.Product || "Unknown";

      totalUnits += units;
      totalDefects += defects;

      if (!productMap[product]) {
        productMap[product] = { units: 0, defects: 0 };
      }

      productMap[product].units += units;
      productMap[product].defects += defects;
    });

    const efficiency =
      totalUnits > 0
        ? ((totalUnits - totalDefects) / totalUnits) * 100
        : 0;

    /* ===== AI INSIGHTS ===== */

    const prompt = `
You are a senior industrial production analyst.

Total Units Produced: ${totalUnits}
Total Defective Units: ${totalDefects}
Overall Efficiency: ${efficiency.toFixed(2)}%

Production Breakdown:
${JSON.stringify(productMap, null, 2)}

Generate a professional industrial executive report.
Be concise and specific.
`;

    const aiResponse = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: prompt }],
    });

    const aiInsights = aiResponse.choices[0].message.content;

    /* ===== CREATE PDF ===== */

    const doc = new PDFDocument({ margin: 50 });

    res.setHeader(
      "Content-Disposition",
      "attachment; filename=Industrial_Report.pdf"
    );
    res.setHeader("Content-Type", "application/pdf");

    doc.pipe(res);

    /* ===== PDF DESIGN ===== */

    doc.fontSize(22)
      .fillColor("#0f172a")
      .text("Industrial Analytics Report", {
        align: "center",
      });

    doc.moveDown(2);

    doc.fontSize(14)
      .fillColor("black")
      .text(`Total Units Produced: ${totalUnits}`);

    doc.text(`Total Defects: ${totalDefects}`);
    doc.text(`Overall Efficiency: ${efficiency.toFixed(2)}%`);

    doc.moveDown(2);

    doc.fontSize(16)
      .fillColor("#0f172a")
      .text("Production Breakdown");

    doc.moveDown();

    Object.entries(productMap).forEach(([name, data]) => {
      doc.fontSize(12)
        .fillColor("black")
        .text(`${name} → Units: ${data.units}, Defects: ${data.defects}`);
    });

    doc.moveDown(2);

    doc.fontSize(16)
      .fillColor("#0f172a")
      .text("AI Executive Insights");

    doc.moveDown();

    doc.fontSize(11)
      .fillColor("black")
      .text(aiInsights, {
        align: "left",
      });

    doc.end();
  } catch (err) {
    console.log("PDF ERROR:", err.response?.data || err);
    res.status(500).json({
      error: "Report generation failed",
    });
  }
};