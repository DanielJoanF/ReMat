'use client';

import { useState, useRef, useEffect } from 'react';
import { Upload, Image as ImageIcon, X } from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';

const MAX_PHOTOS = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ACCEPTED_EXT = '.jpg,.jpeg,.png,.webp';

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/**
 * Read-only photo picker used on the create page. Files are held in local
 * state (preview only) and uploaded after the material is persisted.
 * No mock data — only real user-selected files.
 */
export function PhotoPicker({
  files,
  onChange,
}: {
  files: File[];
  onChange: (files: File[]) => void;
}) {
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [previews, setPreviews] = useState<string[]>([]);

  useEffect(() => {
    const urls = previews.map((p) => p);
    return () => urls.forEach((u) => {
      if (u.startsWith('blob:')) URL.revokeObjectURL(u);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const list = await Promise.all(
        files.map(async (f) => {
          if (f.type.startsWith('image/')) return readFileAsDataURL(f);
          return '';
        })
      );
      if (!cancelled) setPreviews(list);
    })();
    return () => { cancelled = true; };
  }, [files]);

  const add = (list: FileList | null) => {
    if (!list) return;
    const next = [...files];
    for (const f of Array.from(list)) {
      if (!ACCEPTED_TYPES.includes(f.type)) {
        toast({ type: 'warning', message: `"${f.name}" bukan format gambar (JPG/PNG/WebP).` });
        continue;
      }
      if (f.size > MAX_FILE_SIZE) {
        toast({ type: 'warning', message: `"${f.name}" melebihi 10MB.` });
        continue;
      }
      next.push(f);
    }
    onChange(next.slice(0, MAX_PHOTOS));
    if (inputRef.current) inputRef.current.value = '';
  };

  const remove = (idx: number) => onChange(files.filter((_, i) => i !== idx));

  return (
    <div className="space-y-4">
      {files.length === 0 ? (
        <div
          onClick={() => inputRef.current?.click()}
          className={cn(
            'flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-8 transition-colors',
            'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
          )}
        >
          <Upload className="mb-2 h-8 w-8 text-gray-400" />
          <p className="text-sm font-medium text-gray-700">Klik untuk memilih foto</p>
          <p className="mt-1 text-xs text-gray-500">JPG, PNG, WebP - Maks 10MB, hingga {MAX_PHOTOS} foto</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {files.map((f, i) => (
            <div key={`${f.name}-${i}`} className="group relative overflow-hidden rounded-lg border border-gray-200 aspect-square">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previews[i] || ''}
                alt={f.name}
                className="h-full w-full object-cover"
              />
              <button
                type="button"
                onClick={() => remove(i)}
                className="absolute right-2 top-2 rounded-md bg-white/90 p-1.5 text-red-600 shadow-md transition-colors hover:bg-red-50"
                title="Hapus foto"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
          {files.length < MAX_PHOTOS && (
            <div
              onClick={() => inputRef.current?.click()}
              className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed aspect-square border-gray-300 hover:border-primary-400 hover:bg-gray-50"
            >
              <Upload className="h-6 w-6 text-gray-400" />
              <span className="mt-1 text-xs text-gray-500">Tambah Foto</span>
            </div>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_EXT}
        multiple
        className="hidden"
        onChange={(e) => add(e.target.files)}
      />

      {files.length === 0 && (
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <ImageIcon className="h-4 w-4" />
          Belum ada foto dipilih (opsional).
        </div>
      )}
    </div>
  );
}