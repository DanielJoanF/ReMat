/**
 * ReMat API Client
 * Base URL: NEXT_PUBLIC_API_URL
 * Auth stub: inject x-user-id + x-user-role dari localStorage
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

function getAuthHeaders() {
  if (typeof window === "undefined") return {};
  const userId = localStorage.getItem("remat_user_id") || "dummy-consumer-id";
  const userRole = localStorage.getItem("remat_user_role") || "CONSUMER";
  return {
    "x-user-id": userId,
    "x-user-role": userRole,
  };
}

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const headers = {
    "Content-Type": "application/json",
    ...getAuthHeaders(),
    ...options.headers,
  };

  const res = await fetch(url, { ...options, headers });

  // Handle rate limiting
  if (res.status === 429) {
    const error = new Error("Terlalu banyak permintaan. Silakan tunggu sebentar.");
    error.status = 429;
    throw error;
  }

  // Handle auth errors
  if (res.status === 401 || res.status === 403) {
    const error = new Error("Tidak memiliki akses. Silakan login kembali.");
    error.status = res.status;
    throw error;
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const error = new Error(body.message || "Terjadi kesalahan pada server.");
    error.status = res.status;
    throw error;
  }

  return res.json();
}

/** Parse envelope response */
function parseEnvelope(response) {
  return response?.data ?? response;
}

/** Parse paginated envelope */
function parsePaginated(response) {
  return {
    data: response?.data ?? [],
    pagination: response?.pagination ?? { page: 1, limit: 12, total: 0, totalPages: 1 },
  };
}

/** Parse AI search response */
function parseSearchResponse(response) {
  return {
    data: response?.data ?? [],
    searchType: response?.searchType ?? "keyword",
    message: response?.message ?? "",
    showAlert: response?.showAlert ?? false,
  };
}

// ─── API Methods ─────────────────────────────────────────────────────────────

export const api = {
  // Public
  getBanners: () => request("/banners").then(parseEnvelope),
  getCategories: () => request("/categories").then(parseEnvelope),

  // Materials
  getMaterials: (params = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v != null && v !== ""))
    ).toString();
    return request(`/materials${qs ? `?${qs}` : ""}`).then(parsePaginated);
  },
  getMaterialById: (id) => request(`/materials/${id}`).then(parseEnvelope),

  // AI Search
  searchMaterials: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/search?${qs}`).then(parseSearchResponse);
  },

  // Alerts
  createAlert: (data) =>
    request("/alerts", { method: "POST", body: JSON.stringify(data) }).then(parseEnvelope),
  getMyAlerts: () => request("/alerts/my").then(parseEnvelope),
  deactivateAlert: (id) =>
    request(`/alerts/${id}/deactivate`, { method: "PATCH" }).then(parseEnvelope),

  // Transactions
  createTransaction: (data) =>
    request("/transactions", { method: "POST", body: JSON.stringify(data) }).then(parseEnvelope),
  getMyTransactions: () => request("/transactions/my").then(parseEnvelope),
  getTransactionById: (id) => request(`/transactions/${id}`).then(parseEnvelope),
  receiveOrder: (id) => request(`/transactions/${id}/receive`, { method: "PATCH" }).then(parseEnvelope),
  cancelOrder: (id) => request(`/transactions/${id}/cancel`, { method: "PATCH" }).then(parseEnvelope),
  rateTransaction: (id, data) =>
    request(`/transactions/${id}/rate`, { method: "POST", body: JSON.stringify(data) }).then(parseEnvelope),

  // Chat
  sendChatMessage: (data) =>
    request("/chat", { method: "POST", body: JSON.stringify(data) }).then(parseEnvelope),
  getChatHistory: (conversationId) =>
    request(`/chat/${conversationId}`).then(parseEnvelope),
};

export default api;
