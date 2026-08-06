import Link from "next/link";
import Image from "next/image";
import { MapPin, Package, ArrowRight, BadgeCheck } from "lucide-react";
import StatusBadge from "./StatusBadge";

function formatPrice(price, unit = "kg") {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(price) + ` / ${unit}`;
}

/**
 * MaterialCard — Reusable product card for marketplace listings
 * @param {Object} material - Material data object
 * @param {string} variant - "grid" | "list"
 */
export default function MaterialCard({ material, variant = "grid" }) {
  const {
    id,
    title,
    quality_grade,
    quantity,
    unit = "kg",
    price,
    location,
    status,
    category,
    isVerified,
    distributorName,
    imageUrl,
  } = material;

  if (variant === "list") {
    return (
      <Link href={`/marketplace/${id}`} className="block group">
        <div className="card flex gap-4 p-4 hover:border-remat-green/30 transition-all duration-200">
          {/* Image */}
          <div className="relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
            {imageUrl ? (
              <Image src={imageUrl} alt={title} fill className="object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-remat-green-light to-remat-blue">
                <Package className="w-8 h-8 text-remat-green/40" />
              </div>
            )}
            {quality_grade && (
              <span className="absolute top-1.5 left-1.5 bg-remat-green text-white text-xs font-bold px-1.5 py-0.5 rounded">
                {quality_grade}
              </span>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold text-remat-green uppercase tracking-wide">
                    {category?.name || "Material"}
                  </span>
                  {isVerified && (
                    <span className="verified-badge">
                      <BadgeCheck className="w-3 h-3" />
                      Terverifikasi
                    </span>
                  )}
                </div>
                <h3 className="font-semibold text-gray-900 truncate group-hover:text-remat-green transition-colors">
                  {title}
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">{distributorName}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-lg font-bold text-remat-green">
                  {formatPrice(price, unit)}
                </div>
                <StatusBadge status={status} size="sm" />
              </div>
            </div>

            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Package className="w-3.5 h-3.5" />
                {quantity} {unit}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {location}
              </span>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  // Grid variant (default)
  return (
    <Link href={`/marketplace/${id}`} className="block group h-full">
      <div className="card flex flex-col h-full overflow-hidden hover:border-remat-green/30 hover:-translate-y-0.5 transition-all duration-200">
        {/* Image */}
        <div className="relative h-48 bg-gray-100 overflow-hidden">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-remat-green-light to-remat-blue">
              <Package className="w-12 h-12 text-remat-green/30" />
            </div>
          )}

          {/* Grade badge */}
          {quality_grade && (
            <span className="absolute top-3 left-3 bg-remat-green text-white text-xs font-bold px-2 py-1 rounded shadow-sm">
              {quality_grade}
            </span>
          )}

          {/* Status badge if sold out */}
          {status === "sold_out" && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="text-white font-bold text-sm">HABIS TERJUAL</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col flex-1">
          {/* Category + Verified */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold text-remat-green uppercase tracking-wide">
              {category?.name || "Material"}
            </span>
            {isVerified && (
              <span className="verified-badge">
                <BadgeCheck className="w-3 h-3" />
                Verified
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="font-semibold text-gray-900 leading-snug mb-1 line-clamp-2 group-hover:text-remat-green transition-colors">
            {title}
          </h3>
          <p className="text-xs text-gray-400 mb-3">{distributorName}</p>

          {/* Metadata */}
          <div className="flex items-center gap-3 text-xs text-gray-500 mb-auto">
            <span className="flex items-center gap-1">
              <Package className="w-3.5 h-3.5 text-gray-400" />
              {quantity} {unit}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-gray-400" />
              {location}
            </span>
          </div>

          {/* Footer: Price + Beli Button */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Estimasi Harga</p>
              <p className="text-base font-bold text-remat-green">{formatPrice(price, unit)}</p>
            </div>
            <span className="btn-primary text-xs px-3 py-1.5">
              Beli
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
