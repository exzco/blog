/** @type {import('tailwindcss').Config} */
const defaultTheme = require("tailwindcss/defaultTheme")
module.exports = {
  content: [
    "./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue,mjs}",
    "./src/content/**/*.md", // 确保扫描博客文章中的 Tailwind 类
  ],
  darkMode: "class", // allows toggling dark mode manually
  theme: {
    extend: {
      fontFamily: {
        sans: ["Roboto", "sans-serif", ...defaultTheme.fontFamily.sans],
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
  // 生产环境优化
  future: {
    hoverOnlyWhenSupported: true, // 仅在支持 hover 的设备上应用 hover 样式
  },
  // 实验性优化：JIT 模式下更积极地移除未使用的样式
  experimental: {
    optimizeUniversalDefaults: true,
  },
}
