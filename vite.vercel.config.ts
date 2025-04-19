import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path, { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuração específica para Vercel
// Otimizada para evitar problemas comuns no deploy
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Aliases completos e explícitos para garantir resolução no Vercel
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared"),
      "@components": path.resolve(__dirname, "client", "src", "components"),
      "@lib": path.resolve(__dirname, "client", "src", "lib"),
      "@hooks": path.resolve(__dirname, "client", "src", "hooks"),
      "@pages": path.resolve(__dirname, "client", "src", "pages"),
    },
  },
  root: path.resolve(__dirname, "client"),
  build: {
    outDir: path.resolve(__dirname, "dist"),
    emptyOutDir: true,
    // Configurações otimizadas para o Vercel
    minify: true,
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'wouter'],
          ui: [
            '@/components/ui/toast',
            '@/components/ui/button',
            '@/components/ui/card',
            '@/components/ui/separator'
          ]
        }
      }
    }
  },
  // Desabilitar verificações específicas que podem causar problemas no Vercel
  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' }
  },
});