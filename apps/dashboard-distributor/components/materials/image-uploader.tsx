'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Upload, Image as ImageIcon, X, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { uploadFile, deleteData } from '@/lib/api-client';
import { cn } from '@/lib/utils';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ACCEPTED_EXT = '.jpg,.jpeg,.png,.webp';

interface PhotoDoc {
  id: string;
  type: string;
  fileUrl: string;
}

interface ImageUploaderProps {
  materialId: string;
  photos?: PhotoDoc[]; // existing PHOTO documents (from API, never mocked)
  onChange?: (photos: PhotoDoc[]) => void;
}

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/**
 * Reusable image uploader for a material's PHOTO documents.
 * All data comes from the API — no mock/fallback data is injected.
 */
export function ImageUploader({ materialId, photos = [], onChange }: ImageUploaderProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pendingPreview, setPendingPreview] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (pendingPreview) URL.revokeObjectURL(pendingPreview);
    };
  }, [pendingPreview]);

  const handlePick = async (file: File | undefined) => {
    if (!file) return;
    if ((photos ?? []).length >= 1) {
      toast({ type: 'warning', message: 'Hanya dapat mengupload maksimal 1 foto.' });
      return;
    }
    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast({ type: 'warning', message: 'Format foto tidak didukung. Gunakan JPG, PNG, atau WebP.' });
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast({ type: 'warning', message: 'Ukuran foto terlalu besar. Maksimal 10MB.' });
      return;
    }

    setUploading(true);
    try {
      const preview = await readFileAsDataURL(file);
      setPendingPreview(preview);
      const res = await uploadFile<{ data: PhotoDoc }>(`/materials/${materialId}/documents`, file, 'PHOTO');
      const uploaded = res.data;
      if (uploaded?.id) {
        onChange?.([...(photos ?? []), uploaded]);
        toast({ type: 'success', message: 'Foto berhasil diupload.' });
      }
    } catch (err) {
      toast({ type: 'error', message: err instanceof Error ? err.message : 'Gagal upload foto' });
    } finally {
      setPendingPreview(null);
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (docId: string) => {
    setDeletingId(docId);
    try {
      await deleteData(`/materials/${materialId}/documents/${docId}`);
      onChange?.(photos.filter((p) => p.id !== docId));
      toast({ type: 'success', message: 'Foto berhasil dihapus.' });
    } catch (err) {
      toast({ type: 'error', message: err instanceof Error ? err.message : 'Gagal menghapus foto' });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Dropzone / Preview Grid */}
      {(photos ?? []).length === 0 && !uploading ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            'flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-8 transition-colors',
            'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
          )}
        >
          <Upload className="mb-2 h-8 w-8 text-gray-400" />
          <p className="text-sm font-medium text-gray-700">Klik untuk memilih foto</p>
          <p className="mt-1 text-xs text-gray-500">JPG, PNG, WebP - Maks 10MB, maksimal 1 foto</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {(photos ?? []).map((photo) => (
            <div key={photo.id} className="group relative overflow-hidden rounded-lg border border-gray-200 aspect-square">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo.fileUrl} alt="Foto material" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => handleDelete(photo.id)}
                disabled={deletingId === photo.id}
                className="absolute right-2 top-2 rounded-md bg-white/90 p-1.5 text-red-600 shadow-md transition-colors hover:bg-red-50 disabled:opacity-50"
                title="Hapus foto"
              >
                {deletingId === photo.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </button>
            </div>
          ))}

          {uploading && (
            <div className="flex flex-col items-center justify-center rounded-lg border border-gray-200 aspect-square bg-gray-50">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="mt-1 text-xs text-gray-500">Mengupload...</span>
            </div>
          )}

          {!uploading && (photos ?? []).length < 1 && (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed aspect-square border-gray-300 hover:border-primary-400 hover:bg-gray-50"
            >
              <Upload className="h-6 w-6 text-gray-400" />
              <span className="mt-1 text-xs text-gray-500">Tambah Foto</span>
            </div>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_EXT}
        className="hidden"
        onChange={(e) => {
          handlePick(e.target.files?.[0]);
        }}
      />

      {pendingPreview && (
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <ImageIcon className="h-3.5 w-3.5" />
          Memproses foto baru...
        </div>
      )}
    </div>
  );
}