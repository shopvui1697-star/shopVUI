# Plan: Channel Sync Frontend

## Architecture

Follow existing admin app patterns exactly:
- **Framework**: Next.js App Router (App dir with route groups)
- **Styling**: Tailwind CSS v4
- **Data fetching**: Client-side with `apiFetch()` from `@/lib/api`
- **Components**: Reuse existing `DataTable`, `Pagination`, `StatusBadge` components
- **Routing**: Pages live under `apps/admin/src/app/(dashboard)/channels/`
- **Navigation**: Add "Channels" to sidebar NAV_ITEMS in `@/components/sidebar.tsx`

## File Structure

```
apps/admin/src/app/(dashboard)/channels/
  page.tsx              # Main channel settings page (T-019)
  channel-card.tsx      # ChannelCard client component
  sync-logs-drawer.tsx  # SyncLogsDrawer client component (T-020)
```

## Implementation Steps

### T-019: Channel Settings Page

1. Create `page.tsx` — 'use client' component that:
   - Fetches `GET /admin/channels` on mount
   - Shows a header "Channels" with description text
   - Renders available channels (Shopee, TikTok) as cards
   - Connected channels: ChannelCard with shop name, status badge, last sync, actions
   - Unconnected channels: "Connect" button linking to OAuth flow

2. Create `channel-card.tsx` — ChannelCard component with:
   - Shop name + channel type badge (reuse CHANNEL_COLORS from constants)
   - Status badge: IDLE/SUCCESS (green), FAILED (red), RUNNING (yellow)
   - Last sync time as relative time ("2 minutes ago")
   - "Sync Now" button -> POST /admin/channels/:id/sync with loading spinner
   - Toggle switch for syncEnabled -> PATCH /admin/channels/:id
   - Dropdown for syncIntervalMinutes (5/10/15) -> PATCH /admin/channels/:id
   - "Disconnect" button with confirmation -> DELETE /admin/channels/:id
   - "View Logs" button -> opens SyncLogsDrawer

### T-020: Sync Logs View + Connect OAuth Flow

1. Create `sync-logs-drawer.tsx` — slide-over panel with:
   - DataTable showing sync log history
   - Columns: Time, Status, Fetched, Created, Updated, Duration, Error
   - Status badges: SUCCESS=green, FAILED=red, RUNNING=yellow
   - Error rows: errorType chip + errorMessage text
   - Pagination using existing Pagination component

2. Connect button: simple `<a>` linking to `/channels/oauth/:channel` (GET redirect)

3. Add "Channels" nav item to sidebar

## Testing

- Unit tests using Vitest + @testing-library/react + jsdom
- Mock `apiFetch` for all API calls
- Test file: `apps/admin/src/app/(dashboard)/channels/__tests__/channels.test.tsx`
