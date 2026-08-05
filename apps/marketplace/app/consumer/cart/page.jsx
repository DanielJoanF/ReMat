"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShoppingCart,
  Package,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ChevronLeft,
  MapPin,
  Shield,
} from "lucide-react";
import useCartStore from "@/store/cart";
import { useAuth } from "@/lib/auth-context";

function formatIDR(amount) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function CartPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { items, updateQuantity, removeItem, clearCart, getTotal } = useCartStore();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [shippingAddress, setShippingAddress] = useState("");

  const total = getTotal();

  const handleCheckout = async () => {
    if (!shippingAddress.trim()) {
      alert("Masukkan alamat pengiriman terlebih dahulu.");
      return;
    }
    setIsCheckingOut(true);

    // POST /transactions stub
    const payload = {
      items: items.map((i) => ({ materialId: i.materialId, quantity: i.quantity })),
      shippingAddress,
    };

    await new Promise((r) => setTimeout(r, 1500));
    clearCart();
    router.push("/consumer/orders?checkout=success");
  };

  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 text-center">
        <div className="w-20 h-20 bg-remat-blue rounded-2xl flex items-center justify-center mx-auto mb-4">
          <ShoppingCart className="w-10 h-10 text-remat-green/40" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Keranjang Kosong</h1>
        <p className="text-sm text-gray-500 mb-6">Tambahkan material dari marketplace untuk memulai.</p>
        <Link href="/marketplace" className="btn-primary gap-2">
          <Package className="w-4 h-4" /> Jelajahi Material
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/marketplace" className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Keranjang Belanja</h1>
          <p className="text-sm text-gray-500">{items.length} item dalam keranjang</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Cart Items ───────────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-3">
          {items.map((item) => (
            <div key={item.materialId} className="card p-4">
              <div className="flex gap-4">
                {/* Image placeholder */}
                <div className="w-20 h-20 bg-remat-blue rounded-xl flex items-center justify-center flex-shrink-0">
                  <Package className="w-8 h-8 text-remat-green/40" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <span className="text-xs text-remat-green font-medium">{item.category}</span>
                      <h3 className="font-semibold text-gray-900 text-sm leading-snug truncate">{item.title}</h3>
                      <p className="text-xs text-gray-400 mt-0.5">{item.distributorName}</p>
                    </div>
                    <button
                      id={`remove-item-${item.materialId}`}
                      onClick={() => removeItem(item.materialId)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Quantity + Subtotal */}
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2">
                      <button
                        id={`qty-minus-${item.materialId}`}
                        onClick={() => updateQuantity(item.materialId, item.quantity - 1)}
                        className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-sm font-semibold w-8 text-center">{item.quantity}</span>
                      <button
                        id={`qty-plus-${item.materialId}`}
                        onClick={() => updateQuantity(item.materialId, item.quantity + 1)}
                        disabled={item.quantity >= item.stock}
                        className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors disabled:opacity-50"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-xs text-gray-400 ml-1">{item.unit}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400">{formatIDR(item.price)} / {item.unit}</p>
                      <p className="font-bold text-remat-green text-sm">{formatIDR(item.price * item.quantity)}</p>
                    </div>
                  </div>

                  {/* Stock warning */}
                  {item.quantity >= item.stock && (
                    <p className="text-xs text-amber-600 mt-1.5">⚠ Jumlah maksimum stok tercapai ({item.stock} {item.unit})</p>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Clear cart */}
          <button
            onClick={clearCart}
            className="text-sm text-red-500 hover:text-red-600 font-medium flex items-center gap-1.5"
          >
            <Trash2 className="w-4 h-4" /> Kosongkan Keranjang
          </button>
        </div>

        {/* ── Order Summary ─────────────────────────────────────────────── */}
        <div className="space-y-4">
          {/* Shipping Address */}
          <div className="card p-5">
            <h2 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-remat-green" /> Alamat Pengiriman
            </h2>
            <textarea
              id="shipping-address-input"
              rows={3}
              value={shippingAddress}
              onChange={(e) => setShippingAddress(e.target.value)}
              placeholder="Masukkan alamat pengiriman lengkap..."
              className="input-base resize-none"
            />
          </div>

          {/* Summary */}
          <div className="card p-5">
            <h2 className="font-bold text-gray-900 mb-4">Ringkasan Pesanan</h2>
            <div className="space-y-2 text-sm">
              {items.map((item) => (
                <div key={item.materialId} className="flex justify-between text-gray-600">
                  <span className="truncate mr-2">{item.title} ×{item.quantity}</span>
                  <span className="flex-shrink-0 font-medium">{formatIDR(item.price * item.quantity)}</span>
                </div>
              ))}
              <div className="border-t border-gray-100 pt-2 mt-2 flex justify-between font-bold text-gray-900">
                <span>Total Estimasi</span>
                <span className="text-remat-green">{formatIDR(total)}</span>
              </div>
            </div>

            <div className="mt-4 flex items-start gap-2 text-xs text-gray-400">
              <Shield className="w-4 h-4 text-remat-green flex-shrink-0 mt-0.5" />
              <span>Harga bersifat estimasi. Pembayaran final dikonfirmasi setelah distributor menyetujui pesanan.</span>
            </div>

            <button
              id="checkout-btn"
              onClick={handleCheckout}
              disabled={isCheckingOut}
              className="btn-primary w-full mt-5 gap-2"
            >
              {isCheckingOut ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Memproses...
                </>
              ) : (
                <>Lanjut ke Pembayaran <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
