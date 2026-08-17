import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Escucha en todas las interfaces de red (0.0.0.0), no solo localhost,
    // para que una VM u otra maquina de la red pueda abrir el frontend.
    host: true,
    port: 5173,
  },
})
