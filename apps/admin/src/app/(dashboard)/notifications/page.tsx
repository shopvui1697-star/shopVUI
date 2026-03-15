'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { NotificationData, NotificationTemplateData, NotificationType } from '@shopvui/shared';
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  fetchAdminNotifications,
  markAdminNotificationAsRead,
  markAllAdminNotificationsAsRead,
  sendNotification,
  replyToNotification,
} from '@/lib/api/notifications';
import { fetchTemplates } from '@/lib/api/notification-templates';
import { apiFetch } from '@/lib/api';

interface CustomerOption {
  id: string;
  name: string | null;
  email: string;
}

const NOTIFICATION_TYPES: NotificationType[] = [
  'ORDER_STATUS',
  'PAYMENT',
  'COMMISSION',
  'SYSTEM',
  'ADMIN_ALERT',
  'RESELLER',
  'CONVERSATION',
];

function extractVariables(text: string): string[] {
  const matches = text.match(/\{\{(\w+)\}\}/g);
  if (!matches) return [];
  return [...new Set(matches.map((m) => m.replace(/\{\{|\}\}/g, '')))];
}

function SendDialog({
  open,
  onClose,
  onSent,
}: {
  open: boolean;
  onClose: () => void;
  onSent: () => void;
}) {
  const [mode, setMode] = useState<'template' | 'custom'>('template');
  const [templateId, setTemplateId] = useState('');
  const [type, setType] = useState<NotificationType>('SYSTEM');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [userSearch, setUserSearch] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<CustomerOption[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const { data: templates } = useQuery({
    queryKey: ['notification-templates'],
    queryFn: fetchTemplates,
    enabled: open,
  });

  const { data: searchResults } = useQuery({
    queryKey: ['customer-search', userSearch],
    queryFn: () =>
      apiFetch<{ data: CustomerOption[] }>(
        `/admin/customers?search=${encodeURIComponent(userSearch)}&pageSize=10`,
      ).then((r) => r.data),
    enabled: open && userSearch.length >= 2,
  });

  const selectedTemplate = useMemo(
    () => templates?.find((t: NotificationTemplateData) => t.id === templateId),
    [templates, templateId],
  );

  const templateVars = useMemo(() => {
    if (!selectedTemplate) return [];
    return extractVariables(selectedTemplate.title + ' ' + selectedTemplate.body);
  }, [selectedTemplate]);

  useEffect(() => {
    if (templateVars.length > 0) {
      setVariables((prev) => {
        const next: Record<string, string> = {};
        for (const v of templateVars) next[v] = prev[v] ?? '';
        return next;
      });
    } else {
      setVariables({});
    }
  }, [templateVars]);

  const previewTitle = useMemo(() => {
    if (mode === 'custom') return title;
    if (!selectedTemplate) return '';
    let t = selectedTemplate.title;
    for (const [k, v] of Object.entries(variables)) {
      t = t.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), v || `{{${k}}}`);
    }
    return t;
  }, [mode, selectedTemplate, title, variables]);

  const previewBody = useMemo(() => {
    if (mode === 'custom') return body;
    if (!selectedTemplate) return '';
    let b = selectedTemplate.body;
    for (const [k, v] of Object.entries(variables)) {
      b = b.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), v || `{{${k}}}`);
    }
    return b;
  }, [mode, selectedTemplate, body, variables]);

  function reset() {
    setMode('template');
    setTemplateId('');
    setType('SYSTEM');
    setTitle('');
    setBody('');
    setVariables({});
    setUserSearch('');
    setSelectedUsers([]);
    setError('');
  }

  async function handleSend() {
    if (selectedUsers.length === 0) {
      setError('Select at least one user');
      return;
    }
    if (mode === 'template' && !templateId) {
      setError('Select a template');
      return;
    }
    if (mode === 'custom' && (!title.trim() || !body.trim())) {
      setError('Title and body are required');
      return;
    }

    setSending(true);
    setError('');
    try {
      await sendNotification({
        targetUserIds: selectedUsers.map((u) => u.id),
        ...(mode === 'template'
          ? {
              templateId,
              variables: Object.keys(variables).length > 0 ? variables : undefined,
            }
          : { type, title, body }),
      });
      reset();
      onSent();
      onClose();
    } catch (e: any) {
      setError(e.message || 'Failed to send');
    } finally {
      setSending(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h2 className="text-base font-semibold text-gray-900">Send Notification</h2>
          <button
            onClick={() => { reset(); onClose(); }}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="max-h-[70vh] space-y-4 overflow-y-auto px-5 py-4">
          {/* User search */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Recipients</label>
            {selectedUsers.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-1.5">
                {selectedUsers.map((u) => (
                  <span
                    key={u.id}
                    className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700"
                  >
                    {u.name || u.email}
                    <button
                      onClick={() => setSelectedUsers((p) => p.filter((x) => x.id !== u.id))}
                      className="ml-0.5 text-blue-400 hover:text-blue-600"
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
            )}
            <input
              type="text"
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              placeholder="Search users by name or email..."
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            {searchResults && searchResults.length > 0 && userSearch.length >= 2 && (
              <ul className="mt-1 max-h-32 overflow-y-auto rounded-md border border-gray-200 bg-white shadow-sm">
                {searchResults
                  .filter((u: CustomerOption) => !selectedUsers.some((s) => s.id === u.id))
                  .map((u: CustomerOption) => (
                    <li
                      key={u.id}
                      onClick={() => {
                        setSelectedUsers((p) => [...p, u]);
                        setUserSearch('');
                      }}
                      className="cursor-pointer px-3 py-2 text-sm hover:bg-blue-50"
                    >
                      <span className="font-medium">{u.name || 'No name'}</span>
                      <span className="ml-2 text-gray-400">{u.email}</span>
                    </li>
                  ))}
              </ul>
            )}
          </div>

          {/* Mode toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setMode('template')}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                mode === 'template'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              From Template
            </button>
            <button
              onClick={() => setMode('custom')}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                mode === 'custom'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Custom
            </button>
          </div>

          {mode === 'template' ? (
            <>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Template</label>
                <select
                  value={templateId}
                  onChange={(e) => setTemplateId(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Select a template...</option>
                  {templates?.map((t: NotificationTemplateData) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.type})
                    </option>
                  ))}
                </select>
              </div>

              {templateVars.length > 0 && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Variables</label>
                  <div className="space-y-2">
                    {templateVars.map((v) => (
                      <div key={v} className="flex items-center gap-2">
                        <span className="min-w-[100px] text-xs font-mono text-gray-500">{`{{${v}}}`}</span>
                        <input
                          type="text"
                          value={variables[v] ?? ''}
                          onChange={(e) =>
                            setVariables((prev) => ({ ...prev, [v]: e.target.value }))
                          }
                          placeholder={`Value for ${v}`}
                          className="flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as NotificationType)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {NOTIFICATION_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Notification title"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Body</label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={3}
                  placeholder="Notification body"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </>
          )}

          {/* Preview */}
          {(previewTitle || previewBody) && (
            <div className="rounded-md border border-gray-200 bg-gray-50 p-3">
              <p className="mb-1 text-xs font-medium uppercase text-gray-400">Preview</p>
              <p className="text-sm font-medium text-gray-900">{previewTitle}</p>
              <p className="mt-0.5 text-sm text-gray-600">{previewBody}</p>
            </div>
          )}

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t px-5 py-3">
          <button
            onClick={() => { reset(); onClose(); }}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={sending}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {sending ? 'Sending...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
}

function NotificationItem({
  notification,
  onMarkRead,
  onReplied,
}: {
  notification: NotificationData;
  onMarkRead: (id: string) => void;
  onReplied: () => void;
}) {
  const hasCustomerInquiry = !!notification.metadata?.senderId;
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleReply() {
    if (!replyText.trim()) return;
    setSending(true);
    try {
      await replyToNotification(notification.id, replyText.trim());
      setSent(true);
      setShowReply(false);
      setReplyText('');
      onReplied();
    } catch {
      alert('Failed to send reply');
    } finally {
      setSending(false);
    }
  }

  return (
    <li
      onClick={() => !notification.isRead && onMarkRead(notification.id)}
      className={`px-4 py-3 transition-colors hover:bg-gray-50 ${
        !notification.isRead ? 'bg-blue-50' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p
            className={`text-sm ${
              !notification.isRead
                ? 'font-semibold text-gray-900'
                : 'text-gray-700'
            }`}
          >
            {notification.title}
          </p>
          <p className="mt-0.5 text-sm text-gray-500">
            {notification.body}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {hasCustomerInquiry && !sent && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowReply((v) => !v);
              }}
              className="rounded px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50"
            >
              Reply
            </button>
          )}
          {sent && (
            <span className="text-xs font-medium text-green-600">Replied</span>
          )}
          {!notification.isRead && (
            <span className="h-2 w-2 rounded-full bg-blue-500" />
          )}
          <time className="text-xs text-gray-400">
            {new Date(notification.createdAt).toLocaleDateString()}
          </time>
        </div>
      </div>

      {showReply && (
        <div
          className="mt-2 flex gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          <input
            type="text"
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleReply()}
            placeholder="Type your reply..."
            autoFocus
            className="flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button
            onClick={handleReply}
            disabled={sending || !replyText.trim()}
            className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {sending ? 'Sending...' : 'Send'}
          </button>
          <button
            onClick={() => { setShowReply(false); setReplyText(''); }}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      )}
    </li>
  );
}

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const [showSend, setShowSend] = useState(false);

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: ['admin-notifications', 'list'],
      queryFn: ({ pageParam }) => fetchAdminNotifications(pageParam, 20),
      initialPageParam: 1,
      getNextPageParam: (lastPage) =>
        lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
    });

  const notifications = data?.pages.flatMap((p) => p.data) ?? [];

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
  }, [queryClient]);

  const markAsReadMutation = useMutation({
    mutationFn: markAdminNotificationAsRead,
    onMutate: async (id) => {
      await queryClient.cancelQueries({
        queryKey: ['admin-notifications', 'list'],
      });
      queryClient.setQueryData(
        ['admin-notifications', 'list'],
        (old: any) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page: any) => ({
              ...page,
              data: page.data.map((n: NotificationData) =>
                n.id === id ? { ...n, isRead: true } : n,
              ),
            })),
          };
        },
      );
    },
    onSettled: invalidate,
  });

  const markAllMutation = useMutation({
    mutationFn: markAllAdminNotificationsAsRead,
    onMutate: async () => {
      await queryClient.cancelQueries({
        queryKey: ['admin-notifications', 'list'],
      });
      queryClient.setQueryData(
        ['admin-notifications', 'list'],
        (old: any) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page: any) => ({
              ...page,
              data: page.data.map((n: NotificationData) => ({
                ...n,
                isRead: true,
              })),
            })),
          };
        },
      );
    },
    onSettled: invalidate,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-gray-500">Loading notifications...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-900">Notifications</h1>
        <div className="flex items-center gap-2">
          {notifications.length > 0 && (
            <button
              onClick={() => markAllMutation.mutate()}
              className="rounded-md px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50"
            >
              Mark all as read
            </button>
          )}
          <button
            onClick={() => setShowSend(true)}
            className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            Send Notification
          </button>
        </div>
      </div>

      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-gray-200 bg-white py-16">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="mb-3 h-10 w-10 text-gray-300"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
            />
          </svg>
          <p className="text-sm text-gray-500">No notifications</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <ul className="divide-y divide-gray-100">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkRead={(id) => markAsReadMutation.mutate(id)}
                onReplied={invalidate}
              />
            ))}
          </ul>
        </div>
      )}

      {hasNextPage && (
        <div className="mt-4 flex justify-center">
          <button
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="rounded-md px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 disabled:opacity-50"
          >
            {isFetchingNextPage ? 'Loading...' : 'Load more'}
          </button>
        </div>
      )}

      <SendDialog
        open={showSend}
        onClose={() => setShowSend(false)}
        onSent={invalidate}
      />
    </div>
  );
}
