import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  base: '/',
  plugins: [react()],
  build: {
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true
    },
    rollupOptions: {
      external: [],  // Remove external configuration
      output: {
        manualChunks: {
          'ethers': ['ethers'],
          'vendor': [
            '@ethersproject/bignumber',
            '@ethersproject/contracts',
            '@ethersproject/providers',
            '@uniswap/sdk'
          ]
        }
      }
    }
  },
  resolve: {
    alias: {
      '@ethersproject/bignumber': resolve(__dirname, 'node_modules/@ethersproject/bignumber'),
      '@ethersproject/contracts': resolve(__dirname, 'node_modules/@ethersproject/contracts'),
      '@ethersproject/providers': resolve(__dirname, 'node_modules/@ethersproject/providers')
    }
  },
  optimizeDeps: {
    include: [
      'ethers',
      '@ethersproject/bignumber',
      '@ethersproject/contracts',
      '@ethersproject/providers',
      '@uniswap/sdk'
    ],
    esbuildOptions: {
      target: 'es2020'
    }
  }
})