/**
 * Dashboard Insight Service — Orchestrates Analytics Engine & LLM Narration
 *
 * Architecture (ARCHITECTURE.md §3.2, AGENT.md §4):
 *   Database -> Analytics Engine (pure SQL numbers) -> Prompt Builder -> LLM -> Narrative
 *
 * Fallback (ARCHITECTURE.md §5, Scenario #1):
 *   If LLM API fails/times out, return calculated metrics cleanly with aiSummary: null
 *   without breaking the dashboard response.
 */
const analyticsService = require("./analyticsService");
const { buildDashboardInsightPrompt, generateText, isLlmAvailable } = require("@remat/ai-core");

/**
 * Get dashboard metrics + AI narration for a user.
 *
 * @param {object} user - Authenticated user context { id, role }
 * @returns {Promise<object>} { metrics, aiSummary, fallbackMessage? }
 */
const getDashboardInsight = async (user) => {
  // 1. Fetch pure SQL calculated metrics (Tenant Isolated)
  let metrics;
  if (user.role === "ADMIN") {
    metrics = await analyticsService.getAdminMetrics();
  } else if (user.role === "DISTRIBUTOR") {
    metrics = await analyticsService.getDistributorMetrics(user.id);
  } else {
    const err = new Error("Only DISTRIBUTOR and ADMIN can access dashboard insights");
    err.statusCode = 403;
    throw err;
  }

  // 2. Try LLM narrative generation
  let aiSummary = null;
  let fallbackMessage = null;

  try {
    if (!isLlmAvailable()) {
      throw new Error("LLM API not configured");
    }

    const { systemPrompt, userPrompt } = buildDashboardInsightPrompt(metrics, {
      role: user.role,
      companyName: metrics.companyName
    });

    aiSummary = await generateText(systemPrompt, userPrompt);
  } catch (err) {
    console.warn(`[DashboardInsight] LLM narration skipped/failed: ${err.message}`);
    fallbackMessage = "Narasi AI sedang dalam pemeliharaan, menampilkan data statistik mentah.";
  }

  return {
    metrics,
    aiSummary,
    fallbackMessage
  };
};

module.exports = {
  getDashboardInsight
};
