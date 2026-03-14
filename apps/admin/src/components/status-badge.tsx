import { STATUS_COLORS, CHANNEL_COLORS, type OrderStatus, type Channel } from '@/lib/constants';

export function StatusBadge({ status }: { status: string }) {
  const colors = STATUS_COLORS[status as OrderStatus] || 'bg-gray-100 text-gray-800';
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${colors}`}>
      {status}
    </span>
  );
}

export function ChannelBadge({ channel }: { channel: string }) {
  const colors = CHANNEL_COLORS[channel as Channel] || 'bg-gray-100 text-gray-800';
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${colors}`}>
      {channel}
    </span>
  );
}
