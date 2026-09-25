import axios from 'axios';
import { useAuth } from '../store/auth';
import { config as appConfig } from '../config';

const api = axios.create({ baseURL: `${appConfig.apiUrl.replace(/\/api\/?$/, '')}/api`, withCredentials: true });

api.interceptors.request.use((cfg) => { const t = useAuth.getState().accessToken; if (t) cfg.headers.Authorization = `Bearer ${t}`; return cfg; });

let refreshing = null;
api.interceptors.response.use((r) => r, async (err) => {
  const { config, response } = err;
  const isAuthCall = config?.url?.startsWith('/auth/');
  if (response?.status === 401 && !config._retry && !isAuthCall) {
    config._retry = true;
    const { refreshToken, setSession, logoutLocal } = useAuth.getState();
    if (!refreshToken) { logoutLocal(); return Promise.reject(err); }
    try {
      refreshing ||= axios.post(`${api.defaults.baseURL}/auth/refresh`, { refreshToken }).finally(() => { refreshing = null; });
      const { data } = await refreshing; setSession(data.data);
      config.headers.Authorization = `Bearer ${data.data.accessToken}`; return api(config);
    } catch { logoutLocal(); }
  }
  return Promise.reject(err);
});

/** Turn any failure into a friendly string — never show raw server errors. */
export const errMsg = (e, fallback = 'Something went wrong. Please try again.') => {
  if (e?.response?.data?.message) return e.response.data.message;
  if (e?.code === 'ERR_NETWORK') return 'Cannot reach the server. Check your connection and try again.';
  return fallback;
};
export const unwrap = (p) => p.then((r) => r.data.data);
export const openPdf = async (url) => {
  const { data } = await api.get(url, { responseType: 'blob' });
  window.open(URL.createObjectURL(new Blob([data], { type: 'application/pdf' })), '_blank');
};
export const downloadFile = async (url, filename = 'document.pdf') => {
  const { data } = await api.get(url, { responseType: 'blob' });
  const blobUrl = URL.createObjectURL(new Blob([data]));
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(blobUrl);
};
export const getFullUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  const baseUrl = appConfig.apiUrl || 'http://localhost:5000';
  const cleanBase = baseUrl.replace(/\/api\/?$/, '');
  return `${cleanBase}${url.startsWith('/') ? '' : '/'}${url}`;
};

export const openDocUrl = (url) => {
  if (!url) return;
  window.open(getFullUrl(url), '_blank');
};

export default api;
