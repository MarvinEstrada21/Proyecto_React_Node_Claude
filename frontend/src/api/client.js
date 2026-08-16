import axios from 'axios';

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  withCredentials: true,
});

export function fileUrl(path) {
  if (!path) return null;
  return `${API_URL}${path}`;
}

export default api;
