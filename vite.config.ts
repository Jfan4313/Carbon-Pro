import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    // Vercel 部署使用绝对路径，本地开发使用相对路径
    const isVercel = process.env.CI === '1';
    return {
      base: isVercel ? '/' : './',
      server: {
        port: 5173,
        host: '127.0.0.1',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.ELECTRON': JSON.stringify(mode === 'electron')
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.')
        }
      },
      build: {
        outDir: 'dist',
        emptyOutDir: true
      }
    };
});
