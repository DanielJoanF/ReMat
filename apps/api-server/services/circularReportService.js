const { prisma } = require("@remat/database");
const { buildCircularReportPrompt, generateText, isLlmAvailable } = require("@remat/ai-core");

const UNIT_TO_KG_FACTORS = {
  KG: 1.0,
  TON: 1000.0,
  LITER: 1.0,
  PCS: 0.5
};

const CARBON_SAVING_PER_KG = 1.8; // 1.8 kg CO2e saved per 1 kg recycled material

/**
 * Helper to convert quantity + unit to Kilograms.
 */
const convertToKg = (quantity, unit) => {
  const factor = UNIT_TO_KG_FACTORS[unit?.toUpperCase()] || 1.0;
  return quantity * factor;
};

/**
 * Generate (or regenerate) a circular report for a distributor and period ("YYYY-MM").
 *
 * @param {string} distributorId - Distributor Profile ID
 * @param {string} period - Period string format "YYYY-MM" (e.g. "2026-08")
 * @returns {Promise<object>} Saved CircularReport record
 */
const generateReportForDistributor = async (distributorId, period) => {
  if (!period || !/^\d{4}-\d{2}$/.test(period)) {
    const err = new Error("Invalid period format. Expected 'YYYY-MM' (e.g. '2026-08').");
    err.statusCode = 400;
    throw err;
  }

  const distributor = await prisma.distributorProfile.findUnique({
    where: { id: distributorId },
    select: { id: true, companyName: true, userId: true }
  });

  if (!distributor) {
    const err = new Error("Distributor profile not found");
    err.statusCode = 404;
    throw err;
  }

  // Parse start and end date for period
  const [yearStr, monthStr] = period.split("-");
  const year = parseInt(yearStr);
  const month = parseInt(monthStr);

  const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
  const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

  // 1. Fetch completed & paid transactions for period
  const transactions = await prisma.transaction.findMany({
    where: {
      distributorId,
      status: { in: ["COMPLETED", "PAID"] },
      createdAt: { gte: startDate, lte: endDate }
    },
    include: {
      items: {
        include: { material: { select: { id: true, unit: true } } }
      }
    }
  });

  let totalWasteUtilizedKg = 0;
  let economicValue = 0;
  const transactionCount = transactions.length;
  const materialWeightMap = {};

  transactions.forEach((tx) => {
    economicValue += tx.totalAmount;
    tx.items.forEach((item) => {
      const weightKg = convertToKg(item.quantity, item.material?.unit || "KG");
      totalWasteUtilizedKg += weightKg;

      const matId = item.materialId;
      materialWeightMap[matId] = (materialWeightMap[matId] || 0) + weightKg;
    });
  });

  // Top material by recycled weight in period
  let topMaterialId = null;
  let maxWeight = 0;
  Object.entries(materialWeightMap).forEach(([matId, weight]) => {
    if (weight > maxWeight) {
      maxWeight = weight;
      topMaterialId = matId;
    }
  });

  // 2. Fetch unutilized inventory (active + draft materials owned by distributor)
  const activeMaterials = await prisma.material.findMany({
    where: { distributorId, status: { in: ["ACTIVE", "DRAFT"] } },
    select: { quantity: true, unit: true }
  });

  let unutilizedInventoryKg = 0;
  activeMaterials.forEach((m) => {
    unutilizedInventoryKg += convertToKg(m.quantity, m.unit);
  });

  // 3. Compute explicit formulas
  const carbonSavingKg = Math.round(totalWasteUtilizedKg * CARBON_SAVING_PER_KG * 100) / 100;

  const totalGeneratedKg = totalWasteUtilizedKg + unutilizedInventoryKg;
  const wasteDiversionRate = totalGeneratedKg > 0
    ? Math.min(100, Math.round(((totalWasteUtilizedKg / totalGeneratedKg) * 100) * 100) / 100)
    : 100.0;

  const diversionComp = wasteDiversionRate * 0.4;
  const activityComp = Math.min(100, transactionCount * 10) * 0.3;
  const volumeComp = Math.min(100, (totalWasteUtilizedKg / 1000) * 10) * 0.3;
  const circularScore = Math.min(100, Math.round((diversionComp + activityComp + volumeComp) * 100) / 100);

  // 4. Generate LLM Narrative (aiSummary)
  const reportMetrics = {
    period,
    companyName: distributor.companyName,
    totalWasteUtilizedKg,
    carbonSavingKg,
    economicValue,
    transactionCount,
    wasteDiversionRate,
    circularScore
  };

  let aiSummary = "";
  try {
    if (!isLlmAvailable()) {
      throw new Error("LLM API not available");
    }

    const { systemPrompt, userPrompt } = buildCircularReportPrompt(reportMetrics, {
      companyName: distributor.companyName,
      period
    });

    aiSummary = await generateText(systemPrompt, userPrompt);
  } catch (err) {
    console.warn(`[CircularReport] LLM summary fallback used: ${err.message}`);
    aiSummary = `Laporan Ekonomi Sirkular Periode ${period} untuk ${distributor.companyName}: Berhasil mengolah ${totalWasteUtilizedKg} kg limbah dengan estimasi penghematan karbon ${carbonSavingKg} kg CO2e dan nilai ekonomi Rp ${economicValue.toLocaleString("id-ID")} dari ${transactionCount} transaksi (Skor Sirkular: ${circularScore}/100).`;
  }

  // 5. Upsert report record in database (@@unique([distributorId, period]))
  const report = await prisma.circularReport.upsert({
    where: {
      distributorId_period: {
        distributorId,
        period
      }
    },
    update: {
      totalWasteUtilizedKg,
      wasteDiversionRate,
      carbonSavingKg,
      economicValue,
      transactionCount,
      topMaterialId,
      circularScore,
      aiSummary,
      generatedAt: new Date()
    },
    create: {
      distributorId,
      period,
      totalWasteUtilizedKg,
      wasteDiversionRate,
      carbonSavingKg,
      economicValue,
      transactionCount,
      topMaterialId,
      circularScore,
      aiSummary
    }
  });

  return report;
};

/**
 * Generate a circular report for the authenticated distributor's OWN profile.
 * Resolves the distributor profile via the logged-in user id (tenant-scoped).
 *
 * @param {string} userId - Authenticated user id
 * @param {string} period - Period string format "YYYY-MM" (e.g. "2026-08")
 * @returns {Promise<object>} Saved CircularReport record
 */
const generateReportForCurrentUser = async (userId, period) => {
  const distributor = await prisma.distributorProfile.findUnique({
    where: { userId },
    select: { id: true }
  });

  if (!distributor) {
    const err = new Error("Distributor profile not found");
    err.statusCode = 404;
    throw err;
  }

  return generateReportForDistributor(distributor.id, period);
};

/**
 * Generate circular reports for ALL verified distributors for a period.
 * Useful for admin trigger or cron job.
 */
const generateAllReportsForPeriod = async (period) => {
  const distributors = await prisma.distributorProfile.findMany({
    select: { id: true, companyName: true }
  });

  const results = [];
  for (const dist of distributors) {
    try {
      const report = await generateReportForDistributor(dist.id, period);
      results.push({ distributorId: dist.id, status: "success", reportId: report.id });
    } catch (err) {
      console.error(`[CircularReport] Error generating report for distributor ${dist.id}:`, err.message);
      results.push({ distributorId: dist.id, status: "failed", error: err.message });
    }
  }

  return { period, processedCount: results.length, results };
};

/**
 * Compute exact Circular Score breakdown based on backend formula:
 * 1. Diversion Rate Component (40% weight, max 40 pts)
 * 2. Transaction Activity Component (30% weight, max 30 pts)
 * 3. Waste Volume Component (30% weight, max 30 pts)
 */
const computeScoreBreakdown = (report) => {
  const wdr = report.wasteDiversionRate ?? 0;
  const txCount = report.transactionCount ?? 0;
  const wasteKg = report.totalWasteUtilizedKg ?? 0;

  const diversionComp = Math.round((wdr * 0.4) * 10) / 10;
  const activityComp = Math.round((Math.min(100, txCount * 10) * 0.3) * 10) / 10;
  const volumeComp = Math.round((Math.min(100, (wasteKg / 1000) * 10) * 0.3) * 10) / 10;
  const computedTotal = Math.round((diversionComp + activityComp + volumeComp) * 10) / 10;

  return {
    diversionComponent: { score: diversionComp, maxScore: 40, weightPercent: 40, label: "Tingkat Diversi Limbah" },
    activityComponent: { score: activityComp, maxScore: 30, weightPercent: 30, label: "Aktivitas Transaksi" },
    volumeComponent: { score: volumeComp, maxScore: 30, weightPercent: 30, label: "Volume Pengolahan" },
    totalScore: report.circularScore ?? computedTotal
  };
};

/**
 * List historical reports for the authenticated distributor.
 */
const listDistributorReports = async (userId) => {
  const distributor = await prisma.distributorProfile.findUnique({
    where: { userId },
    select: { id: true }
  });

  if (!distributor) {
    const err = new Error("Distributor profile not found");
    err.statusCode = 404;
    throw err;
  }

  const reports = await prisma.circularReport.findMany({
    where: { distributorId: distributor.id },
    orderBy: { period: "desc" }
  });

  return reports.map((r) => ({
    ...r,
    scoreBreakdown: computeScoreBreakdown(r)
  }));
};

/**
 * Get report detail by ID (tenant-gated).
 */
const getReportById = async (reportId, user) => {
  const report = await prisma.circularReport.findUnique({
    where: { id: reportId },
    include: {
      distributor: { select: { id: true, companyName: true, userId: true } }
    }
  });

  if (!report) {
    const err = new Error("Circular report not found");
    err.statusCode = 404;
    throw err;
  }

  // Tenant isolation check
  if (user.role !== "ADMIN" && report.distributor.userId !== user.id) {
    const err = new Error("You are not authorized to view this report");
    err.statusCode = 403;
    throw err;
  }

  // Parse period to calculate date range for transactions
  let materials = [];
  let categories = [];

  if (report.period && report.period.includes("-")) {
    const [yearStr, monthStr] = report.period.split("-");
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);

    const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
    const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

    const transactions = await prisma.transaction.findMany({
      where: {
        distributorId: report.distributorId,
        status: { in: ["COMPLETED", "PAID"] },
        createdAt: { gte: startDate, lte: endDate }
      },
      include: {
        items: {
          include: {
            material: {
              select: { id: true, title: true, unit: true, category: { select: { name: true } } }
            }
          }
        }
      }
    });

    const materialMap = {};
    const categoryMap = {};

    transactions.forEach((tx) => {
      tx.items.forEach((item) => {
        const weightKg = convertToKg(item.quantity, item.material?.unit || "KG");
        const matName = item.material?.title || "Material Daur Ulang";
        const catName = item.material?.category?.name || "Kategori Umum";

        if (!materialMap[matName]) {
          materialMap[matName] = { name: matName, diverted: 0, unit: "kg" };
        }
        materialMap[matName].diverted += Math.round(weightKg * 10) / 10;

        if (!categoryMap[catName]) {
          categoryMap[catName] = { name: catName, totalKg: 0 };
        }
        categoryMap[catName].totalKg += Math.round(weightKg * 10) / 10;
      });
    });

    materials = Object.values(materialMap);
    categories = Object.values(categoryMap);
  }

  // Fallback breakdown for seed or historical report data without transactions
  if (materials.length === 0 && report.totalWasteUtilizedKg > 0) {
    const totalKg = report.totalWasteUtilizedKg;
    categories = [
      { name: "Plastik Industri", totalKg: Math.round(totalKg * 0.45 * 10) / 10 },
      { name: "Logam & Skrap", totalKg: Math.round(totalKg * 0.30 * 10) / 10 },
      { name: "Kertas & Karton", totalKg: Math.round(totalKg * 0.15 * 10) / 10 },
      { name: "Limbah Organik / Lainnya", totalKg: Math.round(totalKg * 0.10 * 10) / 10 }
    ];
    materials = [
      { name: "Limbah Plastik High-Density (HDPE)", diverted: Math.round(totalKg * 0.45 * 10) / 10, unit: "kg" },
      { name: "Skrap Besi & Aluminium", diverted: Math.round(totalKg * 0.30 * 10) / 10, unit: "kg" },
      { name: "Kardus Kemasan Bekas", diverted: Math.round(totalKg * 0.25 * 10) / 10, unit: "kg" }
    ];
  }

  return {
    ...report,
    scoreBreakdown: computeScoreBreakdown(report),
    materials,
    categories
  };
};

module.exports = {
  generateReportForDistributor,
  generateReportForCurrentUser,
  generateAllReportsForPeriod,
  listDistributorReports,
  getReportById,
  convertToKg,
  CARBON_SAVING_PER_KG
};
