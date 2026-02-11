import { defineConfig } from 'vite'  // <--- This line is critical!
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
})