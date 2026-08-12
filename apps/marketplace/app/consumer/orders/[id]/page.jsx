"use client";

import { useState, useEffect } from "react";
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
  AlertCircle,
  Copy,
  Clock,
  Loader2,
  QrCode,
  X,
  MessageCircle,
} from "lucide-react";
import StatusBadge from "@/components/ui/StatusBadge";
import { api } from "@/lib/api";

function formatIDR(amount) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(amount);
}

function formatDate(iso) {
  return new Date(iso).toLocaleString("id-ID", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

/** Normalize DB transaction detail to UI shape */
function normalizeTransaction(tx) {
  return {
    id: tx.id,
    status: tx.status?.toLowerCase() || "pending",
    totalAmount: tx.totalAmount,
    shippingAddress: tx.shippingAddress || "-",
    createdAt: tx.createdAt,
    updatedAt: tx.updatedAt,
    distributor: {
      companyName: tx.distributor?.companyName || "Produsen",
      city: tx.distributor?.city || "",
      phone: tx.distributor?.user?.phone || null,
    },
    items: (tx.items || []).map((item) => ({
      id: item.id,
      materialId: item.materialId || item.material?.id,
      title: item.material?.title || "Material",
      quantity: item.quantity,
      unit: item.material?.unit?.toLowerCase() || "kg",
      unitPrice: item.unitPrice,
      subtotal: item.subtotal ?? item.unitPrice * item.quantity,
    })),
    payment: tx.payment
      ? {
          method: tx.payment.method,
          status: tx.payment.status?.toLowerCase(),
          paidAt: tx.payment.paidAt || tx.payment.createdAt,
        }
      : null,
    tracking: tx.tracking || null,
  };
}

// ─── QRIS Placeholder ─────────────────────────────────────────────────────────
const QRIS_PLACEHOLDER = "/qris.jpeg";

function QrisPaymentModal({ totalAmount, orderId, distributorPhone, onClose }) {
  const [copied, setCopied] = useState(false);

  const waMessage = encodeURIComponent(
    `Halo, saya ingin mengkonfirmasi pembayaran pesanan ReMat.\n\n` +
    `🔖 *ID Pesanan:* ${orderId}\n` +
    `💰 *Total:* ${formatIDR(totalAmount)}\n\n` +
    `Mohon konfirmasi. Terima kasih!`
  );
  let cleanPhone = distributorPhone?.replace(/[^0-9]/g, "") || "";
  if (cleanPhone.startsWith("0")) {
    cleanPhone = "62" + cleanPhone.slice(1);
  }
  const waNumber = cleanPhone || "6281234567890";
  const waUrl = `https://wa.me/${waNumber}?text=${waMessage}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm animate-slide-up">
        <div className="p-5 pb-3 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <QrCode className="w-5 h-5 text-remat-green" />
              <h3 className="font-bold text-gray-900">Bayar via QRIS</h3>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">Scan QR code menggunakan e-wallet atau mobile banking Anda</p>
        </div>

        <div className="px-5 py-4 flex flex-col items-center">
          <div className="p-3 border-2 border-dashed border-remat-green/40 rounded-2xl bg-gray-50">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={QRIS_PLACEHOLDER} alt="QRIS" width={200} height={200} className="rounded-lg" />
          </div>

          <div className="mt-4 w-full p-3 bg-remat-green-light rounded-xl flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Nominal Pembayaran</p>
              <p className="font-black text-remat-green text-lg">{formatIDR(totalAmount)}</p>
            </div>
            <button
              onClick={() => { navigator.clipboard.writeText(formatIDR(totalAmount)); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
              className="text-xs font-medium text-remat-green border border-remat-green/30 px-3 py-1.5 rounded-lg hover:bg-remat-green/10 transition-colors"
            >
              {copied ? "Disalin ✓" : "Salin Nominal"}
            </button>
          </div>
          <p className="text-[11px] text-gray-400 text-center mt-3">
            Berlaku selama <span className="font-semibold text-gray-600">15 menit</span>. Pastikan nominal sesuai.
          </p>
        </div>

        <div className="flex items-center gap-3 px-5">
          <div className="flex-1 h-px bg-gray-100" />
          <span className="text-xs text-gray-400">atau</span>
          <div className="flex-1 h-px bg-gray-100" />
        </div>

        <div className="p-5 pt-3">
          <p className="text-xs text-gray-500 text-center mb-3">Hubungi penjual untuk konfirmasi pembayaran</p>
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#25D366] hover:bg-[#1ebe5b] text-white font-semibold rounded-xl transition-colors text-sm"
          >
            <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Chat WhatsApp dengan Penjual
          </a>
          <button onClick={onClose} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 mt-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

// Payment Method Selector
function PaymentModal({ onSelect, onClose }) {
  const [selected, setSelected] = useState("qris");
  const methods = [
    { id: "qris", label: "QRIS", icon: "📲", desc: "Bayar dengan scan QR code dari e-wallet atau mobile banking manapun" },
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
              <CreditCard className="w-4 h-4" /> Lanjut Bayar
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

  const [transaction, setTransaction] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showQrisModal, setShowQrisModal] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isReceiving, setIsReceiving] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;
    const fetchTransaction = async () => {
      if (!params?.id) return;
      setIsLoading(true);
      setError(null);
      try {
        const data = await api.getTransactionById(params.id);
        if (active) {
          if (!data) {
            setError("Pesanan tidak ditemukan.");
          } else {
            setTransaction(normalizeTransaction(data));
          }
        }
      } catch (err) {
        if (active) setError(err.message || "Gagal memuat detail pesanan.");
      } finally {
        if (active) setIsLoading(false);
      }
    };
    fetchTransaction();
    return () => { active = false; };
  }, [params?.id]);

  // Loading
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Loader2 className="w-8 h-8 text-remat-green animate-spin" />
      </div>
    );
  }

  // Error
  if (error || !transaction) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h2 className="text-lg font-semibold text-gray-700 mb-2">{error || "Pesanan tidak ditemukan"}</h2>
        <Link href="/consumer/orders" className="btn-outline">Kembali ke Daftar Pesanan</Link>
      </div>
    );
  }

  const { status } = transaction;
  const canCancel = status === "pending";
  const canReceive = false;
  const canPay = status === "pending" && !transaction.payment;

  const handleReceive = async () => {
    setIsReceiving(true);
    try {
      await api.receiveOrder(transaction.id);
      setTransaction((t) => ({ ...t, status: "completed" }));
    } catch (err) {
      alert(err.message || "Gagal menandai pesanan diterima.");
    } finally {
      setIsReceiving(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm("Yakin ingin membatalkan pesanan ini?")) return;
    setIsCancelling(true);
    try {
      await api.cancelOrder(transaction.id);
      setTransaction((t) => ({ ...t, status: "cancelled" }));
    } catch (err) {
      alert(err.message || "Gagal membatalkan pesanan.");
    } finally {
      setIsCancelling(false);
    }
  };

  const handlePaymentSelect = (method) => {
    setShowPaymentModal(false);
    setShowQrisModal(true);
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
            <h1 className="text-xl font-bold text-gray-900 font-mono">#{transaction.id.slice(0, 8)}</h1>
            <StatusBadge status={transaction.status} size="md" />
          </div>
          <p className="text-xs text-gray-400 mt-0.5">Dibuat: {formatDate(transaction.createdAt)}</p>
        </div>
      </div>

      {/* Single unified card */}
      <div className="card divide-y divide-gray-100">

        {/* ── Item Pesanan ─────────────────────────────────────────────── */}
        <div className="p-5">
          <h2 className="font-bold text-gray-900 mb-4">Item Pesanan</h2>
          <div className="space-y-3">
            {transaction.items.map((item) => (
              <div key={item.id} className="flex gap-3">
                <div className="w-12 h-12 bg-remat-blue rounded-xl flex items-center justify-center flex-shrink-0">
                  <Package className="w-6 h-6 text-remat-green/40" />
                </div>
                <div className="flex-1 min-w-0">
                  {item.materialId ? (
                    <Link href={`/marketplace/${item.materialId}`} className="font-semibold text-sm text-gray-900 hover:text-remat-green transition-colors line-clamp-1">
                      {item.title}
                    </Link>
                  ) : (
                    <p className="font-semibold text-sm text-gray-900 line-clamp-1">{item.title}</p>
                  )}
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

        {/* ── Alamat Pengiriman ─────────────────────────────────────────── */}
        <div className="p-5">
          <h2 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-remat-green" /> Alamat Pengiriman
          </h2>
          <p className="text-sm text-gray-700">{transaction.shippingAddress}</p>
        </div>

        {/* ── Informasi Produsen ─────────────────────────────────────── */}
        <div className="p-5">
          <h2 className="font-bold text-gray-900 mb-3">Informasi Produsen</h2>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-remat-green text-white rounded-xl flex items-center justify-center text-sm font-bold">
              {transaction.distributor.companyName.charAt(0)}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm text-gray-900">{transaction.distributor.companyName}</p>
              <p className="text-xs text-gray-400">
                {transaction.distributor.city}
                {transaction.distributor.phone && ` · ${transaction.distributor.phone}`}
              </p>
            </div>
            {transaction.distributor.phone && (
              <a
                href={`https://wa.me/${(() => {
                  let clean = transaction.distributor.phone.replace(/[^0-9]/g, "");
                  return clean.startsWith("0") ? "62" + clean.slice(1) : clean;
                })()}?text=${encodeURIComponent(`Halo, saya ingin bertanya tentang pesanan #${transaction.id.slice(0,8)}.`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs font-medium text-[#25D366] border border-[#25D366]/30 px-3 py-1.5 rounded-lg hover:bg-[#25D366]/10 transition-colors"
              >
                <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
              </a>
            )}
          </div>
        </div>

        {/* ── Tindakan Pesanan ──────────────────────────────────────────── */}
        <div className="p-5">
          <h2 className="font-bold text-gray-900 mb-4">Tindakan Pesanan</h2>
          <div className="flex flex-wrap gap-3">
            {canPay && (
              <button
                id="pay-btn"
                onClick={() => setShowPaymentModal(true)}
                className="btn-primary gap-2"
              >
                <CreditCard className="w-4 h-4" /> Bayar Sekarang (QRIS)
              </button>
            )}
            {canReceive && (
              <button
                id="receive-btn"
                onClick={handleReceive}
                disabled={isReceiving}
                className="btn-primary gap-2"
              >
                {isReceiving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Pesanan Diterima
              </button>
            )}
            {status === "completed" && (
              <span className="flex items-center gap-2 text-sm text-gray-500">
                <CheckCircle2 className="w-4 h-4 text-remat-green" /> Pesanan selesai
              </span>
            )}
            {canCancel && (
              <button
                id="cancel-btn"
                onClick={handleCancel}
                disabled={isCancelling}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
              >
                {isCancelling ? <Loader2 className="w-4 h-4 animate-spin text-red-500" /> : <XCircle className="w-4 h-4" />}
                Batalkan Pesanan
              </button>
            )}
            {!canPay && !canReceive && !canCancel && status !== "completed" && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <AlertCircle className="w-4 h-4" />
                <span>Tidak ada tindakan yang tersedia.</span>
              </div>
            )}
          </div>
        </div>

        {/* ── Informasi Pembayaran (kondisional) ───────────────────────── */}
        {transaction.payment && (
          <div className="p-5">
            <h2 className="font-bold text-gray-900 mb-3">Informasi Pembayaran</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Metode</span>
                <span className="font-medium uppercase">{transaction.payment.method}</span>
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

      {showPaymentModal && (
        <PaymentModal
          onSelect={handlePaymentSelect}
          onClose={() => setShowPaymentModal(false)}
        />
      )}

      {showQrisModal && (
        <QrisPaymentModal
          totalAmount={transaction.totalAmount}
          orderId={transaction.id}
          distributorPhone={transaction.distributor.phone}
          onClose={() => setShowQrisModal(false)}
        />
      )}
    </div>
  );
}
