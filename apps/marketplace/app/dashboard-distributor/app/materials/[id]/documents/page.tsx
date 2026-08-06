'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  Upload,
  FileText,
  Image,
  Trash2,
  File,
  AlertCircle,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import { SkeletonCard } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';
import { getData, deleteData, RATE_LIMIT_EXCEEDED } from '@/lib/api-client';

interface Material {
  id: string;
  name: string;
}

interface MaterialDoc {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  type: string;
  url: string;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];
const ACCEPTED_EXT = '.jpg,.jpeg,.png,.pdf';
const MAX_PHOTOS = 5;
const MAX_MSDS = 1;
const MAX_CERTIFICATES = 1;

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(fileType: string) {
  if (fileType?.startsWith('image/')) return <Image className="h-5 w-5 text-blue-500" />;
  return <FileText className="h-5 w-5 text-red-500" />;
}

function getDocTypeLabel(type: string) {
  const labels: Record<string, string> = {
    PHOTO: 'Foto',
    MSDS: 'MSDS',
    CERTIFICATE: 'Sertifikat',
  };
  return labels[type] || type;
}

export default function MaterialDocumentsPage() {
  const params = useParams();
  const router = useRouter();
  const materialId = params.id as string;
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [material, setMaterial] = useState<Material | null>(null);
  const [documents, setDocuments] = useState<MaterialDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [deleteModal, setDeleteModal] = useState<MaterialDoc | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchDocuments = useCallback(async () => {
    try {
      setLoading(true);
      const [matRes, docsRes] = await Promise.all([
        getData<Material>(`/materials/${materialId}`),
        getData<{ data: MaterialDoc[] }>(`/materials/${materialId}/documents`).catch(() => ({ data: [] })),
      ]);
      setMaterial(matRes);
      setDocuments(docsRes.data || []);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal memuat data';
      if (msg === RATE_LIMIT_EXCEEDED) {
        toast({ type: 'warning', message: 'Terlalu banyak permintaan. Coba lagi.' });
      } else {
        toast({ type: 'error', message: msg });
      }
    } finally {
      setLoading(false);
    }
  }, [materialId, toast]);

  useEffect(() => {
    if (materialId) fetchDocuments();
  }, [materialId, fetchDocuments]);

  const countByType = (type: string) =>
    documents.filter((d) => d.type === type).length;

  const validateFile = (file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return 'Format file tidak didukung. Hanya JPG, PNG, PDF.';
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'Ukuran file terlalu besar. Maksimal 10MB.';
    }
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png'].includes(ext || '') && countByType('PHOTO') >= MAX_PHOTOS) {
      return `Batas foto tercapai (maks ${MAX_PHOTOS}).`;
    }
    if (ext === 'pdf') {
      const nameLower = file.name.toLowerCase();
      if ((nameLower.includes('msds') || nameLower.includes('safety')) && countByType('MSDS') >= MAX_MSDS) {
        return `Batas MSDS tercapai (maks ${MAX_MSDS}).`;
      }
      if ((nameLower.includes('sertif') || nameLower.includes('cert')) && countByType('CERTIFICATE') >= MAX_CERTIFICATES) {
        return `Batas sertifikat tercapai (maks ${MAX_CERTIFICATES}).`;
      }
    }
    return null;
  };

  const determineDocType = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png'].includes(ext || '')) return 'PHOTO';
    const nameLower = filename.toLowerCase();
    if (nameLower.includes('msds') || nameLower.includes('safety')) return 'MSDS';
    if (nameLower.includes('sertif') || nameLower.includes('cert')) return 'CERTIFICATE';
    return 'PHOTO';
  };

  const handleUpload = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);

    // Validate all files first
    for (const file of fileArray) {
      const err = validateFile(file);
      if (err) {
        toast({ type: 'warning', message: err });
        return;
      }
    }

    setUploading(true);
    try {
      for (const file of fileArray) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', determineDocType(file.name));

        await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/materials/${materialId}/documents`,
          {
            method: 'POST',
            headers: {
              'x-user-id': localStorage.getItem('x-user-id') || 'dist-1',
              'x-user-role': localStorage.getItem('x-user-role') || 'DISTRIBUTOR',
            },
            body: formData,
          }
        );
      }
      toast({ type: 'success', message: `${fileArray.length} file berhasil diupload.` });
      fetchDocuments();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal upload file';
      if (msg === RATE_LIMIT_EXCEEDED) {
        toast({ type: 'warning', message: 'Terlalu banyak permintaan.' });
      } else {
        toast({ type: 'error', message: msg });
      }
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length) handleUpload(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDelete = async () => {
    if (!deleteModal) return;
    setDeleting(true);
    try {
      await deleteData(`/materials/${materialId}/documents/${deleteModal.id}`);
      toast({ type: 'success', message: 'Dokumen berhasil dihapus.' });
      setDeleteModal(null);
      fetchDocuments();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal menghapus dokumen';
      toast({ type: 'error', message: msg });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              {material?.name || 'Dokumen Material'}
            </h2>
            <p className="text-sm text-gray-500">Kelola dokumen dan foto material</p>
          </div>
        </div>

        {/* Upload zone */}
        <Card>
          <CardContent>
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-8 py-10 transition-colors ${
                dragOver
                  ? 'border-primary-500 bg-[#E8F5E9]'
                  : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
              }`}
            >
              <Upload className={`mb-3 h-10 w-10 ${dragOver ? 'text-[#2E7D32]' : 'text-gray-400'}`} />
              <p className="text-sm font-medium text-gray-700">
                {dragOver ? 'Lepaskan file di sini' : 'Klik atau seret file ke sini'}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                JPG, PNG, PDF - Maks 10MB per file
              </p>
              <p className="mt-1 text-xs text-gray-400">
                Foto: {MAX_PHOTOS} maks | MSDS: {MAX_MSDS} maks | Sertifikat: {MAX_CERTIFICATES} maks
              </p>
              {uploading && (
                <p className="mt-3 text-sm font-medium text-[#1B5E20]">Mengupload...</p>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_EXT}
              multiple
              onChange={(e) => {
                if (e.target.files?.length) handleUpload(e.target.files);
                e.target.value = '';
              }}
              className="hidden"
            />
          </CardContent>
        </Card>

        {/* Document list */}
        <Card>
          <CardHeader>
            <CardTitle>Dokumen ({documents.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            ) : documents.length === 0 ? (
              <div className="py-12 text-center">
                <FileText className="mx-auto mb-2 h-10 w-10 text-gray-300" />
                <p className="text-sm text-gray-500">Belum ada dokumen yang diupload.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between rounded-lg border border-gray-100 p-3 hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      {getFileIcon(doc.fileType)}
                      <div>
                        <p className="text-sm font-medium text-gray-800">{doc.fileName}</p>
                        <p className="text-xs text-gray-400">
                          {formatFileSize(doc.fileSize)} · {getDocTypeLabel(doc.type)}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteModal(doc)}
                      className="text-red-500 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete confirmation modal */}
      <Modal
        isOpen={!!deleteModal}
        onClose={() => setDeleteModal(null)}
        title="Hapus Dokumen"
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-red-100">
              <AlertCircle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-800">
                Hapus &quot;{deleteModal?.fileName}&quot;?
              </p>
              <p className="mt-1 text-sm text-gray-500">
                Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setDeleteModal(null)} disabled={deleting}>
              Batal
            </Button>
            <Button variant="danger" onClick={handleDelete} loading={deleting}>
              <Trash2 className="h-4 w-4" />
              Hapus
            </Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
