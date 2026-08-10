"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Package,
  ChevronRight,
  Clock,
  CheckCircle2,
  Truck,
  CreditCard,
  XCircle,
  Loader2,
  AlertCircle,
  ShoppingBag,
} from "lucide-react";
import StatusBadge from "@/components/ui/StatusBadge";
import { CardSkeleton } from "@/components/ui/SkeletonLoader";
import { api } from "@/lib/api";

// Stepper steps
const STEPS = [
  { key: "pending", label: "Menunggu", icon: Clock },
  { key: "confirmed", label: "Dikonfirmasi", icon: CheckCircle2 },
  { key: "paid", label: "Dibayar", icon: CreditCard },
  { key: "shipped", label: "Dikirim", icon: Truck },
  { key: "completed", label: "Selesai", icon: CheckCircle2 },
];

function formatIDR(amount) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(amount);
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("id-ID", { year: "numeric", month: "long", day: "numeric" });
}

/** Normalize DB transaction to UI shape */
function normalizeOrder(tx) {
  return {
    id: tx.id,
    status: tx.status?.toLowerCase() || "pending",
    totalAmount: tx.totalAmount,
    createdAt: tx.createdAt,
    shippingAddress: tx.shippingAddress || "",
    distributor: {
      companyName: tx.distributor?.companyName || "Distributor",
      city: tx.distributor?.city || "",
    },
    items: (tx.items || []).map((item) => ({
      id: item.id,
      title: item.material?.title || item.title || "Material",
      quantity: item.quantity,
      unit: item.material?.unit?.toLowerCase() || item.unit || "kg",
      unitPrice: item.unitPrice,
    })),
  };
}

function OrderStepper({ currentStatus }) {
  const stepKeys = STEPS.map((s) => s.key);
  const currentIdx = stepKeys.indexOf(currentStatus);

  if (currentStatus === "cancelled") {
    return (
      <div className="flex items-center gap-2 text-sm text-red-600">
        <XCircle className="w-4 h-4" /> Pesanan dibatalkan
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide py-1">
      {STEPS.map((step, idx) => {
        const isDone = idx < currentIdx;
        const isActive = idx === currentIdx;
        const isPending = idx > currentIdx;

        return (
          <div key={step.key} className="flex items-center gap-1 flex-shrink-0">
            <div className={`flex flex-col items-center gap-1 ${isPending ? "opacity-40" : ""}`}>
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-colors ${
                  isDone
                    ? "bg-remat-green border-remat-green"
                    : isActive
                    ? "bg-white border-remat-green ring-2 ring-remat-green/20"
                    : "bg-white border-gray-200"
                }`}
              >
                {isDone ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                ) : (
                  <step.icon className={`w-3.5 h-3.5 ${isActive ? "text-remat-green" : "text-gray-400"}`} />
                )}
              </div>
              <span className={`text-[10px] font-medium ${isActive ? "text-remat-green" : isDone ? "text-gray-600" : "text-gray-400"}`}>
                {step.label}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div className={`h-0.5 w-8 sm:w-12 flex-shrink-0 rounded-full mb-4 ${isDone ? "bg-remat-green" : "bg-gray-200"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function OrdersContent() {
  const searchParams = useSearchParams();
  const checkoutSuccess = searchParams.get("checkout") === "success";

  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    const fetchOrders = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await api.getMyTransactions();
        if (active) {
          const raw = Array.isArray(response) ? response : (response?.data ?? []);
          setOrders(raw.map(normalizeOrder));
        }
      } catch (err) {
        if (active) {
          setError(err.message || "Gagal memuat pesanan. Coba refresh halaman.");
        }
      } finally {
        if (active) setIsLoading(false);
      }
    };

    fetchOrders();
    return () => { active = false; };
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Checkout success banner */}
      {checkoutSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-center gap-3 animate-slide-up">
          <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
          <div>
            <p className="font-semibold text-green-800 text-sm">Pesanan Berhasil Dibuat!</p>
            <p className="text-green-600 text-xs mt-0.5">Distributor sedang memproses pesanan Anda. Tunggu konfirmasi selanjutnya.</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pesanan Saya</h1>
          {!isLoading && !error && (
            <p className="text-sm text-gray-500 mt-0.5">{orders.length} pesanan ditemukan</p>
          )}
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      )}

      {/* Error */}
      {!isLoading && error && (
        <div className="flex items-center gap-3 p-5 bg-red-50 border border-red-200 rounded-xl text-red-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <div>
            <p className="font-semibold text-sm">Gagal Memuat Pesanan</p>
            <p className="text-xs mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !error && orders.length === 0 && (
        <div className="text-center py-16">
          <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-700 mb-1">Belum Ada Pesanan</h2>
          <p className="text-sm text-gray-400 mb-5">Mulai beli material daur ulang dari marketplace kami.</p>
          <Link href="/marketplace" className="btn-primary">
            Jelajahi Marketplace
          </Link>
        </div>
      )}

      {/* Orders list */}
      {!isLoading && !error && orders.length > 0 && (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="card p-5">
              {/* Order header */}
              <div className="flex items-start justify-between gap-3 mb-4 pb-4 border-b border-gray-100">
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">ID Pesanan</p>
                  <p className="font-mono text-sm font-semibold text-gray-800">#{order.id.slice(0, 8)}</p>
                  <p className="text-xs text-gray-400 mt-1">{formatDate(order.createdAt)}</p>
                </div>
                <div className="text-right">
                  <StatusBadge status={order.status} />
                  <p className="font-bold text-remat-green mt-2">{formatIDR(order.totalAmount)}</p>
                </div>
              </div>

              {/* Items preview */}
              <div className="space-y-1.5 mb-4">
                {order.items.slice(0, 2).map((item) => (
                  <div key={item.id} className="flex items-center gap-2 text-sm text-gray-600">
                    <div className="w-8 h-8 bg-remat-blue rounded-lg flex items-center justify-center flex-shrink-0">
                      <Package className="w-4 h-4 text-remat-green/60" />
                    </div>
                    <span className="flex-1 truncate">{item.title}</span>
                    <span className="text-gray-400 flex-shrink-0">{item.quantity} {item.unit}</span>
                  </div>
                ))}
                {order.items.length > 2 && (
                  <p className="text-xs text-gray-400 ml-10">+{order.items.length - 2} item lainnya</p>
                )}
              </div>

              {/* Distributor */}
              <p className="text-xs text-gray-500 mb-4">
                Dari: <span className="font-medium text-gray-700">{order.distributor.companyName}</span>
                {order.distributor.city && ` · ${order.distributor.city}`}
              </p>

              {/* Stepper */}
              <div className="mb-4">
                <OrderStepper currentStatus={order.status} />
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-wrap">
                <Link
                  href={`/consumer/orders/${order.id}`}
                  id={`order-detail-${order.id}`}
                  className="btn-outline text-sm gap-2 flex-1 sm:flex-initial"
                >
                  Lihat Detail <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense fallback={<div className="max-w-4xl mx-auto px-4 py-8 space-y-4"><CardSkeleton /><CardSkeleton /></div>}>
      <OrdersContent />
    </Suspense>
  );
}
