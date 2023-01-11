import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: "",

  test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,
  use: [
    {
      loader: "babel-loader",
    },
    {
      loader: "@svgr/webpack",
      options: {
        babel: false,
        icon: true,
      },
    },
  ],
});
