'use client';

import { useState } from 'react';
import { apiFetch } from '@/lib/api';
import { ChannelBadge } from '@/components/status-badge';

export interface ChannelConnectionDto {
  id: string;
  channel: 'SHOPEE' | 'TIKTOK';
  shopId: string;
  shopName: string;
  syncEnabled: boolean;
  syncIntervalMinutes: number;
  lastSyncAt: string | null;
  lastSyncStatus: 'IDLE' | 'RUNNING' | 'SUCCESS' | 'FAILED';
  createdAt: string;
}

const SYNC_STATUS_COLORS: Record<string, string> = {
  SUCCESS: 'bg-green-100 text-green-800',
  FAILED: 'bg-red-100 text-red-800',
  RUNNING: 'bg-yellow-100 text-yellow-800',
  IDLE: 'bg-gray-100 text-gray-800',
};

function formatRelativeTime(dateStr: string | null): string {
  if (!dateStr) return 'Never';
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

interface ChannelCardProps {
  connection: ChannelConnectionDto;
  onUpdate: () => void;
  onViewLogs: (connection: ChannelConnectionDto) => void;
}

export function ChannelCard({ connection, onUpdate, onViewLogs }: ChannelCardProps) {
  const [syncing, setSyncing] = useState(false);
  const [updating, setUpdating] = useState(false);

  async function handleSyncNow() {
    setSyncing(true);
    try {
      await apiFetch(`/admin/channels/${connection.id}/sync`, { method: 'POST' });
      onUpdate();
    } catch {
      // error handled by apiFetch
    } finally {
      setSyncing(false);
    }
  }

  async function handleToggleSync() {
    setUpdating(true);
    try {
      await apiFetch(`/admin/channels/${connection.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ syncEnabled: !connection.syncEnabled }),
      });
      onUpdate();
    } catch {
      // error handled by apiFetch
    } finally {
      setUpdating(false);
    }
  }

  async function handleIntervalChange(interval: number) {
    setUpdating(true);
    try {
      await apiFetch(`/admin/channels/${connection.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ syncIntervalMinutes: interval }),
      });
      onUpdate();
    } catch {
      // error handled by apiFetch
    } finally {
      setUpdating(false);
    }
  }

  async function handleDisconnect() {
    if (!confirm(`Disconnect ${connection.shopName}? This will stop all syncing and remove credentials.`)) {
      return;
    }
    try {
      await apiFetch(`/admin/channels/${connection.id}`, { method: 'DELETE' });
      onUpdate();
    } catch {
      // error handled by apiFetch
    }
  }

  const statusColors = SYNC_STATUS_COLORS[connection.lastSyncStatus] || SYNC_STATUS_COLORS.IDLE;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">{connection.shopName}</h3>
            <div className="mt-1 flex items-center gap-2">
              <ChannelBadge channel={connection.channel} />
              <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusColors}`}>
                {connection.lastSyncStatus}
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={handleDisconnect}
          className="text-xs text-red-600 hover:text-red-800"
        >
          Disconnect
        </button>
      </div>

      <div className="mt-4 text-sm text-gray-500">
        Last sync: {formatRelativeTime(connection.lastSyncAt)}
      </div>

      <div className="mt-4 flex items-center gap-4">
        <button
          onClick={handleSyncNow}
          disabled={syncing}
          className="rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {syncing ? 'Syncing...' : 'Sync Now'}
        </button>

        <label className="flex items-center gap-2 text-sm">
          <button
            role="switch"
            aria-checked={connection.syncEnabled}
            onClick={handleToggleSync}
            disabled={updating}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
              connection.syncEnabled ? 'bg-blue-600' : 'bg-gray-300'
            } ${updating ? 'opacity-50' : ''}`}
          >
            <span
              className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                connection.syncEnabled ? 'translate-x-4' : 'translate-x-0.5'
              }`}
            />
          </button>
          Auto-sync
        </label>

        <select
          value={connection.syncIntervalMinutes}
          onChange={(e) => handleIntervalChange(Number(e.target.value))}
          disabled={updating}
          className="rounded-md border px-2 py-1 text-sm disabled:opacity-50"
        >
          <option value={5}>5 min</option>
          <option value={10}>10 min</option>
          <option value={15}>15 min</option>
        </select>

        <button
          onClick={() => onViewLogs(connection)}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          View Logs
        </button>
      </div>
    </div>
  );
}
