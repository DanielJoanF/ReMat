/**
 * StatusBadge — Dynamic status pill component
 * Supports material statuses and transaction statuses
 */

const STATUS_CONFIG = {
  // Material statuses
  draft: { label: "Draft", bg: "bg-gray-100", text: "text-gray-600", dot: "bg-gray-400" },
  pending_review: { label: "Review", bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-400" },
  active: { label: "Aktif", bg: "bg-green-50", text: "text-green-700", dot: "bg-green-500" },
  rejected: { label: "Ditolak", bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500" },
  sold_out: { label: "Habis", bg: "bg-gray-900", text: "text-white", dot: "bg-gray-400" },

  // Transaction statuses
  pending: { label: "Dibuat", bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-400" },
  confirmed: { label: "Dikonfirmasi", bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
  paid: { label: "Dibayar", bg: "bg-indigo-50", text: "text-indigo-700", dot: "bg-indigo-500" },
  shipped: { label: "Dikirim", bg: "bg-purple-50", text: "text-purple-700", dot: "bg-purple-500" },
  completed: { label: "Selesai", bg: "bg-green-50", text: "text-green-700", dot: "bg-green-500" },
  cancelled: { label: "Dibatalkan", bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500" },

  // Payment statuses
  success: { label: "Berhasil", bg: "bg-green-50", text: "text-green-700", dot: "bg-green-500" },
  failed: { label: "Gagal", bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500" },
  refunded: { label: "Refund", bg: "bg-orange-50", text: "text-orange-700", dot: "bg-orange-500" },
};

const SIZE_CONFIG = {
  sm: "text-xs px-2 py-0.5",
  md: "text-xs px-2.5 py-1",
  lg: "text-sm px-3 py-1.5",
};

export default function StatusBadge({ status, size = "md", className = "" }) {
  const key = (status || "").toLowerCase().replace(" ", "_");
  const config = STATUS_CONFIG[key] || {
    label: status || "Unknown",
    bg: "bg-gray-100",
    text: "text-gray-600",
    dot: "bg-gray-400",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full ${config.bg} ${config.text} ${SIZE_CONFIG[size] || SIZE_CONFIG.md} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot} flex-shrink-0`} />
      {config.label}
    </span>
  );
}
