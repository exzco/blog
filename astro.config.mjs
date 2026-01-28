import sitemap from "@astrojs/sitemap";
import svelte from "@astrojs/svelte";
import tailwind from "@astrojs/tailwind";
import { pluginCollapsibleSections } from "@expressive-code/plugin-collapsible-sections";
import { pluginLineNumbers } from "@expressive-code/plugin-line-numbers";
import swup from "@swup/astro";
import expressiveCode from "astro-expressive-code";
import icon from "astro-icon";
import { defineConfig } from "astro/config";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeComponents from "rehype-components";/* Render the custom directive content */
import rehypeKatex from "rehype-katex";
import rehypeSlug from "rehype-slug";
import remarkDirective from "remark-directive";/* Handle directives */
import remarkGithubAdmonitionsToDirectives from "remark-github-admonitions-to-directives";
import remarkMath from "remark-math";
import remarkSectionize from "remark-sectionize";
import { expressiveCodeConfig } from "./src/config.ts";
import { pluginLanguageBadge } from "./src/plugins/expressive-code/language-badge.ts";
import { AdmonitionComponent } from "./src/plugins/rehype-component-admonition.mjs";
import { GithubCardComponent } from "./src/plugins/rehype-component-github-card.mjs";
import { FriendsCardComponent } from "./src/plugins/rehype-component-github-card.mjs";
import { parseDirectiveNode } from "./src/plugins/remark-directive-rehype.js";
import { remarkExcerpt } from "./src/plugins/remark-excerpt.js";
import { remarkReadingTime } from "./src/plugins/remark-reading-time.mjs";
import { pluginCustomCopyButton } from "./src/plugins/expressive-code/custom-copy-button.js";

import vercel from "@astrojs/vercel";

// https://astro.build/config
export default defineConfig({
    image: {
        service: {
            entrypoint: 'astro/assets/services/sharp'
        },
        domains: ['fuwari.vercel.app'], // 如有远程图片可在此添加域名
        remotePatterns: [{ protocol: "https" }],
    },
  site: "https://fuwari.vercel.app/",
  base: "/",
  trailingSlash: "always",
  
  // 构建优化配置
  output: 'static', // 确保纯静态输出，利于 CDN 缓存
  build: {
    inlineStylesheets: 'auto', // 自动内联小于 4KB 的 CSS，减少 HTTP 请求
  },
  compressHTML: true, // 压缩 HTML，移除空白和注释

  integrations: [
      tailwind({
          nesting: true,
      }),
      swup({
          theme: false,
          animationClass: "transition-swup-", // see https://swup.js.org/options/#animationselector
          // the default value `transition-` cause transition delay
          // when the Tailwind class `transition-all` is used
          containers: ["main", "#toc"],
          smoothScrolling: true,
          cache: true,
          preload: true,
          accessibility: true,
          updateHead: true,
          updateBodyClass: false,
          globalInstance: true,
      }),
      icon({
          include: {
              "preprocess: vitePreprocess(),": ["*"],
              "fa6-brands": ["*"],
              "fa6-regular": ["*"],
              "fa6-solid": ["*"],
          },
      }),
      expressiveCode({
          themes: [expressiveCodeConfig.theme, expressiveCodeConfig.theme],
          plugins: [
              pluginCollapsibleSections(),
              pluginLineNumbers(),
              pluginLanguageBadge(),
              pluginCustomCopyButton()
          ],
          defaultProps: {
              wrap: true,
              overridesByLang: {
                  'shellsession': {
                      showLineNumbers: false,
                  },
              },
          },
          styleOverrides: {
              codeBackground: "var(--codeblock-bg)",
              borderRadius: "0.75rem",
              borderColor: "none",
              codeFontSize: "0.875rem",
              codeFontFamily: "'JetBrains Mono Variable', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
              codeLineHeight: "1.5rem",
              frames: {
                  editorBackground: "var(--codeblock-bg)",
                  terminalBackground: "var(--codeblock-bg)",
                  terminalTitlebarBackground: "var(--codeblock-topbar-bg)",
                  editorTabBarBackground: "var(--codeblock-topbar-bg)",
                  editorActiveTabBackground: "none",
                  editorActiveTabIndicatorBottomColor: "var(--primary)",
                  editorActiveTabIndicatorTopColor: "none",
                  editorTabBarBorderBottomColor: "var(--codeblock-topbar-bg)",
                  terminalTitlebarBorderBottomColor: "none"
              },
              textMarkers: {
                  delHue: 0,
                  insHue: 180,
                  markHue: 250
              }
          },
          frames: {
              showCopyToClipboardButton: false,
          }
      }),
      svelte(),
      sitemap(),
	],

  markdown: {
      remarkPlugins: [
          remarkMath,
          remarkReadingTime,
          remarkExcerpt,
          remarkGithubAdmonitionsToDirectives,
          remarkDirective,
          remarkSectionize,
          parseDirectiveNode,
      ],
      rehypePlugins: [
          rehypeKatex,
          rehypeSlug,
          [
              rehypeComponents,
              {
                  components: {
                      friend: FriendsCardComponent,
                      github: GithubCardComponent,
                      note: (x, y) => AdmonitionComponent(x, y, "note"),
                      tip: (x, y) => AdmonitionComponent(x, y, "tip"),
                      important: (x, y) => AdmonitionComponent(x, y, "important"),
                      caution: (x, y) => AdmonitionComponent(x, y, "caution"),
                      warning: (x, y) => AdmonitionComponent(x, y, "warning"),
                  },
              },
          ],
          [
              rehypeAutolinkHeadings,
              {
                  behavior: "append",
                  properties: {
                      className: ["anchor"],
                  },
                  content: {
                      type: "element",
                      tagName: "span",
                      properties: {
                          className: ["anchor-icon"],
                          "data-pagefind-ignore": true,
                      },
                      children: [
                          {
                              type: "text",
                              value: "#",
                          },
                      ],
                  },
              },
          ],
      ],
	},

  vite: {
      build: {
          rollupOptions: {
              onwarn(warning, warn) {
                  // temporarily suppress this warning
                  if (
                      warning.message.includes("is dynamically imported by") &&
                      warning.message.includes("but also statically imported by")
                  ) {
                      return;
                  }
                  warn(warning);
              },
              output: {
                  // 代码分割策略：将大型库分离成独立 chunk
                  manualChunks: (id) => {
                      if (id.includes('node_modules')) {
                          // 将 photoswipe 单独打包
                          if (id.includes('photoswipe')) {
                              return 'photoswipe';
                          }
                          // 将 katex 单独打包
                          if (id.includes('katex')) {
                              return 'katex';
                          }
                          // 将 overlayscrollbars 单独打包
                          if (id.includes('overlayscrollbars')) {
                              return 'scrollbar';
                          }
                          // 将 swup 相关库单独打包
                          if (id.includes('swup')) {
                              return 'swup';
                          }
                          // 其他第三方库统一打包为 vendor
                          return 'vendor';
                      }
                  }
              }
          },
          // CSS 代码分割
          cssCodeSplit: true,
          // 使用 Terser 进行更好的压缩
          minify: 'terser',
          terserOptions: {
              compress: {
                  // 生产环境移除 console.log
                  drop_console: true,
                  // 移除 debugger
                  drop_debugger: true,
                  // 纯函数调用优化
                  pure_funcs: ['console.log', 'console.info'],
              },
              format: {
                  // 移除注释
                  comments: false,
              },
          },
      },
      ssr: {
          // 减少外部依赖，提升构建性能
          noExternal: ['@iconify/svelte'],
      },
	},

  adapter: vercel(),
});