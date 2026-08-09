import { cn } from '@/lib/utils';

export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PAID' | 'SHIPPED' | 'COMPLETED' | 'CANCELLED';

/** Palet badge status yang dipakai bersama di halaman list & detail pesanan. */
export const STATUS_BADGE_STYLES: Record<OrderStatus, string> = {
  PENDING: 'bg-[#FEF3C7] text-[#92400E]', // kuning (amber)
  CONFIRMED: 'bg-[#FFEDD5] text-[#C2410C]', // oranye
  PAID: 'bg-[#EDE9FE] text-[#6D28D9]', // ungu
  SHIPPED: 'bg-[#DBEAFE] text-[#1D4ED8]', // biru
  COMPLETED: 'bg-[#D1FAE5] text-[#047857]', // hijau
  CANCELLED: 'bg-[#FEE2E2] text-[#B91C1C]', // merah
};

export const STATUS_BADGE_LABELS: Record<OrderStatus, string> = {
  PENDING: 'Menunggu',
  CONFIRMED: 'Dikonfirmasi',
  PAID: 'Dibayar',
  SHIPPED: 'Dikirim',
  COMPLETED: 'Selesai',
  CANCELLED: 'Dibatalkan',
};

interface OrderStatusBadgeProps {
  status: OrderStatus;
  className?: string;
}

export function OrderStatusBadge({ status, className }: OrderStatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold whitespace-nowrap',
        STATUS_BADGE_STYLES[status] ?? 'bg-gray-100 text-gray-600',
        className
      )}
    >
      {STATUS_BADGE_LABELS[status] ?? status}
    </span>
  );
}

/** Alias agar barrel `@/components/ui` (`export { StatusBadge } from './status-badge'`) tetap valid. */
export const StatusBadge = OrderStatusBadge;