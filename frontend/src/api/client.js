import axios from 'axios';

// Si VITE_API_URL esta definida se usa tal cual (util para produccion o para
// forzar un host puntual). Si no, se deduce del host con el que el usuario
// abrio el frontend (localhost, la IP de red, lo que sea), para que la app
// funcione igual desde esta maquina o desde una VM sin tener que elegir un
// solo origen fijo por adelantado.
const configuredUrl = import.meta.env.VITE_API_URL;
export const API_URL =
  configuredUrl && configuredUrl.trim()
    ? configuredUrl.trim()
    : `${window.location.protocol}//${window.location.hostname}:4000`;

const api = axios.create({
  baseURL: `${API_URL}/api`,
  withCredentials: true,
});

export function fileUrl(path) {
  if (!path) return null;
  return `${API_URL}${path}`;
}

export default api;
