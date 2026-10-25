import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  // fs.allow: the report form imports ../data/reference/drugs.json for medicine suggestions
  server: { proxy: { '/api': 'http://localhost:3001' }, fs: { allow: ['..'] } },
  // One self-contained bundle: Hatchable's deploy linter rejects import.meta (preload helper) and chunk imports
  build: { modulePreload: false },
})
