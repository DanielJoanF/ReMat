'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Settings, Bell, ShieldCheck, Save, ArrowRight, Mail, Building2,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { useAuth } from '@/contexts/auth-context';

// ─── Config ────────────────────────────────────────────────────────────────

const EMAIL_MASTER_KEY = 'remat_notif_email';
const EMAIL_PREFS: { key: string; label: string; desc: string }[] = [
  { key: 'remat_notif_email_order', label: 'Pesanan Baru Masuk', desc: 'Info saat ada pesanan masuk ke toko Anda.' },
  { key: 'remat_notif_email_stock', label: 'Stok Material Menipis', desc: 'Peringatan ketika stok material hampir habis.' },
  { key: 'remat_notif_email_payment', label: 'Pembayaran Diterima', desc: 'Info saat pembayaran pesanan telah diterima.' },
  { key: 'remat_notif_email_market', label: 'Update Pasar & Promo', desc: 'Berita terbaru seputar pasar dan promosi ReMat.' },
];

const PUSH_PREFS: { key: string; label: string; desc: string }[] = [
  { key: 'remat_notif_push_order', label: 'Pesanan Baru', desc: 'Notifikasi push saat ada pesanan baru masuk.' },
  { key: 'remat_notif_push_stock', label: 'Stok Menipis', desc: 'Notifikasi push saat stok hampir habis.' },
];

function loadPref(key: string, fallback: boolean): boolean {
  if (typeof window === 'undefined') return fallback;
  const raw = localStorage.getItem(key);
  return raw === null ? fallback : raw === 'true';
}

// ─── Toggle ────────────────────────────────────────────────────────────────

function Toggle({
  label, desc, checked, onToggle, disabled, indent = false,
}: {
  label: string; desc: string; checked: boolean; onToggle: () => void; disabled?: boolean; indent?: boolean;
}) {
  return (
    <div
      className={`flex items-start justify-between gap-4 py-2.5 border-b border-gray-100 last:border-0 ${
        indent ? 'ml-6 pl-4 border-l border-gray-200' : ''
      } ${disabled ? 'opacity-50' : ''}`}
    >
      <div>
        <p className="text-sm font-semibold text-gray-900">{label}</p>
        <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
      </div>
      <button
        type="button"
        onClick={onToggle}
        disabled={disabled}
        aria-pressed={checked}
        aria-disabled={disabled}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${
          checked ? 'bg-[#2E7D32]' : 'bg-gray-200'
        } ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}

export default function DistributorSettingsPage() {
  const { toast } = useToast();
  const { isReady } = useAuth();
  const toastRef = useRef(toast);
  useEffect(() => { toastRef.current = toast; }, [toast]);

  // Email channel: master toggle + child prefs
  const [emailMaster, setEmailMaster] = useState(true);
  const [emailPrefs, setEmailPrefs] = useState<Record<string, boolean>>({});

  // Push channel: standalone prefs
  const [pushPrefs, setPushPrefs] = useState<Record<string, boolean>>({});

  const [saving, setSaving] = useState(false);

  // Muat preferensi dari localStorage (backend belum punya endpoint notifikasi distributor)
  useEffect(() => {
    setEmailMaster(loadPref(EMAIL_MASTER_KEY, true));
    const emailInit: Record<string, boolean> = {};
    EMAIL_PREFS.forEach((p) => { emailInit[p.key] = loadPref(p.key, true); });
    setEmailPrefs(emailInit);

    const pushInit: Record<string, boolean> = {};
    PUSH_PREFS.forEach((p) => { pushInit[p.key] = loadPref(p.key, false); });
    setPushPrefs(pushInit);
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      localStorage.setItem(EMAIL_MASTER_KEY, String(emailMaster));
      Object.entries(emailPrefs).forEach(([k, v]) => localStorage.setItem(k, String(v)));
      Object.entries(pushPrefs).forEach(([k, v]) => localStorage.setItem(k, String(v)));
      toastRef.current({ type: 'success', message: 'Pengaturan notifikasi disimpan.' });
    } catch {
      toastRef.current({ type: 'error', message: 'Gagal menyimpan pengaturan.' });
    } finally {
      setSaving(false);
    }
  };

  const emailDisabled = !emailMaster;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Settings className="w-6 h-6 text-[#2E7D32]" /> Pengaturan
          </h1>
          <p className="text-sm text-gray-500 mt-1">Kelola preferensi akun dan notifikasi distributor Anda.</p>
        </div>

        {/* CTA menuju Profil Toko — single source of truth untuk data toko */}
        <Card className="bg-gradient-to-r from-[#065F46] to-[#047857] text-white border-0">
          <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-5">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15">
                <Building2 className="h-5 w-5" />
              </span>
              <div>
                <p className="font-semibold">Data Toko &amp; Perusahaan</p>
                <p className="text-sm text-emerald-100">
                  Untuk mengubah data profil &amp; perusahaan, kunjungi Profil Toko.
                </p>
              </div>
            </div>
            <Link
              href="/profile"
              className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-[#065F46] shadow-sm transition hover:bg-emerald-50"
            >
              Profil Toko <ArrowRight className="h-4 w-4" />
            </Link>
          </CardContent>
        </Card>

        {/* Notifikasi */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-[#2E7D32]" /> Preferensi Notifikasi
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {/* Channel: Email — master toggle */}
            <div className="pb-1">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-[#2E7D32]" />
                <p className="text-sm font-bold text-gray-800">Notifikasi Email</p>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">Aktifkan semua notifikasi email tentang aktivitas toko Anda.</p>
            </div>

            <Toggle
              label="Aktifkan Notifikasi Email"
              desc="Master switch untuk semua notifikasi email."
              checked={emailMaster}
              onToggle={() => setEmailMaster(!emailMaster)}
            />

            {/* Child prefs: indented, disabled saat master off */}
            {EMAIL_PREFS.map(({ key, label, desc }) => (
              <Toggle
                key={key}
                label={label}
                desc={desc}
                checked={emailPrefs[key] ?? false}
                disabled={emailDisabled}
                indent
                onToggle={() =>
                  setEmailPrefs((prev) => ({ ...prev, [key]: !(prev[key] ?? false) }))
                }
              />
            ))}

            {/* Channel: Push / In-app */}
            <div className="pb-1 pt-4">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-[#2E7D32]" />
                <p className="text-sm font-bold text-gray-800">Notifikasi Push / In-app</p>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">Notifikasi instan saat Anda sedang menggunakan aplikasi.</p>
            </div>

            {PUSH_PREFS.map(({ key, label, desc }) => (
              <Toggle
                key={key}
                label={label}
                desc={desc}
                checked={pushPrefs[key] ?? false}
                onToggle={() =>
                  setPushPrefs((prev) => ({ ...prev, [key]: !(prev[key] ?? false) }))
                }
              />
            ))}

            <div className="flex justify-end pt-3">
              <Button variant="primary" onClick={handleSave} loading={saving}>
                <Save className="w-4 h-4" /> Simpan Pengaturan
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Keamanan */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#2E7D32]" /> Keamanan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Kelola kata sandi dan keamanan akun Anda melalui halaman login.
            </p>
            <Button
              variant="secondary"
              className="mt-4"
              onClick={() => {
                window.location.href = process.env.NEXT_PUBLIC_LOGIN_URL || 'http://localhost:3003/';
              }}
            >
              Ubah Kata Sandi
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}