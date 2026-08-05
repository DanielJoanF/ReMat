"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Star, Send, CheckCircle2 } from "lucide-react";

export default function RatePage() {
  const params = useParams();
  const router = useRouter();

  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const RATING_LABELS = ["", "Sangat Buruk", "Buruk", "Cukup", "Baik", "Sangat Baik"];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) return;
    setIsSubmitting(true);

    // POST /transactions/:id/rate stub
    await new Promise((r) => setTimeout(r, 1200));
    setSubmitted(true);
    setIsSubmitting(false);
  };

  if (submitted) {
    return (
      <div className="max-w-xl mx-auto px-4 sm:px-6 py-16 text-center animate-slide-up">
        <div className="w-20 h-20 bg-remat-green-light rounded-full flex items-center justify-center mx-auto mb-5">
          <CheckCircle2 className="w-10 h-10 text-remat-green" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Terima Kasih!</h1>
        <p className="text-gray-500 mb-2">
          Ulasan Anda untuk pesanan <span className="font-mono font-semibold">#{params.id}</span> telah berhasil dikirim.
        </p>
        <div className="flex justify-center gap-1 mb-6">
          {Array.from({ length: rating }).map((_, i) => (
            <Star key={i} className="w-6 h-6 text-amber-400 fill-current" />
          ))}
        </div>
        <div className="flex justify-center gap-3">
          <Link href="/consumer/orders" className="btn-primary gap-2">
            Lihat Semua Pesanan
          </Link>
          <Link href="/marketplace" className="btn-outline gap-2">
            Lanjut Belanja
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Link href={`/consumer/orders/${params.id}`} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Beri Penilaian</h1>
          <p className="text-sm text-gray-500 font-mono mt-0.5">Pesanan #{params.id}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Star Rating */}
        <div className="card p-8 mb-5 text-center">
          <p className="text-sm font-medium text-gray-600 mb-6">
            Bagaimana pengalaman Anda dengan pesanan ini?
          </p>

          {/* Stars */}
          <div className="flex justify-center gap-3 mb-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                id={`star-${star}`}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                className="transition-transform hover:scale-110 active:scale-95 focus:outline-none"
              >
                <Star
                  className={`w-12 h-12 transition-colors duration-100 ${
                    star <= (hoveredRating || rating)
                      ? "text-amber-400 fill-current"
                      : "text-gray-200"
                  }`}
                />
              </button>
            ))}
          </div>

          {/* Label */}
          <p className={`text-lg font-bold transition-all duration-200 ${
            rating > 0 ? "text-amber-500" : "text-gray-300"
          }`}>
            {hoveredRating > 0
              ? RATING_LABELS[hoveredRating]
              : rating > 0
              ? RATING_LABELS[rating]
              : "Pilih bintang untuk menilai"}
          </p>
        </div>

        {/* Comment */}
        <div className="card p-5 mb-5">
          <label className="block text-sm font-semibold text-gray-800 mb-3">
            Tuliskan Ulasan <span className="text-gray-400 font-normal">(opsional)</span>
          </label>
          <textarea
            id="rating-comment"
            rows={5}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Ceritakan pengalaman Anda: kualitas material, ketepatan waktu pengiriman, responsivitas distributor..."
            className="input-base resize-none"
            maxLength={500}
          />
          <p className="text-xs text-gray-400 text-right mt-1.5">{comment.length}/500</p>
        </div>

        {/* Aspect ratings (optional) */}
        <div className="card p-5 mb-6">
          <p className="text-sm font-semibold text-gray-800 mb-4">Nilai Aspek Spesifik</p>
          <div className="space-y-3">
            {[
              "Kualitas Material Sesuai Deskripsi",
              "Ketepatan Waktu Pengiriman",
              "Responsivitas Distributor",
              "Pengemasan Material",
            ].map((aspect) => (
              <div key={aspect} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{aspect}</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className="w-4 h-4 text-gray-200 hover:text-amber-400 cursor-pointer transition-colors" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Submit */}
        <button
          id="submit-rating-btn"
          type="submit"
          disabled={rating === 0 || isSubmitting}
          className="btn-primary w-full gap-2 py-3 text-base"
        >
          {isSubmitting ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <><Send className="w-5 h-5" /> Kirim Penilaian</>
          )}
        </button>

        {rating === 0 && (
          <p className="text-center text-xs text-gray-400 mt-2">Pilih bintang terlebih dahulu</p>
        )}
      </form>
    </div>
  );
}
