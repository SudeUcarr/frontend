import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import {defineConfig, loadEnv} from 'vite'
export default defineConfig(({mode})=>{
  const env=loadEnv(mode,process.cwd(),'')
  const proxy={'/api':{target:env.API_PROXY_TARGET||'http://127.0.0.1:3001',changeOrigin:false}}
  return {plugins:[react(),tailwindcss()],server:{port:5173,strictPort:true,proxy},preview:{proxy},build:{outDir:'dist',emptyOutDir:true}}
})
