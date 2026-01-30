import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/

export default defineConfig({
  plugins: [react()],
  build: {
    sourcemap: false, // 소스 맵 비활성화
    minify: "terser", // Terser를 사용한 코드 압축 및 난독화
    terserOptions: {
      compress: {
        drop_console: true, // console.log 제거
        drop_debugger: true, // debugger 제거
        pure_funcs: [
          "console.log",
          "console.info",
          "console.debug",
          "console.warn",
        ], // 콘솔 함수 제거
      },
      mangle: {
        toplevel: true, // 최상위 레벨 변수명 난독화
        reserved: ["React", "ReactDOM"], // React 관련 이름은 보존
      },
      format: {
        comments: false, // 주석 제거
      },
    },
    rollupOptions: {
      output: {
        manualChunks: undefined, // 청크 분할 비활성화로 단일 파일 생성
      },
    },
  },
});
