/**
 * @remat/ai-core — Prompt Builder for Dashboard Insights
 *
 * Constructs structured prompts for LLM narrative generation.
 * Enforces security guardrails (ARCHITECTURE.md §6.1):
 * - Delimited XML tags (<system_instructions>, <metrics_data>)
 * - Strict prohibition against inventing/modifying numeric figures
 */

/**
 * Build prompt for dashboard insight narrative.
 *
 * @param {object} metrics - Raw calculated metrics from Analytics Engine
 * @param {object} context - Additional metadata { role, companyName }
 * @returns {{ systemPrompt: string, userPrompt: string }}
 */
const buildDashboardInsightPrompt = (metrics, context = {}) => {
  const { role = "DISTRIBUTOR", companyName = "Perusahaan" } = context;

  const systemPrompt = `<system_instructions>
Anda adalah asisten AI resmi ReMat, platform kolaboratif ekonomi sirkular industri.
Tugas Anda adalah menyusun narasi insight eksekutif yang profesional, ringkas, dan persuasif (2-3 paragraf) berdasarkan data statistik yang disediakan.

ATURAN KETAT (SECURITY GUARDRAILS):
1. Anda HANYA boleh menggunakan angka-angka yang ada dalam data <metrics_data>.
2. DILARANG KERAS mengarang, mengubah, mengestimasi ulang, atau menambah angka bisnis baru.
3. Fokuskan narasi pada performa penjualan, tren material utama, status inventori, dan rekomendasi langkah strategis sirkular.
4. Gunakan Bahasa Indonesia yang ramah, profesional, dan berorientasi bisnis sirkular.
</system_instructions>`;

  const userPrompt = `<metrics_data>
Tipe Pengguna: ${role}
Nama Perusahaan: ${companyName}
Data Statistik Terhitung:
${JSON.stringify(metrics, null, 2)}
</metrics_data>

Berdasarkan data di atas, susunlah ringkasan narasi insight bisnis untuk dashboard ${companyName}.`;

  return { systemPrompt, userPrompt };
};

const buildCircularReportPrompt = (reportMetrics, context = {}) => {
  const { companyName = "Perusahaan", period = "Periode" } = context;

  const systemPrompt = `<system_instructions>
Anda adalah Spesialis Laporan Ekonomi Sirkular Resmi ReMat.
Tugas Anda adalah membuat ringkasan naratif eksekutif (2-3 paragraf) untuk Laporan Ekonomi Sirkular (Sustainability Report) perusahaan untuk periode ${period}.

ATURAN KETAT (SECURITY GUARDRAILS):
1. Anda HANYA boleh menggunakan angka-angka yang ada dalam data <report_metrics>.
2. DILARANG KERAS mengarang, mengubah, mengestimasi ulang, atau menambah angka numerik baru.
3. Soroti pencapaian utama: Total Limbah Terolah (kg), Penghematan Karbon (kg CO2e), Nilai Ekonomi (Rp), dan Skor Sirkular.
4. Gunakan Bahasa Indonesia formal dan ramah lingkungan yang cocok untuk laporan keberlanjutan korporat.
</system_instructions>`;

  const userPrompt = `<report_metrics>
Perusahaan: ${companyName}
Periode: ${period}
Metrik Terhitung:
${JSON.stringify(reportMetrics, null, 2)}
</report_metrics>

Berdasarkan metrik di atas, susunlah ringkasan eksekutif narasi Laporan Ekonomi Sirkular untuk ${companyName} periode ${period}.`;

  return { systemPrompt, userPrompt };
};

module.exports = {
  buildDashboardInsightPrompt,
  buildCircularReportPrompt
};
