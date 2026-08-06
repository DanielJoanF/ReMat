'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Save, ArrowLeft } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { StatusBadge } from '@/components/ui/status-badge';
import { useToast } from '@/components/ui/toast';
import { getData, putData } from '@/lib/api-client';

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

interface Category { id: string; name: string; }
interface Material { id: string; name: string; description: string; categoryId: string; grade: string; price: number; unit: string; stock: number; location: string; status: string; }

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

export default function EditMaterialPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [material, setMaterial] = useState<Material | null>(null);

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<MaterialFormData>({
    resolver: zodResolver(materialSchema),
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [matRes, catRes] = await Promise.all([
          getData<{ data: Material }>(`/materials/${id}`),
          getData<{ data: Category[] }>('/categories'),
        ]);
        const mat = matRes.data;
        setMaterial(mat);
        setCategories(catRes.data || []);
        reset({
          nama: mat.name, deskripsi: mat.description, kategori: mat.categoryId,
          grade: mat.grade, harga: mat.price, unit: mat.unit, stok: mat.stock, lokasi: mat.location,
        });
      } catch {
        toast({ type: 'error', message: 'Gagal memuat data material' });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, reset, toast]);

  const categoryOptions = categories.map((c) => ({ value: c.id, label: c.name }));
  const isEditable = material?.status === 'DRAFT' || material?.status === 'REJECTED';

  const onSubmit = async (data: MaterialFormData) => {
    try {
      setSubmitting(true);
      await putData(`/materials/${id}`, {
        name: data.nama, description: data.deskripsi, categoryId: data.kategori,
        grade: data.grade, price: data.harga, unit: data.unit, stock: data.stok, location: data.lokasi,
      });
      toast({ type: 'success', message: 'Material berhasil diperbarui' });
      router.push('/materials');
    } catch (err) {
      toast({ type: 'error', message: err instanceof Error ? err.message : 'Gagal memperbarui material' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-3xl space-y-6">
          <div className="h-8 bg-gray-200 rounded animate-pulse w-48" />
          <div className="h-64 bg-gray-200 rounded animate-pulse" />
        </div>
      </DashboardLayout>
    );
  }

  if (!material) {
    return (
      <DashboardLayout>
        <div className="text-center py-12"><p className="text-gray-500">Material tidak ditemukan.</p></div>
      </DashboardLayout>
    );
  }

  if (!isEditable) {
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-3xl space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="secondary" onClick={() => router.back()}><ArrowLeft className="h-4 w-4" /></Button>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Edit Material</h2>
              <p className="text-sm text-gray-500">Status material saat ini: <StatusBadge status={material.status as any} /></p>
            </div>
          </div>
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-600">Material dengan status <strong>{material.status}</strong> tidak dapat diedit.</p>
              <p className="text-sm text-gray-400 mt-1">Hanya material dengan status DRAFT atau REJECTED yang dapat diedit.</p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="secondary" onClick={() => router.back()}><ArrowLeft className="h-4 w-4" /></Button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Edit Material</h2>
            <p className="text-sm text-gray-500">Perbarui informasi material</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Informasi Dasar</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Input label="Nama Material" required placeholder="Contoh: Botol PET Bening" error={errors.nama?.message} {...register('nama')} />
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Deskripsi <span className="text-red-500">*</span></label>
                <textarea placeholder="Deskripsikan material..." rows={4}
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

          <div className="flex items-center justify-end gap-3">
            <Button variant="secondary" type="button" onClick={() => router.push('/materials')}>Batal</Button>
            <Button variant="primary" type="submit" loading={submitting}><Save className="h-4 w-4" /> Simpan Perubahan</Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
