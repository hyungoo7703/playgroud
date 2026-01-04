import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  // 빌드 모드일 때만 저장소 이름을 base로 설정합니다.
  const isProduction = mode === "production";

  return {
    plugins: [svelte()],
    base: isProduction ? "/playground/" : "/",
  };
});
