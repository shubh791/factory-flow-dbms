import prisma from "../prisma/client.js";
import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

/*
==================================================
SYSTEM SUMMARY CONTROLLER
- Derives structured metrics from DB
- Sends structured summary to GROQ
- Returns AI-generated analytical interpretation
==================================================
*/

export const generateSystemSummary = async (req, res) => {
  try {
    // 1️⃣ Fetch DB metrics
    const employeeCount = await prisma.employee.count();
    const departmentCount = await prisma.department.count();
    const productionCount = await prisma.production.count();
    const defectSum = await prisma.production.aggregate({
      _sum: { defects: true }
    });
    const unitSum = await prisma.production.aggregate({
      _sum: { units: true }
    });

    const totalUnits = unitSum._sum.units || 0;
    const totalDefects = defectSum._sum.defects || 0;

    const efficiency =
      totalUnits > 0
        ? (((totalUnits - totalDefects) / totalUnits) * 100).toFixed(2)
        : 0;

    // 2️⃣ Structured summary object (No hallucination)
    const systemData = {
      employeeCount,
      departmentCount,
      productionRecords: productionCount,
      totalUnits,
      totalDefects,
      efficiency
    };

    // 3️⃣ AI Prompt
    const completion = await groq.chat.completions.create({
   model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content:
            "You are an industrial performance analyst. Provide professional insights based only on the provided structured data. Do not invent numbers."
        },
        {
          role: "user",
          content: `Analyze the following system data and provide summary, risks, and recommendations:\n${JSON.stringify(systemData, null, 2)}`
        }
      ],
      temperature: 0.3
    });

    const aiSummary = completion.choices[0]?.message?.content;

    res.json({
      metrics: systemData,
      analysis: aiSummary
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "System summary generation failed" });
  }
};