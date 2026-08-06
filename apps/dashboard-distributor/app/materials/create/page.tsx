'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Save, ArrowLeft } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { useToast } from '@/components/ui/toast';
import { useAuth } from '@/contexts/auth-context';
import { getData, postData, uploadFile } from '@/lib/api-client';
import { PhotoPicker } from '@/components/materials/photo-picker';

const materialSchema = z.object({
  nama: z.string().min(1, 'Nama material wajib diisi'),
  deskripsi: z.string().min(1, 'Deskripsi wajib diisi'),
  kategori: z.string().min(1, 'Kategori wajib dipilih'),
  grade: z.string().min(1, 'Grade wajib dipilih'),
  harga: z.coerce.number().positive('Harga harus lebih dari 0'),
  unit: z.string().min(1, 'Unit wajib dipilih'),
  stok: z.coerce.number().nonnegative('Stok tidak boleh negatif'),
  lokasi: z.string().min(1, 'Lokasi wajib diisi'),
});

type MaterialFormData = z.infer<typeof materialSchema>;

interface Category { id: string; name: string; label?: string; }

const gradeOptions = [
  { value: 'A', label: 'Grade A (Premium)' },
  { value: 'B', label: 'Grade B (Standar)' },
  { value: 'C', label: 'Grade C (Kurang)' },
  { value: 'D', label: 'Grade D (Terendah)' },
];

const unitOptions = [
  { value: 'KG', label: 'Kilogram (KG)' },
  { value: 'TON', label: 'Ton' },
  { value: 'LITER', label: 'Liter' },
];

export default function CreateMaterialPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { isReady } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [photos, setPhotos] = useState<File[]>([]);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<MaterialFormData>({
    resolver: zodResolver(materialSchema),
  });

  useEffect(() => {
    // Wait until AuthProvider has written the user identity to localStorage.
    if (!isReady) return;
    const fetchCategories = async () => {
      try {
        const response = await getData<{ data: Category[] }>('/categories');
        setCategories(response.data || []);
      } catch {
        toast({ type: 'error', message: 'Gagal memuat kategori' });
      }
    };
    fetchCategories();
  }, [isReady]); // eslint-disable-line react-hooks/exhaustive-deps

  const categoryOptions = categories.map((c) => ({ value: c.id, label: c.name || c.label || '' }));

  const onSubmit = async (data: MaterialFormData) => {
    try {
      setSubmitting(true);
      const created = await postData<{ data: { id: string } }>('/materials', {
        title: data.nama, description: data.deskripsi, categoryId: data.kategori,
        qualityGrade: data.grade, price: data.harga, unit: data.unit,
        quantity: data.stok, location: data.lokasi,
      });
      const materialId = created.data?.id;

      // Upload foto yang dipilih setelah material tersimpan (draf).
      // Gagal upload hanya menampilkan toast — tidak mengubah data material.
      if (materialId) {
        for (const file of photos) {
          try {
            await uploadFile(`/materials/${materialId}/documents`, file, 'PHOTO');
          } catch {
            toast({ type: 'error', message: `Foto "${file.name}" gagal diupload.` });
          }
        }
      }

      toast({ type: 'success', message: 'Material berhasil disimpan sebagai draf' });
      router.push('/materials');
    } catch (err) {
      toast({ type: 'error', message: err instanceof Error ? err.message : 'Gagal menyimpan material' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="secondary" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Tambah Material</h2>
            <p className="text-sm text-gray-500">Isi informasi material baru</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Informasi Dasar</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Input label="Nama Material" required placeholder="Contoh: Botol PET Bening" error={errors.nama?.message} {...register('nama')} />
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Deskripsi <span className="text-red-500">*</span></label>
                <textarea placeholder="Deskripsikan material secara detail..." rows={4}
                  className={`block w-full rounded-md border px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:border-[#1B5E20] focus:outline-none focus:ring-1 focus:ring-[#1B5E20] ${errors.deskripsi ? 'border-red-500' : 'border-gray-300'}`}
                  {...register('deskripsi')} />
                {errors.deskripsi && <p className="text-xs text-red-500">{errors.deskripsi.message}</p>}
              </div>
              <Select label="Kategori" required options={categoryOptions} placeholder="Pilih kategori" error={errors.kategori?.message} value={watch('kategori')} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setValue('kategori', e.target.value)} />
              <Select label="Grade" required options={gradeOptions} placeholder="Pilih grade" error={errors.grade?.message} value={watch('grade')} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setValue('grade', e.target.value)} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Harga & Stok</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input label="Harga" required type="number" placeholder="0" error={errors.harga?.message} {...register('harga')} />
                <Select label="Unit" required options={unitOptions} placeholder="Pilih unit" error={errors.unit?.message} value={watch('unit')} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setValue('unit', e.target.value)} />
                <Input label="Stok" required type="number" placeholder="0" error={errors.stok?.message} {...register('stok')} />
                <Input label="Lokasi" required placeholder="Contoh: Jakarta Selatan" error={errors.lokasi?.message} {...register('lokasi')} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Foto Material</CardTitle></CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-gray-500">Upload foto produk (opsional). Foto diunggah setelah material tersimpan.</p>
              <PhotoPicker files={photos} onChange={setPhotos} />
            </CardContent>
          </Card>

          <div className="flex items-center justify-end gap-3">
            <Button variant="secondary" type="button" onClick={() => router.push('/materials')}>Batal</Button>
            <Button variant="primary" type="submit" loading={submitting}><Save className="h-4 w-4" /> Simpan Draf</Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}