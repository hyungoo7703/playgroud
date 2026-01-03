import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [svelte()],
  base: '/family-playground/' // GitHub Pages 배포를 위해 레포지토리 이름으로 변경해주세요.
})
