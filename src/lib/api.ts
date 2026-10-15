/**
 * FinTrack AI Unified API Client
 * Connects to the backend server for Auth, Cloud Data Sync, and AI Proxy (Gemini 1.5 Flash).
 */

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5001').replace(/\/+$/, '');

const STORAGE_KEY_ACCESS_TOKEN = 'fintrack_access_token';
const STORAGE_KEY_REFRESH_TOKEN = 'fintrack_refresh_token';

export function getAccessToken(): string | null {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  return localStorage.getItem(STORAGE_KEY_ACCESS_TOKEN);
}

export function getRefreshToken(): string | null {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  return localStorage.getItem(STORAGE_KEY_REFRESH_TOKEN);
}

export function setTokens(accessToken: string, refreshToken?: string): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  localStorage.setItem(STORAGE_KEY_ACCESS_TOKEN, accessToken);
  if (refreshToken) {
    localStorage.setItem(STORAGE_KEY_REFRESH_TOKEN, refreshToken);
  }
}

export function clearTokens(): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  localStorage.removeItem(STORAGE_KEY_ACCESS_TOKEN);
  localStorage.removeItem(STORAGE_KEY_REFRESH_TOKEN);
}

export interface ApiError extends Error {
  status?: number;
  code?: string;
  isColdStart?: boolean;
}

let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

function onRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

/**
 * Robust fetch wrapper handling auth headers, cold start delays, and 401 token refresh
 */
export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {},
  isRetry = false
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const token = getAccessToken();

  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // AbortController for cold-start tolerance (up to 30s timeout)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 35000);

  try {
    const res = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    // 401 Unauthorized handling & automatic token refresh
    if (res.status === 401 && !isRetry) {
      const refreshToken = getRefreshToken();
      if (refreshToken) {
        if (!isRefreshing) {
          isRefreshing = true;
          try {
            const refreshRes = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ refreshToken }),
            });

            if (refreshRes.ok) {
              const data = await refreshRes.json();
              const newAccessToken = data.tokens.accessToken;
              const newRefreshToken = data.tokens.refreshToken;
              setTokens(newAccessToken, newRefreshToken);
              isRefreshing = false;
              onRefreshed(newAccessToken);
              return apiRequest<T>(endpoint, options, true);
            } else {
              isRefreshing = false;
              clearTokens();
            }
          } catch {
            isRefreshing = false;
            clearTokens();
          }
        } else {
          // Queue request until refresh completes
          return new Promise<T>((resolve, reject) => {
            subscribeTokenRefresh((newToken) => {
              const newHeaders = new Headers(options.headers || {});
              newHeaders.set('Authorization', `Bearer ${newToken}`);
              apiRequest<T>(endpoint, { ...options, headers: newHeaders }, true)
                .then(resolve)
                .catch(reject);
            });
          });
        }
      }
    }

    if (!res.ok) {
      let errorMsg = `Request failed with status ${res.status}`;
      let errorCode: string | undefined;
      try {
        const errJson = await res.json();
        errorMsg = errJson.error || errorMsg;
        errorCode = errJson.code;
      } catch {}

      const err: ApiError = new Error(errorMsg);
      err.status = res.status;
      err.code = errorCode;
      throw err;
    }

    return await res.json();
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      const coldStartError: ApiError = new Error(
        'Server took too long to respond. It may be spinning up from cold sleep (e.g. on Render/Railway free tier). Please try again in a few seconds.'
      );
      coldStartError.isColdStart = true;
      throw coldStartError;
    }
    throw err;
  }
}

/**
 * Typed API modules
 */
export const api = {
  auth: {
    register: (body: { email: string; password: string; name: string }) =>
      apiRequest<{ user: any; tokens: { accessToken: string; refreshToken: string } }>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(body),
      }),

    login: (body: { email: string; password: string }) =>
      apiRequest<{ user: any; tokens: { accessToken: string; refreshToken: string } }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(body),
      }),

    me: () =>
      apiRequest<{ user: any }>('/api/auth/me'),

    logout: (refreshToken?: string) =>
      apiRequest<{ success: boolean }>('/api/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      }),
  },

  sync: {
    pull: (since?: string) =>
      apiRequest<{ timestamp: string; changes: any }>(
        `/api/sync/pull${since ? `?since=${encodeURIComponent(since)}` : ''}`
      ),

    push: (payload: any) =>
      apiRequest<{ success: boolean; processedAt: string }>('/api/sync/push', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
  },

  ai: {
    askAdvisor: (prompt: string, context?: any) =>
      apiRequest<{ response: string }>('/api/ai/advisor', {
        method: 'POST',
        body: JSON.stringify({ prompt, context }),
      }),

    scanReceipt: async (fileOrBase64: File | string, currency = 'INR') => {
      if (fileOrBase64 instanceof File) {
        const formData = new FormData();
        formData.append('image', fileOrBase64);
        formData.append('currency', currency);

        return apiRequest<{
          merchant: string;
          amount: number;
          date: string;
          tax?: number;
          categoryName: string;
          confidence: number;
          rawText?: string;
        }>('/api/ai/receipt-ocr', {
          method: 'POST',
          body: formData,
        });
      }

      return apiRequest<{
        merchant: string;
        amount: number;
        date: string;
        tax?: number;
        categoryName: string;
        confidence: number;
        rawText?: string;
      }>('/api/ai/receipt-ocr', {
        method: 'POST',
        body: JSON.stringify({ imageBase64: fileOrBase64, currency }),
      });
    },
  },
};
