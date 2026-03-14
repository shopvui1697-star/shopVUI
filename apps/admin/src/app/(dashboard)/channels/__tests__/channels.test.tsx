import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ChannelsPage from '../page';
import type { ChannelConnectionDto } from '../channel-card';

vi.mock('next/navigation', () => ({
  usePathname: () => '/channels',
  useRouter: () => ({ push: vi.fn() }),
}));

const mockApiFetch = vi.fn();
vi.mock('@/lib/api', () => ({
  apiFetch: (...args: unknown[]) => mockApiFetch(...args),
}));

const mockConnections: ChannelConnectionDto[] = [
  {
    id: 'conn-1',
    channel: 'SHOPEE',
    shopId: 'shop-123',
    shopName: 'My Shopee Store',
    syncEnabled: true,
    syncIntervalMinutes: 10,
    lastSyncAt: new Date(Date.now() - 120000).toISOString(),
    lastSyncStatus: 'SUCCESS',
    createdAt: '2026-03-01T00:00:00Z',
  },
  {
    id: 'conn-2',
    channel: 'TIKTOK',
    shopId: 'shop-456',
    shopName: 'My TikTok Shop',
    syncEnabled: false,
    syncIntervalMinutes: 5,
    lastSyncAt: null,
    lastSyncStatus: 'FAILED',
    createdAt: '2026-03-02T00:00:00Z',
  },
];

describe('ChannelsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApiFetch.mockResolvedValue(mockConnections);
  });

  it('renders channel cards for connected shops', async () => {
    render(<ChannelsPage />);
    await waitFor(() => {
      expect(screen.getByText('My Shopee Store')).toBeDefined();
      expect(screen.getByText('My TikTok Shop')).toBeDefined();
    });
  });

  it('shows connect button for channels with no connections', async () => {
    mockApiFetch.mockResolvedValue([]);
    render(<ChannelsPage />);
    await waitFor(() => {
      expect(screen.getByText('Connect Shopee')).toBeDefined();
      expect(screen.getByText('Connect TikTok Shop')).toBeDefined();
    });
  });

  it('shows sync status badges', async () => {
    render(<ChannelsPage />);
    await waitFor(() => {
      expect(screen.getByText('SUCCESS')).toBeDefined();
      expect(screen.getByText('FAILED')).toBeDefined();
    });
  });

  it('triggers Sync Now API call', async () => {
    render(<ChannelsPage />);
    await waitFor(() => {
      expect(screen.getByText('My Shopee Store')).toBeDefined();
    });

    mockApiFetch.mockResolvedValueOnce({ syncLogId: 'log-1' });
    mockApiFetch.mockResolvedValueOnce(mockConnections);

    const syncButtons = screen.getAllByText('Sync Now');
    fireEvent.click(syncButtons[0]);

    await waitFor(() => {
      expect(mockApiFetch).toHaveBeenCalledWith('/admin/channels/conn-1/sync', { method: 'POST' });
    });
  });

  it('toggles sync enabled via PATCH', async () => {
    render(<ChannelsPage />);
    await waitFor(() => {
      expect(screen.getByText('My Shopee Store')).toBeDefined();
    });

    mockApiFetch.mockResolvedValueOnce({});
    mockApiFetch.mockResolvedValueOnce(mockConnections);

    const toggles = screen.getAllByRole('switch');
    fireEvent.click(toggles[0]);

    await waitFor(() => {
      expect(mockApiFetch).toHaveBeenCalledWith('/admin/channels/conn-1', {
        method: 'PATCH',
        body: JSON.stringify({ syncEnabled: false }),
      });
    });
  });

  it('changes interval via PATCH', async () => {
    render(<ChannelsPage />);
    await waitFor(() => {
      expect(screen.getByText('My Shopee Store')).toBeDefined();
    });

    mockApiFetch.mockResolvedValueOnce({});
    mockApiFetch.mockResolvedValueOnce(mockConnections);

    const selects = screen.getAllByDisplayValue('10 min');
    fireEvent.change(selects[0], { target: { value: '15' } });

    await waitFor(() => {
      expect(mockApiFetch).toHaveBeenCalledWith('/admin/channels/conn-1', {
        method: 'PATCH',
        body: JSON.stringify({ syncIntervalMinutes: 15 }),
      });
    });
  });

  it('shows page header and description', async () => {
    render(<ChannelsPage />);
    expect(screen.getByText('Channels')).toBeDefined();
    expect(screen.getByText(/Connect your sales channels/)).toBeDefined();
  });
});

describe('SyncLogsDrawer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('opens sync logs when View Logs is clicked', async () => {
    mockApiFetch.mockResolvedValueOnce(mockConnections);
    render(<ChannelsPage />);

    await waitFor(() => {
      expect(screen.getByText('My Shopee Store')).toBeDefined();
    });

    mockApiFetch.mockResolvedValueOnce({
      data: [
        {
          id: 'log-1',
          status: 'SUCCESS',
          ordersFetched: 5,
          ordersCreated: 3,
          ordersUpdated: 2,
          errorType: null,
          errorMessage: null,
          durationMs: 1200,
          startedAt: '2026-03-12T10:00:00Z',
          completedAt: '2026-03-12T10:00:01Z',
        },
        {
          id: 'log-2',
          status: 'FAILED',
          ordersFetched: 0,
          ordersCreated: 0,
          ordersUpdated: 0,
          errorType: 'rate_limit',
          errorMessage: 'API rate limit exceeded',
          durationMs: 500,
          startedAt: '2026-03-12T09:00:00Z',
          completedAt: '2026-03-12T09:00:00Z',
        },
      ],
      total: 2,
      page: 1,
      limit: 10,
    });

    const viewLogsButtons = screen.getAllByText('View Logs');
    fireEvent.click(viewLogsButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Sync Logs - My Shopee Store')).toBeDefined();
    });

    await waitFor(() => {
      expect(screen.getByText('rate_limit')).toBeDefined();
      expect(screen.getByText('API rate limit exceeded')).toBeDefined();
    });
  });

  it('closes drawer when Close is clicked', async () => {
    mockApiFetch.mockResolvedValueOnce(mockConnections);
    render(<ChannelsPage />);

    await waitFor(() => {
      expect(screen.getByText('My Shopee Store')).toBeDefined();
    });

    mockApiFetch.mockResolvedValueOnce({ data: [], total: 0, page: 1, limit: 10 });

    const viewLogsButtons = screen.getAllByText('View Logs');
    fireEvent.click(viewLogsButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Sync Logs - My Shopee Store')).toBeDefined();
    });

    fireEvent.click(screen.getByText('Close'));

    await waitFor(() => {
      expect(screen.queryByText('Sync Logs - My Shopee Store')).toBeNull();
    });
  });

  it('shows connect button linking to OAuth endpoint', async () => {
    mockApiFetch.mockResolvedValue([]);
    render(<ChannelsPage />);

    await waitFor(() => {
      const connectShopeeLink = screen.getByText('Connect Shopee');
      expect(connectShopeeLink.closest('a')?.getAttribute('href')).toContain('/channels/oauth/shopee');
    });
  });
});
