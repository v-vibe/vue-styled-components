/// <reference types="vitest" />
import { defineConfig } from 'vite'
import { resolve } from 'path'
import dts from 'vite-plugin-dts'

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, './index.ts'),
      name: 'Bundle',
      fileName: 'index',
      formats: ['es', 'umd'],
    },
    rollupOptions: {
      external: ['vue'],
    },
  },
  resolve: {
    alias: {
      '@/': new URL('./', import.meta.url).pathname,
    },
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.vue', '.less'],
  },
  plugins: [
    dts({
      include: ['index.ts', './src/**/*.ts'],
      exclude: ['__test__'],
    }),
  ],
  test: {
    clearMocks: true,
    environment: 'jsdom',
    coverage: {
      reporter: ['lcov', 'text', 'json-summary', 'json'],
      include: ['./src/**/*.ts'],
    },
  },
})