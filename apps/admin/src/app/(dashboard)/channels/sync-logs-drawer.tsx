'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import { DataTable, type Column } from '@/components/data-table';
import type { ChannelConnectionDto } from './channel-card';

export interface SyncLogDto {
  id: string;
  status: 'SUCCESS' | 'FAILED' | 'RUNNING' | 'IDLE';
  ordersFetched: number;
  ordersCreated: number;
  ordersUpdated: number;
  errorType: string | null;
  errorMessage: string | null;
  durationMs: number | null;
  startedAt: string;
  completedAt: string | null;
}

interface SyncLogsResponse {
  data: SyncLogDto[];
  total: number;
  page: number;
  limit: number;
}

const LOG_STATUS_COLORS: Record<string, string> = {
  SUCCESS: 'bg-green-100 text-green-800',
  FAILED: 'bg-red-100 text-red-800',
  RUNNING: 'bg-yellow-100 text-yellow-800',
  IDLE: 'bg-gray-100 text-gray-800',
};

const ERROR_TYPE_COLORS: Record<string, string> = {
  rate_limit: 'bg-orange-100 text-orange-800',
  auth_expired: 'bg-red-100 text-red-800',
  network_error: 'bg-yellow-100 text-yellow-800',
  mapping_error: 'bg-purple-100 text-purple-800',
};

interface SyncLogsDrawerProps {
  connection: ChannelConnectionDto | null;
  onClose: () => void;
}

export function SyncLogsDrawer({ connection, onClose }: SyncLogsDrawerProps) {
  const [data, setData] = useState<SyncLogsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const limit = 10;

  const fetchLogs = useCallback(async () => {
    if (!connection) return;
    setLoading(true);
    try {
      const res = await apiFetch<SyncLogsResponse>(
        `/admin/channels/${connection.id}/logs?page=${page}&limit=${limit}`,
      );
      setData(res);
    } catch {
      // error handled by apiFetch
    } finally {
      setLoading(false);
    }
  }, [connection, page]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  if (!connection) return null;

  const columns: Column<SyncLogDto>[] = [
    {
      key: 'startedAt',
      header: 'Time',
      render: (row) => new Date(row.startedAt).toLocaleString(),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => {
        const colors = LOG_STATUS_COLORS[row.status] || LOG_STATUS_COLORS.IDLE;
        return (
          <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${colors}`}>
            {row.status}
          </span>
        );
      },
    },
    { key: 'ordersFetched', header: 'Fetched' },
    { key: 'ordersCreated', header: 'Created' },
    { key: 'ordersUpdated', header: 'Updated' },
    {
      key: 'durationMs',
      header: 'Duration',
      render: (row) => (row.durationMs != null ? `${(row.durationMs / 1000).toFixed(1)}s` : '-'),
    },
    {
      key: 'errorType',
      header: 'Error',
      render: (row) => {
        if (!row.errorType) return '-';
        const chipColor = ERROR_TYPE_COLORS[row.errorType] || 'bg-gray-100 text-gray-800';
        return (
          <div className="flex flex-col gap-1">
            <span className={`inline-block w-fit rounded-full px-2 py-0.5 text-xs font-medium ${chipColor}`}>
              {row.errorType}
            </span>
            {row.errorMessage && (
              <span className="text-xs text-gray-500">{row.errorMessage}</span>
            )}
          </div>
        );
      },
    },
  ];

  const totalPages = data ? Math.ceil(data.total / limit) : 1;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-3xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h3 className="text-lg font-semibold">
            Sync Logs - {connection.shopName}
          </h3>
          <button
            onClick={onClose}
            className="rounded-md px-2 py-1 text-gray-500 hover:bg-gray-100"
          >
            Close
          </button>
        </div>
        <div className="overflow-y-auto p-6">
          {loading ? (
            <p className="text-sm text-gray-500">Loading...</p>
          ) : (
            <DataTable
              columns={columns}
              data={data?.data ?? []}
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          )}
        </div>
      </div>
    </div>
  );
}
