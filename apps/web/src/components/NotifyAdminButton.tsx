'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

interface HistoryItem {
  id: string;
  title: string;
  body: string;
  type: 'sent' | 'reply';
  createdAt: string;
}

interface NotifyAdminButtonProps {
  productId: string;
  productName: string;
}

export function NotifyAdminButton({ productId, productName }: NotifyAdminButtonProps) {
  const { token } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const fetchHistory = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/notifications/product/${productId}/history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setHistory(await res.json());
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [token, productId]);

  useEffect(() => {
    if (token) fetchHistory();
  }, [token, fetchHistory]);

  if (!token) {
    return (
      <Link
        href={`/login?returnUrl=/products/${productId}`}
        className="flex w-full items-center justify-center gap-2 rounded-full border border-neutral-300 p-3 text-sm font-medium text-neutral-700 hover:border-blue-500 hover:text-blue-600 dark:border-neutral-600 dark:text-neutral-300 dark:hover:border-blue-400 dark:hover:text-blue-400"
      >
        <BellIcon />
        Sign in to notify admin
      </Link>
    );
  }

  async function handleSend() {
    if (!message.trim() && history.length > 0) return;
    setSending(true);
    try {
      const res = await fetch(`${API_URL}/notifications/notify-admin`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productId, productName, message: message || undefined }),
      });
      if (!res.ok) throw new Error('Failed');
      setMessage('');
      await fetchHistory();
    } catch {
      alert('Failed to send notification. Please try again.');
    } finally {
      setSending(false);
    }
  }

  if (history.length === 0 && !expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="flex w-full items-center justify-center gap-2 rounded-full border border-neutral-300 p-3 text-sm font-medium text-neutral-700 transition-colors hover:border-blue-500 hover:text-blue-600 dark:border-neutral-600 dark:text-neutral-300 dark:hover:border-blue-400 dark:hover:text-blue-400"
      >
        <BellIcon />
        Notify Admin
      </button>
    );
  }

  if (history.length > 0 && !expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="flex w-full items-center justify-between rounded-xl border border-neutral-200 px-4 py-3 text-left transition-colors hover:border-blue-400 dark:border-neutral-700 dark:hover:border-blue-500"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <ChatIcon />
            <span className="text-sm font-medium text-neutral-900 dark:text-white">
              Conversation with Admin
            </span>
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
              {history.length}
            </span>
          </div>
          <p className="mt-0.5 truncate pl-6 text-xs text-neutral-500 dark:text-neutral-400">
            {history[history.length - 1]?.body}
          </p>
        </div>
        <ChevronIcon />
      </button>
    );
  }

  return (
    <div className="w-full rounded-xl border border-neutral-200 dark:border-neutral-700">
      <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-2.5 dark:border-neutral-700">
        <div className="flex items-center gap-2">
          <ChatIcon />
          <span className="text-sm font-medium text-neutral-900 dark:text-white">
            {history.length > 0 ? 'Conversation with Admin' : 'Notify Admin'}
          </span>
        </div>
        <button
          onClick={() => setExpanded(false)}
          className="rounded p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-4 w-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {loading && history.length === 0 ? (
        <div className="px-4 py-6 text-center text-sm text-neutral-400">Loading...</div>
      ) : (
        <>
          {history.length > 0 && (
            <div className="max-h-64 space-y-1 overflow-y-auto px-3 py-2">
              {history.map((item) => (
                <div
                  key={item.id}
                  className={`flex ${item.type === 'sent' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-3 py-2 ${
                      item.type === 'sent'
                        ? 'bg-blue-600 text-white'
                        : 'bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-white'
                    }`}
                  >
                    {item.type === 'reply' && (
                      <p className={`text-[10px] font-medium ${
                        item.type === 'reply' ? 'text-neutral-400 dark:text-neutral-500' : ''
                      }`}>
                        {item.title}
                      </p>
                    )}
                    <p className="text-sm">{item.body}</p>
                    <p className={`mt-0.5 text-[10px] ${
                      item.type === 'sent'
                        ? 'text-blue-200'
                        : 'text-neutral-400 dark:text-neutral-500'
                    }`}>
                      {new Date(item.createdAt).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2 border-t border-neutral-200 px-3 py-2 dark:border-neutral-700">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !sending && handleSend()}
              placeholder={history.length > 0 ? 'Send another message...' : 'Message to admin (optional)'}
              maxLength={500}
              className="flex-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:border-blue-500 focus:outline-none dark:border-neutral-600 dark:bg-neutral-800 dark:text-white dark:placeholder-neutral-500"
            />
            <button
              onClick={handleSend}
              disabled={sending}
              className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {sending ? '...' : 'Send'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function BellIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4 text-blue-600 dark:text-blue-400">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-4 w-4 text-neutral-400">
      <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
    </svg>
  );
}
