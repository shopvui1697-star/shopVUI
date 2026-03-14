'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import { ChannelCard, type ChannelConnectionDto } from './channel-card';
import { SyncLogsDrawer } from './sync-logs-drawer';

const SUPPORTED_CHANNELS = [
  { key: 'SHOPEE' as const, label: 'Shopee', oauthPath: '/channels/oauth/shopee' },
  { key: 'TIKTOK' as const, label: 'TikTok Shop', oauthPath: '/channels/oauth/tiktok' },
];

export default function ChannelsPage() {
  const [connections, setConnections] = useState<ChannelConnectionDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [logsConnection, setLogsConnection] = useState<ChannelConnectionDto | null>(null);

  const fetchConnections = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch<ChannelConnectionDto[]>('/admin/channels');
      setConnections(res);
    } catch {
      // error handled by apiFetch
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Channels</h2>
        <p className="mt-1 text-sm text-gray-500">
          Connect your sales channels to automatically sync orders into ShopVui.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : (
        <div className="space-y-4">
          {SUPPORTED_CHANNELS.map((channel) => {
            const channelConnections = connections.filter((c) => c.channel === channel.key);

            return (
              <div key={channel.key}>
                <h3 className="mb-3 text-sm font-medium text-gray-700">{channel.label}</h3>

                {channelConnections.length > 0 ? (
                  <div className="space-y-3">
                    {channelConnections.map((conn) => (
                      <ChannelCard
                        key={conn.id}
                        connection={conn}
                        onUpdate={fetchConnections}
                        onViewLogs={setLogsConnection}
                      />
                    ))}
                    <a
                      href={`${API_URL}${channel.oauthPath}`}
                      className="inline-block rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Connect Another {channel.label} Shop
                    </a>
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center">
                    <p className="mb-3 text-sm text-gray-500">
                      No {channel.label} shop connected yet.
                    </p>
                    <a
                      href={`${API_URL}${channel.oauthPath}`}
                      className="inline-block rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
                    >
                      Connect {channel.label}
                    </a>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <SyncLogsDrawer
        connection={logsConnection}
        onClose={() => setLogsConnection(null)}
      />
    </div>
  );
}
