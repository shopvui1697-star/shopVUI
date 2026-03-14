const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export function getToken(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|;\s*)admin_token=([^;]*)/);
  return match ? match[1] : null;
}

export function setToken(token: string): void {
  document.cookie = `admin_token=${token};path=/;max-age=${60 * 60 * 24};SameSite=Strict${location.protocol === 'https:' ? ';Secure' : ''}`;
}

export function removeToken(): void {
  document.cookie = 'admin_token=;path=/;max-age=0';
}

export async function login(email: string, password: string): Promise<{ token: string }> {
  const res = await fetch(`${API_URL}/admin/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || 'Login failed');
  }
  const data = await res.json();
  setToken(data.token || data.accessToken);
  return data;
}

export function logout(): void {
  removeToken();
  window.location.href = '/login';
}

export function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1]!));
    return payload;
  } catch {
    return null;
  }
}

export function isAdmin(token: string): boolean {
  const payload = decodeJwtPayload(token);
  return payload?.role === 'ADMIN';
}
