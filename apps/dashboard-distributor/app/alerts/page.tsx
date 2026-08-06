'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Bell,
  Info,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  Power,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { EmptyState } from '@/components/ui/empty-state';
import { SkeletonCard, SkeletonText } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';
import { useAuth } from '@/contexts/auth-context';
import { getData, patchData, RATE_LIMIT_EXCEEDED } from '@/lib/api-client';
import { formatDate } from '@/lib/utils';

// ─── Types ───────────────────────────────────────────────────────────────────

type AlertType = 'info' | 'warning' | 'error' | 'success';

interface Alert {
  id: string;
  type: AlertType;
  title: string;
  message: string;
  createdAt: string;
  active: boolean;
}

interface AlertsResponse {
  data: Alert[];
  total: number;
}

// ─── Config ──────────────────────────────────────────────────────────────────

const ALERT_ICON_MAP: Record<AlertType, typeof Info> = {
  info: Info,
  warning: AlertTriangle,
  error: AlertCircle,
  success: CheckCircle,
};

const ALERT_STYLE_MAP: Record<AlertType, { bg: string; icon: string; border: string; badge: 'info' | 'warning' | 'danger' | 'success' }> = {
  info: {
    bg: 'bg-blue-50',
    icon: 'text-blue-500',
    border: 'border-blue-200',
    badge: 'info',
  },
  warning: {
    bg: 'bg-amber-50',
    icon: 'text-amber-500',
    border: 'border-amber-200',
    badge: 'warning',
  },
  error: {
    bg: 'bg-red-50',
    icon: 'text-red-500',
    border: 'border-red-200',
    badge: 'danger',
  },
  success: {
    bg: 'bg-[#E8F5E9]',
    icon: 'text-[#2E7D32]',
    border: 'border-[#C8E6C9]',
    badge: 'success',
  },
};

const ALERT_TYPE_LABEL: Record<AlertType, string> = {
  info: 'Info',
  warning: 'Peringatan',
  error: 'Error',
  success: 'Berhasil',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function handleApiError(error: unknown, toast: ReturnType<typeof useToast>['toast'], fallback: string) {
  const message = error instanceof Error ? error.message : fallback;
  if (message === RATE_LIMIT_EXCEEDED) {
    toast({ type: 'warning', message: 'Terlalu banyak permintaan. Silakan coba lagi.' });
  } else {
    toast({ type: 'error', message });
  }
}

// ─── Alert Card Component ────────────────────────────────────────────────────

function AlertCard({
  alert,
  onDeactivate,
  deactivateLoading,
}: {
  alert: Alert;
  onDeactivate: (id: string) => void;
  deactivateLoading: boolean;
}) {
  const Icon = ALERT_ICON_MAP[alert.type] ?? Info;
  const styles = ALERT_STYLE_MAP[alert.type] ?? ALERT_STYLE_MAP.info;

  return (
    <Card className={`border ${styles.border} transition-all hover:shadow-md`}>
      <CardContent>
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div
            className={`flex-shrink-0 w-12 h-12 rounded-xl ${styles.bg} flex items-center justify-center`}
          >
            <Icon className={`w-6 h-6 ${styles.icon}`} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-semibold text-gray-900">{alert.title}</h3>
                  <Badge variant={styles.badge} className="text-xs">
                    {ALERT_TYPE_LABEL[alert.type]}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">{alert.message}</p>
                <p className="text-xs text-gray-400 mt-2">{formatDate(alert.createdAt)}</p>
              </div>
            </div>
          </div>

          {/* Deactivate Button */}
          {alert.active && (
            <div className="flex-shrink-0">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onDeactivate(alert.id)}
                disabled={deactivateLoading}
              >
                <Power className="w-3.5 h-3.5" />
                Nonaktifkan
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Loading Skeleton ────────────────────────────────────────────────────────

function AlertsSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardContent>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-surface-container animate-pulse flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-48 bg-surface-container animate-pulse rounded" />
                  <div className="h-5 w-16 bg-surface-container animate-pulse rounded-full" />
                </div>
                <div className="h-4 w-full bg-surface-container animate-pulse rounded" />
                <div className="h-4 w-2/3 bg-surface-container animate-pulse rounded" />
                <div className="h-3 w-32 bg-surface-container animate-pulse rounded" />
              </div>
              <div className="h-8 w-28 bg-surface-container animate-pulse rounded-lg flex-shrink-0" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function AlertsPage() {
  const { toast } = useToast();
  const { isReady } = useAuth();
  const toastRef = useRef(toast);
  useEffect(() => { toastRef.current = toast; }, [toast]);

  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  // Deactivate modal
  const [deactivateModalOpen, setDeactivateModalOpen] = useState(false);
  const [deactivateId, setDeactivateId] = useState<string | null>(null);
  const [deactivateLoading, setDeactivateLoading] = useState(false);

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getData<AlertsResponse>('/alerts/my');
      setAlerts(result.data ?? []);
    } catch (error: unknown) {
      handleApiError(error, toastRef.current, 'Gagal memuat data alert');
    } finally {
      setLoading(false);
    }
  }, []); // toast stabilized via ref

  useEffect(() => {
    // Wait until AuthProvider has written the user identity to localStorage,
    // so the API request carries the correct x-user-id / x-user-role headers.
    if (!isReady) return;
    fetchAlerts();
  }, [isReady, fetchAlerts]);

  const openDeactivateModal = (id: string) => {
    setDeactivateId(id);
    setDeactivateModalOpen(true);
  };

  const handleDeactivate = async () => {
    if (!deactivateId) return;
    setDeactivateLoading(true);
    try {
      await patchData(`/alerts/${deactivateId}/deactivate`);
      toastRef.current({ type: 'success', message: 'Alert berhasil dinonaktifkan.' });
      setDeactivateModalOpen(false);
      setDeactivateId(null);
      fetchAlerts();
    } catch (error: unknown) {
      handleApiError(error, toastRef.current, 'Gagal menonaktifkan alert');
    } finally {
      setDeactivateLoading(false);
    }
  };

  const activeAlerts = alerts.filter((a) => a.active);
  const inactiveAlerts = alerts.filter((a) => !a.active);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Bell className="w-6 h-6 text-[#2E7D32]" />
            Alert Saya
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Kelola notifikasi dan alert terkait aktivitas Anda.
          </p>
        </div>

        {/* Content */}
        {loading ? (
          <AlertsSkeleton />
        ) : alerts.length === 0 ? (
          <Card>
            <EmptyState
              icon={<Bell className="w-12 h-12" />}
              title="Tidak ada alert aktif saat ini"
              description="Anda akan melihat alert di sini ketika ada notifikasi penting."
            />
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Active Alerts */}
            {activeAlerts.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Alert Aktif ({activeAlerts.length})
                </h2>
                <div className="space-y-3">
                  {activeAlerts.map((alert) => (
                    <AlertCard
                      key={alert.id}
                      alert={alert}
                      onDeactivate={openDeactivateModal}
                      deactivateLoading={deactivateLoading}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Inactive Alerts */}
            {inactiveAlerts.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
                  Alert Nonaktif ({inactiveAlerts.length})
                </h2>
                <div className="space-y-3 opacity-60">
                  {inactiveAlerts.map((alert) => (
                    <AlertCard
                      key={alert.id}
                      alert={alert}
                      onDeactivate={() => {}}
                      deactivateLoading={false}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* No active but has inactive */}
            {activeAlerts.length === 0 && inactiveAlerts.length > 0 && (
              <Card>
                <EmptyState
                  icon={<Bell className="w-12 h-12" />}
                  title="Tidak ada alert aktif saat ini"
                  description="Semua alert telah dinonaktifkan."
                />
              </Card>
            )}
          </div>
        )}
      </div>

      {/* Deactivate Confirmation Modal */}
      <Modal
        isOpen={deactivateModalOpen}
        onClose={() => setDeactivateModalOpen(false)}
        title="Nonaktifkan Alert"
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
              <Power className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                Nonaktifkan alert ini?
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Alert ini tidak akan muncul lagi di daftar alert aktif Anda.
              </p>
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              variant="secondary"
              onClick={() => setDeactivateModalOpen(false)}
              disabled={deactivateLoading}
            >
              Batal
            </Button>
            <Button
              variant="primary"
              onClick={handleDeactivate}
              loading={deactivateLoading}
            >
              Nonaktifkan
            </Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
