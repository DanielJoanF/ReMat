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
  ShoppingCart,
  Phone,
  Plus,
  Minus,
  Share2,
  Award,
} from "lucide-react";
import StatusBadge from "@/components/ui/StatusBadge";
import ChatWidget from "@/components/consumer/ChatWidget";
import { useAuth } from "@/lib/auth-context";
import useCartStore from "@/store/cart";
import { api } from "@/lib/api";

function formatPrice(price, unit) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(price) + ` / ${unit}`;
}

function formatIDR(amount) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(amount);
}

export default function MaterialDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { role } = useAuth();
  const addItem = useCartStore((s) => s.addItem);

  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);
  const [material, setMaterial] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

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

  const handleAddToCart = () => {
    addItem(material, quantity);
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ── Left: Product Info ────────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-6">
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

              {/* Action Buttons */}
              <div className="flex gap-3">
                {canBuy ? (
                  <>
                    <button
                      id="add-to-cart-btn"
                      onClick={handleAddToCart}
                      className={`btn-primary flex-1 gap-2 ${addedToCart ? "bg-green-600" : ""}`}
                    >
                      <ShoppingCart className="w-4 h-4" />
                      {addedToCart ? "Ditambahkan! ✓" : "Tambah ke Keranjang"}
                    </button>
                    <Link href="/consumer/cart" className="btn-outline gap-2">
                      Beli Sekarang
                    </Link>
                  </>
                ) : (
                  <div className="flex-1 space-y-2">
                    <div className="flex gap-3">
                      <button
                        id="add-to-cart-btn-disabled"
                        disabled
                        title={role === "GUEST" ? "Silakan login sebagai Consumer untuk membeli" : role === "DISTRIBUTOR" ? "Distributor tidak dapat membeli material" : "Material tidak tersedia"}
                        className="btn-primary flex-1 gap-2 opacity-50 cursor-not-allowed"
                      >
                        <ShoppingCart className="w-4 h-4" /> Tambah ke Keranjang
                      </button>
                      <button className="btn-outline gap-2">
                        <Phone className="w-4 h-4" /> Hubungi Penjual
                      </button>
                    </div>
                    <p className="text-xs text-center text-gray-400">
                      {role === "GUEST" ? "Login sebagai Consumer untuk membeli material" :
                       role === "DISTRIBUTOR" ? "Akun Distributor tidak dapat melakukan pembelian" :
                       "Status material tidak tersedia untuk dibeli"}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Right: AI Chat Widget ─────────────────────────────────────── */}
          <div className="lg:col-span-1">
            <ChatWidget materialId={material.id} materialTitle={material.title} inline />
          </div>
        </div>
      </div>
    </div>
  );
}
