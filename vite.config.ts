import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    // One 800 KB file meant every visitor downloaded the animation library and
    // the database client before the first pixel. Split by how often each part
    // changes: React and the router are stable and cache for months, the app
    // code changes on every deploy.
    rolldownOptions: {
      output: {
        advancedChunks: {
          groups: [
            { name: "react", test: /node_modules[\/](react|react-dom|scheduler)[\/]/ },
            { name: "router", test: /node_modules[\/]react-router/ },
            { name: "motion", test: /node_modules[\/](framer-motion|motion-dom|motion-utils)[\/]/ },
            { name: "supabase", test: /node_modules[\/]@supabase[\/]/ },
          ],
        },
      },
    },
  },
});
