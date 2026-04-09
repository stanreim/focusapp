import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  server: {
    port: 5173,
    open: true,
  },
  plugins: [
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('@mui') || id.includes('@emotion')) return 'mui'
            if (id.includes('@radix-ui')) return 'radix'
            if (id.includes('three') || id.includes('@react-three')) return 'three'
            if (id.includes('recharts')) return 'recharts'
            // React core in its own chunk to avoid pulling into every other chunk
            if (id.includes('react-dom') || id.includes('/react/')) return 'react-vendor'
            return 'vendor'
          }
        },
      },
    },
    chunkSizeWarningLimit: 3000,
  },
})
