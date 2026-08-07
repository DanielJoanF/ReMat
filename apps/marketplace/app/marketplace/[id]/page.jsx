"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  BadgeCheck,
  MapPin,
  Package,
  FileText,
  Star,
  ChevronLeft,
  Phone,
  Plus,
  Minus,
  Share2,
  Award,
  ShoppingBag,
  CheckCircle2,
  X,
  MessageCircle,
  QrCode,
  Loader2,
  AlertCircle,
} from "lucide-react";
import StatusBadge from "@/components/ui/StatusBadge";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";

function formatPrice(price, unit) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(price) + ` / ${unit}`;
}

function formatIDR(amount) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(amount);
}

// ─── QRIS Image (placeholder QR – in production use actual payment gateway) ──
const QRIS_PLACEHOLDER =
  "https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=REMAT-PAYMENT-DEMO&color=1a1a1a&bgcolor=FFFFFF&margin=10";

// ─── Konfirmasi Modal ─────────────────────────────────────────────────────────
function ConfirmOrderModal({ material, quantity, onConfirm, onClose, isLoading }) {
  const total = material.price * quantity;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-remat-green" />
            <h3 className="font-bold text-gray-900">Konfirmasi Pesanan</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Item */}
          <div className="flex gap-3 p-3 bg-gray-50 rounded-xl">
            <div className="w-12 h-12 bg-remat-green-light rounded-lg flex items-center justify-center flex-shrink-0">
              <Package className="w-6 h-6 text-remat-green/60" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-gray-900 line-clamp-1">{material.title}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {quantity} {material.unit} × {formatPrice(material.price, material.unit).split(" /")[0]}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                Dari: <span className="font-medium">{material.distributorName}</span>
              </p>
            </div>
          </div>

          {/* Total */}
          <div className="flex items-center justify-between p-3 bg-remat-green-light rounded-xl">
            <span className="text-sm font-medium text-gray-700">Total Pembayaran</span>
            <span className="text-lg font-black text-remat-green">{formatIDR(total)}</span>
          </div>

          <p className="text-xs text-gray-400 text-center">
            Dengan mengkonfirmasi, Anda menyetujui syarat & ketentuan pembelian ReMat.
          </p>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-5 pt-0">
          <button onClick={onClose} className="btn-ghost flex-1" disabled={isLoading}>Batal</button>
          <button
            id="confirm-order-btn"
            onClick={onConfirm}
            disabled={isLoading}
            className="btn-primary flex-1 gap-2 disabled:opacity-60"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            {isLoading ? "Memproses..." : "Konfirmasi Pesanan"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── QRIS Payment Modal ───────────────────────────────────────────────────────
function QrisPaymentModal({ totalAmount, material, orderId, distributorPhone, onClose }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(formatIDR(totalAmount));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // WhatsApp message
  const waMessage = encodeURIComponent(
    `Halo, saya baru saja melakukan pemesanan di ReMat.\n\n` +
    `📦 *Material:* ${material.title}\n` +
    `💰 *Total:* ${formatIDR(totalAmount)}\n` +
    `🔖 *ID Pesanan:* ${orderId || "Baru dibuat"}\n\n` +
    `Mohon konfirmasi pesanan saya. Terima kasih!`
  );
  const waNumber = distributorPhone?.replace(/[^0-9]/g, "") || "6281234567890";
  const waUrl = `https://wa.me/${waNumber}?text=${waMessage}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm animate-slide-up">
        {/* Header */}
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
          <p className="text-xs text-gray-500 mt-1">Scan QR code di bawah menggunakan aplikasi e-wallet atau mobile banking Anda</p>
        </div>

        {/* QRIS Code */}
        <div className="px-5 py-4 flex flex-col items-center">
          <div className="p-3 border-2 border-dashed border-remat-green/40 rounded-2xl bg-gray-50">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={QRIS_PLACEHOLDER}
              alt="QRIS Payment Code"
              width={200}
              height={200}
              className="rounded-lg"
            />
          </div>

          {/* Amount */}
          <div className="mt-4 w-full p-3 bg-remat-green-light rounded-xl flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Nominal Pembayaran</p>
              <p className="font-black text-remat-green text-lg">{formatIDR(totalAmount)}</p>
            </div>
            <button
              onClick={handleCopy}
              className="text-xs font-medium text-remat-green border border-remat-green/30 px-3 py-1.5 rounded-lg hover:bg-remat-green/10 transition-colors"
            >
              {copied ? "Disalin ✓" : "Salin Nominal"}
            </button>
          </div>

          <p className="text-[11px] text-gray-400 text-center mt-3">
            Pembayaran berlaku selama <span className="font-semibold text-gray-600">15 menit</span>. 
            Pastikan nominal sesuai untuk mempercepat proses verifikasi.
          </p>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 px-5">
          <div className="flex-1 h-px bg-gray-100" />
          <span className="text-xs text-gray-400">atau</span>
          <div className="flex-1 h-px bg-gray-100" />
        </div>

        {/* WhatsApp CTA */}
        <div className="p-5 pt-3">
          <p className="text-xs text-gray-500 text-center mb-3">
            Hubungi penjual untuk konfirmasi pembayaran
          </p>
          <a
            id="whatsapp-seller-btn"
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#25D366] hover:bg-[#1ebe5b] text-white font-semibold rounded-xl transition-colors text-sm"
          >
            {/* WhatsApp icon SVG */}
            <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Chat WhatsApp dengan Penjual
          </a>

          <Link
            href="/consumer/orders"
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 mt-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
            onClick={onClose}
          >
            Lihat Pesanan Saya
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function MaterialDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { role } = useAuth();

  const [quantity, setQuantity] = useState(1);
  const [material, setMaterial] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showQrisModal, setShowQrisModal] = useState(false);
  const [isOrdering, setIsOrdering] = useState(false);
  const [orderError, setOrderError] = useState(null);
  const [createdOrderId, setCreatedOrderId] = useState(null);

  useEffect(() => {
    let active = true;
    const fetchDetail = async () => {
      if (!params?.id) return;
      setIsLoading(true);
      try {
        const dbMat = await api.getMaterialById(params.id);
        if (active) {
          setMaterial({
            ...dbMat,
            quality_grade: dbMat.qualityGrade || "Grade A",
            isVerified: dbMat.distributor?.isVerified || false,
            distributorName: dbMat.distributor?.companyName || "Distributor",
            imageUrl: dbMat.documents?.find(doc => doc.type === "PHOTO")?.fileUrl || null,
            unit: dbMat.unit?.toLowerCase() || "kg",
            status: dbMat.status?.toLowerCase() || "active",
            distributor: {
              ...dbMat.distributor,
              rating: dbMat.distributor?.rating || 4.8,
              totalTransactions: dbMat.distributor?.totalTransactions || 120,
              phone: dbMat.distributor?.user?.phone || null,
            },
            documents: (dbMat.documents || []).map((doc, idx) => ({
              id: doc.id,
              type: doc.type?.toLowerCase() || "photo",
              label: doc.type === "PHOTO" ? "Foto Material" : doc.type === "MSDS" ? "Material Safety Data Sheet" : `Dokumen Pendukung ${idx + 1}`
            }))
          });
        }
      } catch (err) {
        console.error("Failed to fetch material details:", err);
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };
    fetchDetail();
    return () => {
      active = false;
    };
  }, [params?.id]);

  if (isLoading || !material) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="w-8 h-8 border-2 border-remat-green border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isConsumer = role === "CONSUMER";
  const canBuy = isConsumer && material.status === "active";

  const handleConfirmOrder = async () => {
    setIsOrdering(true);
    setOrderError(null);
    try {
      const result = await api.createTransaction({
        items: [{ materialId: material.id, quantity }],
        shippingAddress: "",
      });
      setCreatedOrderId(result?.id || null);
      setShowConfirmModal(false);
      setShowQrisModal(true);
    } catch (err) {
      setOrderError(err.message || "Gagal membuat pesanan. Coba lagi.");
    } finally {
      setIsOrdering(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link href="/marketplace" className="flex items-center gap-1.5 hover:text-remat-green transition-colors">
            <ChevronLeft className="w-4 h-4" /> Kembali ke Marketplace
          </Link>
          <span>/</span>
          <span className="text-gray-400">{material.category?.name}</span>
          <span>/</span>
          <span className="text-gray-700 font-medium truncate max-w-xs">{material.title}</span>
        </nav>

        <div className="max-w-4xl mx-auto space-y-6">
          <div>
            {/* Image + Grade Badge */}
            <div className="relative bg-gradient-to-br from-remat-green-light to-remat-blue rounded-card h-80 flex items-center justify-center overflow-hidden">
              {material.imageUrl ? (
                <Image
                  src={material.imageUrl}
                  alt={material.title}
                  fill
                  className="object-cover"
                />
              ) : (
                <Package className="w-24 h-24 text-remat-green/20" />
              )}
              <div className="absolute top-4 left-4 bg-remat-green text-white text-sm font-bold px-3 py-1.5 rounded-lg shadow-sm flex items-center gap-2">
                <Award className="w-4 h-4" /> Verified {material.quality_grade}
              </div>
              <button className="absolute top-4 right-4 p-2 bg-white rounded-lg shadow-sm hover:bg-gray-50 transition-colors">
                <Share2 className="w-4 h-4 text-gray-500" />
              </button>
              <StatusBadge status={material.status} className="absolute bottom-4 left-4" />
            </div>

            {/* Main Info Card */}
            <div className="card p-6">
              {/* Category */}
              <span className="text-xs font-semibold text-remat-green uppercase tracking-wider mb-2 block">
                {material.category?.name}
              </span>

              {/* Title + Price */}
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                <h1 className="text-2xl font-bold text-gray-900 leading-tight">{material.title}</h1>
                <div className="text-right flex-shrink-0">
                  <p className="text-2xl font-black text-remat-green">{formatPrice(material.price, material.unit)}</p>
                </div>
              </div>

              {/* Distributor */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg mb-4">
                <div className="w-10 h-10 bg-remat-green text-white rounded-xl flex items-center justify-center text-sm font-bold">
                  {material.distributor.companyName.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-semibold text-gray-900 text-sm">{material.distributor.companyName}</span>
                    {material.distributor.isVerified && (
                      <span className="verified-badge">
                        <BadgeCheck className="w-3 h-3" /> Terverifikasi
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{material.distributor.city}</span>
                    <span className="flex items-center gap-1"><Star className="w-3 h-3 text-amber-400" />{material.distributor.rating} ({material.distributor.totalTransactions} transaksi)</span>
                  </div>
                </div>
              </div>

              {/* Metadata Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                {[
                  { label: "Ketersediaan", value: `${material.quantity} ${material.unit}`, icon: Package },
                  { label: "Grade", value: material.quality_grade, icon: Award },
                  { label: "Lokasi Gudang", value: material.location, icon: MapPin },
                  { label: "Sertifikasi", value: material.requires_msds ? "MSDS Tersedia" : "Tidak Diperlukan", icon: FileText },
                ].map((item) => (
                  <div key={item.label} className="bg-gray-50 rounded-xl p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <item.icon className="w-3.5 h-3.5 text-remat-green" />
                      <span className="text-xs text-gray-400 font-medium">{item.label}</span>
                    </div>
                    <p className="text-sm font-semibold text-gray-900 leading-tight">{item.value}</p>
                  </div>
                ))}
              </div>

              {/* Description */}
              <div>
                <h2 className="font-bold text-gray-900 mb-3">Deskripsi Material</h2>
                <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                  {material.description}
                </div>
              </div>

              {/* Documents */}
              {material.documents?.length > 0 && (
                <div className="mt-6">
                  <h2 className="font-bold text-gray-900 mb-3">Dokumen Pendukung</h2>
                  <div className="flex flex-wrap gap-2">
                    {material.documents.map((doc) => (
                      <button key={doc.id} className="flex items-center gap-2 text-xs font-medium text-gray-700 border border-gray-200 px-3 py-2 rounded-lg hover:border-remat-green hover:text-remat-green transition-colors">
                        <FileText className="w-3.5 h-3.5" /> {doc.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Action Section */}
            <div className="card p-6">
              <h2 className="font-bold text-gray-900 mb-4">Pembelian</h2>

              {/* Quantity selector */}
              <div className="flex items-center gap-4 mb-5">
                <label className="text-sm font-medium text-gray-700">Jumlah ({material.unit})</label>
                <div className="flex items-center gap-2">
                  <button
                    id="qty-minus"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
                    disabled={quantity <= 1}
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    id="qty-input"
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.min(material.quantity, Math.max(1, Number(e.target.value))))}
                    className="input-base w-20 text-center"
                  />
                  <button
                    id="qty-plus"
                    onClick={() => setQuantity(Math.min(material.quantity, quantity + 1))}
                    className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
                    disabled={quantity >= material.quantity}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="ml-auto text-right">
                  <p className="text-xs text-gray-400">Total Estimasi</p>
                  <p className="font-bold text-remat-green">{formatIDR(material.price * quantity)}</p>
                </div>
              </div>

              {/* Error message */}
              {orderError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg mb-4 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{orderError}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                {role === "CONSUMER" && material.status === "active" ? (
                  <button
                    id="beli-btn"
                    onClick={() => { setOrderError(null); setShowConfirmModal(true); }}
                    className="btn-primary flex-1 gap-2"
                  >
                    <ShoppingBag className="w-4 h-4" /> Beli
                  </button>
                ) : role === "GUEST" && material.status === "active" ? (
                  <button
                    id="beli-btn"
                    onClick={() => {
                      router.push(`/login?redirect=${encodeURIComponent(`/marketplace/${material.id}`)}`);
                    }}
                    className="btn-primary flex-1 gap-2"
                  >
                    <ShoppingBag className="w-4 h-4" /> Beli
                  </button>
                ) : (
                  <div className="flex-1 space-y-2">
                    <div className="flex gap-3">
                      <button
                        id="beli-btn-disabled"
                        disabled
                        title={role === "DISTRIBUTOR" ? "Distributor tidak dapat membeli material" : "Material tidak tersedia"}
                        className="btn-primary flex-1 gap-2 opacity-50 cursor-not-allowed"
                      >
                        <ShoppingBag className="w-4 h-4" /> Beli
                      </button>
                      <button className="btn-outline gap-2">
                        <Phone className="w-4 h-4" /> Hubungi Penjual
                      </button>
                    </div>
                    <p className="text-xs text-center text-gray-400">
                      {role === "DISTRIBUTOR" ? "Akun Distributor tidak dapat melakukan pembelian" :
                       "Status material tidak tersedia untuk dibeli"}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirm Order Modal */}
      {showConfirmModal && (
        <ConfirmOrderModal
          material={material}
          quantity={quantity}
          onConfirm={handleConfirmOrder}
          onClose={() => setShowConfirmModal(false)}
          isLoading={isOrdering}
        />
      )}

      {/* QRIS Payment Modal */}
      {showQrisModal && (
        <QrisPaymentModal
          totalAmount={material.price * quantity}
          material={material}
          orderId={createdOrderId}
          distributorPhone={material.distributor?.phone}
          onClose={() => setShowQrisModal(false)}
        />
      )}
    </div>
  );
}
