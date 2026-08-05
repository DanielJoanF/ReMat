"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  Package,
  MapPin,
  CreditCard,
  CheckCircle2,
  XCircle,
  Truck,
  Star,
  AlertCircle,
  Copy,
  Clock,
} from "lucide-react";
import StatusBadge from "@/components/ui/StatusBadge";

// ─── Mock Data ───────────────────────────────────────────────────────────────
const MOCK_TRANSACTION = {
  id: "txn-001",
  status: "shipped",
  totalAmount: 6250000,
  shippingAddress: "Jl. Industri No. 15, Bekasi Barat, Jawa Barat 17135",
  createdAt: "2026-07-28T09:30:00Z",
  updatedAt: "2026-08-03T14:00:00Z",
  distributor: {
    companyName: "PT. EcoRecycle Jaya",
    city: "Surabaya",
    phone: "+62812345678",
  },
  items: [
    {
      id: "ti1",
      materialId: "1",
      title: "Biji Plastik PET Grade A (Clear)",
      quantity: 500,
      unit: "kg",
      unitPrice: 12500,
      subtotal: 6250000,
    },
  ],
  payment: null, // null = belum dibayar
  tracking: {
    provider: "JNE Cargo",
    awbNumber: "JNE123456789",
    estimatedDelivery: "2026-08-07",
  },
};

function formatIDR(amount) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(amount);
}

function formatDate(iso) {
  return new Date(iso).toLocaleString("id-ID", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

// Payment Method Selector
function PaymentModal({ onSelect, onClose }) {
  const [selected, setSelected] = useState("");
  const methods = [
    { id: "transfer", label: "Transfer Bank", icon: "🏦", desc: "BCA, Mandiri, BNI, BRI" },
    { id: "va", label: "Virtual Account", icon: "💳", desc: "OVO, DANA, Gopay" },
    { id: "ewallet", label: "E-Wallet", icon: "📱", desc: "ShopeePay, LinkAja" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md animate-slide-up">
        <div className="p-6">
          <h3 className="font-bold text-gray-900 text-lg mb-4">Pilih Metode Pembayaran</h3>
          <div className="space-y-3 mb-5">
            {methods.map((m) => (
              <label
                key={m.id}
                className={`flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                  selected === m.id ? "border-remat-green bg-remat-green-light" : "border-gray-100 hover:border-gray-200"
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  value={m.id}
                  checked={selected === m.id}
                  onChange={() => setSelected(m.id)}
                  className="sr-only"
                />
                <span className="text-2xl">{m.icon}</span>
                <div>
                  <p className="font-semibold text-sm text-gray-900">{m.label}</p>
                  <p className="text-xs text-gray-400">{m.desc}</p>
                </div>
                {selected === m.id && <CheckCircle2 className="w-5 h-5 text-remat-green ml-auto" />}
              </label>
            ))}
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="btn-ghost flex-1">Batal</button>
            <button
              id="confirm-payment-btn"
              disabled={!selected}
              onClick={() => onSelect(selected)}
              className="btn-primary flex-1 gap-2 disabled:opacity-50"
            >
              <CreditCard className="w-4 h-4" /> Konfirmasi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TransactionDetailPage() {
  const params = useParams();
  const router = useRouter();

  const [transaction, setTransaction] = useState(MOCK_TRANSACTION);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isReceiving, setIsReceiving] = useState(false);
  const [copied, setCopied] = useState(false);

  const { status } = transaction;
  const canCancel = ["pending", "confirmed", "paid"].includes(status);
  const canReceive = status === "shipped";
  const canPay = status === "pending" || (status === "confirmed" && !transaction.payment);

  const handleReceive = async () => {
    setIsReceiving(true);
    await new Promise((r) => setTimeout(r, 1000));
    setTransaction((t) => ({ ...t, status: "completed" }));
    setIsReceiving(false);
  };

  const handleCancel = async () => {
    if (!confirm("Yakin ingin membatalkan pesanan ini?")) return;
    setIsCancelling(true);
    await new Promise((r) => setTimeout(r, 1000));
    setTransaction((t) => ({ ...t, status: "cancelled" }));
    setIsCancelling(false);
  };

  const handlePaymentSelect = async (method) => {
    setShowPaymentModal(false);
    setTransaction((t) => ({
      ...t,
      status: "paid",
      payment: { method, status: "success", paidAt: new Date().toISOString() },
    }));
  };

  const copyAwb = () => {
    navigator.clipboard.writeText(transaction.tracking?.awbNumber || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/consumer/orders" className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-gray-900 font-mono">#{transaction.id}</h1>
            <StatusBadge status={transaction.status} size="md" />
          </div>
          <p className="text-xs text-gray-400 mt-0.5">Dibuat: {formatDate(transaction.createdAt)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left: Details ─────────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-5">
          {/* Status banner */}
          {status === "shipped" && (
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 flex items-start gap-3">
              <Truck className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-purple-800 text-sm">Paket Sedang Dikirim</p>
                <p className="text-xs text-purple-600 mt-0.5">
                  {transaction.tracking?.provider} · AWB: <strong>{transaction.tracking?.awbNumber}</strong>
                  <button onClick={copyAwb} className="ml-2 inline-flex items-center gap-1 text-purple-700 hover:text-purple-900">
                    <Copy className="w-3 h-3" /> {copied ? "Disalin!" : "Salin"}
                  </button>
                </p>
                <p className="text-xs text-purple-600 mt-0.5">
                  Estimasi tiba: {new Date(transaction.tracking?.estimatedDelivery || "").toLocaleDateString("id-ID", { year: "numeric", month: "long", day: "numeric" })}
                </p>
              </div>
            </div>
          )}

          {status === "pending" && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
              <Clock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-800 text-sm">Menunggu Konfirmasi Distributor</p>
                <p className="text-xs text-amber-600 mt-0.5">Distributor akan mengkonfirmasi pesanan dalam 1x24 jam.</p>
              </div>
            </div>
          )}

          {status === "cancelled" && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
              <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-700 text-sm">Pesanan Dibatalkan</p>
                <p className="text-xs text-red-500 mt-0.5">Pesanan ini telah dibatalkan.</p>
              </div>
            </div>
          )}

          {status === "completed" && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-green-800 text-sm">Pesanan Selesai</p>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-xs text-green-600">Terima kasih telah menggunakan ReMat!</p>
                  <Link href={`/consumer/orders/${transaction.id}/rate`} className="text-xs font-semibold text-remat-green hover:underline flex items-center gap-1">
                    <Star className="w-3 h-3" /> Beri Penilaian
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Items */}
          <div className="card p-5">
            <h2 className="font-bold text-gray-900 mb-4">Item Pesanan</h2>
            <div className="space-y-3">
              {transaction.items.map((item) => (
                <div key={item.id} className="flex gap-3">
                  <div className="w-12 h-12 bg-remat-blue rounded-xl flex items-center justify-center flex-shrink-0">
                    <Package className="w-6 h-6 text-remat-green/40" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link href={`/marketplace/${item.materialId}`} className="font-semibold text-sm text-gray-900 hover:text-remat-green transition-colors line-clamp-1">
                      {item.title}
                    </Link>
                    <p className="text-xs text-gray-400 mt-0.5">{item.quantity} {item.unit} × {formatIDR(item.unitPrice)}</p>
                  </div>
                  <p className="font-bold text-remat-green text-sm flex-shrink-0">{formatIDR(item.subtotal)}</p>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-100 mt-4 pt-4 flex justify-between font-bold">
              <span className="text-gray-900">Total</span>
              <span className="text-remat-green text-lg">{formatIDR(transaction.totalAmount)}</span>
            </div>
          </div>

          {/* Shipping */}
          <div className="card p-5">
            <h2 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-remat-green" /> Alamat Pengiriman
            </h2>
            <p className="text-sm text-gray-700">{transaction.shippingAddress}</p>
          </div>

          {/* Distributor info */}
          <div className="card p-5">
            <h2 className="font-bold text-gray-900 mb-3">Informasi Distributor</h2>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-remat-green text-white rounded-xl flex items-center justify-center text-sm font-bold">
                {transaction.distributor.companyName.charAt(0)}
              </div>
              <div>
                <p className="font-semibold text-sm text-gray-900">{transaction.distributor.companyName}</p>
                <p className="text-xs text-gray-400">{transaction.distributor.city} · {transaction.distributor.phone}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right: Actions ─────────────────────────────────────────────── */}
        <div className="space-y-4">
          {/* Action Card */}
          <div className="card p-5">
            <h2 className="font-bold text-gray-900 mb-4">Tindakan Pesanan</h2>

            <div className="space-y-3">
              {/* Pay button */}
              {canPay && (
                <button
                  id="pay-btn"
                  onClick={() => setShowPaymentModal(true)}
                  className="btn-primary w-full gap-2"
                >
                  <CreditCard className="w-4 h-4" /> Pilih Metode Pembayaran
                </button>
              )}

              {/* Receive button */}
              {canReceive && (
                <button
                  id="receive-btn"
                  onClick={handleReceive}
                  disabled={isReceiving}
                  className="btn-primary w-full gap-2"
                >
                  {isReceiving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  Pesanan Diterima
                </button>
              )}

              {/* Rate button (completed) */}
              {status === "completed" && (
                <Link
                  href={`/consumer/orders/${transaction.id}/rate`}
                  id="rate-btn"
                  className="btn-outline w-full gap-2 flex items-center justify-center"
                >
                  <Star className="w-4 h-4" /> Beri Penilaian
                </Link>
              )}

              {/* Cancel button */}
              {canCancel && (
                <button
                  id="cancel-btn"
                  onClick={handleCancel}
                  disabled={isCancelling}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                >
                  {isCancelling ? <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" /> : <XCircle className="w-4 h-4" />}
                  Batalkan Pesanan
                </button>
              )}
            </div>

            {!canPay && !canReceive && !canCancel && status !== "completed" && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <AlertCircle className="w-4 h-4" />
                <span>Tidak ada tindakan yang tersedia.</span>
              </div>
            )}
          </div>

          {/* Payment info */}
          {transaction.payment && (
            <div className="card p-5">
              <h2 className="font-bold text-gray-900 mb-3">Informasi Pembayaran</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Metode</span>
                  <span className="font-medium capitalize">{transaction.payment.method}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Status</span>
                  <StatusBadge status={transaction.payment.status} size="sm" />
                </div>
                {transaction.payment.paidAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Waktu</span>
                    <span className="font-medium">{formatDate(transaction.payment.paidAt)}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {showPaymentModal && (
        <PaymentModal
          onSelect={handlePaymentSelect}
          onClose={() => setShowPaymentModal(false)}
        />
      )}
    </div>
  );
}
