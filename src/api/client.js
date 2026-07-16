import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://restaurant-inventory-api-8h0b.onrender.com/api/v1';

export const client = axios.create({
  baseURL: API_BASE_URL,
});

// Attach the JWT to every request once the user is logged in.
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// A stale/invalid token (expired, revoked, backend restarted with a new
// SECRET_KEY, etc.) always comes back as 401 from every protected route.
// Rather than have every page handle that individually, clear the token
// and let AuthContext's next render redirect to /login.
let onUnauthorized = null;
export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('auth_token');
      if (onUnauthorized) onUnauthorized();
    }
    return Promise.reject(error);
  }
);

/**
 * Extracts a human-readable message from an API error. FastAPI's
 * HTTPException always shapes errors as { detail: "..." } — anything else
 * (network failure, unexpected 500 without that shape) falls back to a
 * generic message rather than showing "undefined" in the UI.
 */
export function apiErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  if (error?.response?.data?.detail) {
    const { detail } = error.response.data;
    if (typeof detail === 'string') return detail;
    // 422 validation errors come back as a list of {loc, msg, type} objects.
    if (Array.isArray(detail)) {
      return detail.map((d) => d.msg).join('; ');
    }
  }
  if (error?.message === 'Network Error') return 'Cannot reach the server. Is the backend running?';
  return fallback;
}

export default client;
