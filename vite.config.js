import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "icon-192.png"],
      // The sleep-mode ambience files are ~1.5 MB each and are fetched on demand.
      workbox: { globPatterns: ["**/*.{js,css,html,png,svg}"] },
      manifest: {
        name: "Baby Tap",
        short_name: "Baby Tap",
        description: "Colorful tap-and-play games for babies and toddlers",
        lang: "he",
        dir: "auto",
        start_url: "/baby-tap/",
        scope: "/baby-tap/",
        display: "fullscreen",
        orientation: "any",
        background_color: "#0b0b1f",
        theme_color: "#0b0b1f",
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png" },
          {
            src: "icon-192-maskable.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "maskable",
          },
          {
            src: "icon-512-maskable.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
    }),
  ],
  base: "/baby-tap/",
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.{js,jsx}"],
    setupFiles: ["./src/test/setup.js"],
  },
});
