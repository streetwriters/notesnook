// vite.config.mts
import path, { resolve } from "path";
import { defineConfig } from "file:///Users/thecodrr/Sources/Repos/notesnook/packages/intl/node_modules/vite/dist/node/index.js";
import swc from "file:///Users/thecodrr/Sources/Repos/notesnook/packages/intl/node_modules/vite-plugin-swc-transform/dist/esm/index.js";
import dts from "file:///Users/thecodrr/Sources/Repos/notesnook/packages/intl/node_modules/vite-plugin-dts/dist/index.mjs";
import { fileURLToPath } from "url";
var __vite_injected_original_import_meta_url = "file:///Users/thecodrr/Sources/Repos/notesnook/packages/intl/vite.config.mts";
var __filename = fileURLToPath(__vite_injected_original_import_meta_url);
var __dirname = path.dirname(__filename);
var vite_config_default = defineConfig({
  plugins: [
    swc({
      swcOptions: {
        sourceMaps: true,
        jsc: {
          parser: {
            syntax: "typescript",
            tsx: true
          },
          baseUrl: __dirname,
          paths: {
            "$src/*": ["src/*"]
          },
          experimental: {
            plugins: [
              [
                "@lingui/swc-plugin",
                {
                  runtimeModules: {
                    i18n: ["$src/setup", "i18n"]
                  }
                }
              ]
            ]
          }
        }
      }
    }),
    dts({
      exclude: ["**/locales/*.json"],
      rollupTypes: true
    })
  ],
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      formats: ["cjs", "es"],
      fileName(format) {
        return format === "cjs" ? "index.js" : "index.mjs";
      }
    },
    outDir: resolve(__dirname, "dist")
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcubXRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiL1VzZXJzL3RoZWNvZHJyL1NvdXJjZXMvUmVwb3Mvbm90ZXNub29rL3BhY2thZ2VzL2ludGxcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9Vc2Vycy90aGVjb2Ryci9Tb3VyY2VzL1JlcG9zL25vdGVzbm9vay9wYWNrYWdlcy9pbnRsL3ZpdGUuY29uZmlnLm10c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vVXNlcnMvdGhlY29kcnIvU291cmNlcy9SZXBvcy9ub3Rlc25vb2svcGFja2FnZXMvaW50bC92aXRlLmNvbmZpZy5tdHNcIjsvKlxuVGhpcyBmaWxlIGlzIHBhcnQgb2YgdGhlIE5vdGVzbm9vayBwcm9qZWN0IChodHRwczovL25vdGVzbm9vay5jb20vKVxuXG5Db3B5cmlnaHQgKEMpIDIwMjMgU3RyZWV0d3JpdGVycyAoUHJpdmF0ZSkgTGltaXRlZFxuXG5UaGlzIHByb2dyYW0gaXMgZnJlZSBzb2Z0d2FyZTogeW91IGNhbiByZWRpc3RyaWJ1dGUgaXQgYW5kL29yIG1vZGlmeVxuaXQgdW5kZXIgdGhlIHRlcm1zIG9mIHRoZSBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBhcyBwdWJsaXNoZWQgYnlcbnRoZSBGcmVlIFNvZnR3YXJlIEZvdW5kYXRpb24sIGVpdGhlciB2ZXJzaW9uIDMgb2YgdGhlIExpY2Vuc2UsIG9yXG4oYXQgeW91ciBvcHRpb24pIGFueSBsYXRlciB2ZXJzaW9uLlxuXG5UaGlzIHByb2dyYW0gaXMgZGlzdHJpYnV0ZWQgaW4gdGhlIGhvcGUgdGhhdCBpdCB3aWxsIGJlIHVzZWZ1bCxcbmJ1dCBXSVRIT1VUIEFOWSBXQVJSQU5UWTsgd2l0aG91dCBldmVuIHRoZSBpbXBsaWVkIHdhcnJhbnR5IG9mXG5NRVJDSEFOVEFCSUxJVFkgb3IgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UuICBTZWUgdGhlXG5HTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBmb3IgbW9yZSBkZXRhaWxzLlxuXG5Zb3Ugc2hvdWxkIGhhdmUgcmVjZWl2ZWQgYSBjb3B5IG9mIHRoZSBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZVxuYWxvbmcgd2l0aCB0aGlzIHByb2dyYW0uICBJZiBub3QsIHNlZSA8aHR0cDovL3d3dy5nbnUub3JnL2xpY2Vuc2VzLz4uXG4qL1xuXG5pbXBvcnQgcGF0aCwgeyByZXNvbHZlIH0gZnJvbSBcInBhdGhcIjtcbmltcG9ydCB7IGRlZmluZUNvbmZpZyB9IGZyb20gXCJ2aXRlXCI7XG5pbXBvcnQgc3djIGZyb20gXCJ2aXRlLXBsdWdpbi1zd2MtdHJhbnNmb3JtXCI7XG5pbXBvcnQgZHRzIGZyb20gXCJ2aXRlLXBsdWdpbi1kdHNcIjtcbmltcG9ydCB7IGZpbGVVUkxUb1BhdGggfSBmcm9tIFwidXJsXCI7XG5cbmNvbnN0IF9fZmlsZW5hbWUgPSBmaWxlVVJMVG9QYXRoKGltcG9ydC5tZXRhLnVybCk7XG5jb25zdCBfX2Rpcm5hbWUgPSBwYXRoLmRpcm5hbWUoX19maWxlbmFtZSk7XG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XG4gIHBsdWdpbnM6IFtcbiAgICBzd2Moe1xuICAgICAgc3djT3B0aW9uczoge1xuICAgICAgICBzb3VyY2VNYXBzOiB0cnVlLFxuICAgICAgICBqc2M6IHtcbiAgICAgICAgICBwYXJzZXI6IHtcbiAgICAgICAgICAgIHN5bnRheDogXCJ0eXBlc2NyaXB0XCIsXG4gICAgICAgICAgICB0c3g6IHRydWVcbiAgICAgICAgICB9LFxuICAgICAgICAgIGJhc2VVcmw6IF9fZGlybmFtZSxcbiAgICAgICAgICBwYXRoczoge1xuICAgICAgICAgICAgXCIkc3JjLypcIjogW1wic3JjLypcIl1cbiAgICAgICAgICB9LFxuICAgICAgICAgIGV4cGVyaW1lbnRhbDoge1xuICAgICAgICAgICAgcGx1Z2luczogW1xuICAgICAgICAgICAgICBbXG4gICAgICAgICAgICAgICAgXCJAbGluZ3VpL3N3Yy1wbHVnaW5cIixcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICBydW50aW1lTW9kdWxlczoge1xuICAgICAgICAgICAgICAgICAgICBpMThuOiBbXCIkc3JjL3NldHVwXCIsIFwiaTE4blwiXVxuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgXVxuICAgICAgICAgICAgXVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pLFxuICAgIGR0cyh7XG4gICAgICBleGNsdWRlOiBbXCIqKi9sb2NhbGVzLyouanNvblwiXSxcbiAgICAgIHJvbGx1cFR5cGVzOiB0cnVlXG4gICAgfSlcbiAgXSxcbiAgYnVpbGQ6IHtcbiAgICBsaWI6IHtcbiAgICAgIGVudHJ5OiByZXNvbHZlKF9fZGlybmFtZSwgXCJzcmMvaW5kZXgudHNcIiksXG4gICAgICBmb3JtYXRzOiBbXCJjanNcIiwgXCJlc1wiXSxcbiAgICAgIGZpbGVOYW1lKGZvcm1hdCkge1xuICAgICAgICByZXR1cm4gZm9ybWF0ID09PSBcImNqc1wiID8gXCJpbmRleC5qc1wiIDogXCJpbmRleC5tanNcIjtcbiAgICAgIH1cbiAgICB9LFxuICAgIG91dERpcjogcmVzb2x2ZShfX2Rpcm5hbWUsIFwiZGlzdFwiKVxuICB9XG59KTtcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFtQkEsT0FBTyxRQUFRLGVBQWU7QUFDOUIsU0FBUyxvQkFBb0I7QUFDN0IsT0FBTyxTQUFTO0FBQ2hCLE9BQU8sU0FBUztBQUNoQixTQUFTLHFCQUFxQjtBQXZCcUwsSUFBTSwyQ0FBMkM7QUF5QnBRLElBQU0sYUFBYSxjQUFjLHdDQUFlO0FBQ2hELElBQU0sWUFBWSxLQUFLLFFBQVEsVUFBVTtBQUV6QyxJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUMxQixTQUFTO0FBQUEsSUFDUCxJQUFJO0FBQUEsTUFDRixZQUFZO0FBQUEsUUFDVixZQUFZO0FBQUEsUUFDWixLQUFLO0FBQUEsVUFDSCxRQUFRO0FBQUEsWUFDTixRQUFRO0FBQUEsWUFDUixLQUFLO0FBQUEsVUFDUDtBQUFBLFVBQ0EsU0FBUztBQUFBLFVBQ1QsT0FBTztBQUFBLFlBQ0wsVUFBVSxDQUFDLE9BQU87QUFBQSxVQUNwQjtBQUFBLFVBQ0EsY0FBYztBQUFBLFlBQ1osU0FBUztBQUFBLGNBQ1A7QUFBQSxnQkFDRTtBQUFBLGdCQUNBO0FBQUEsa0JBQ0UsZ0JBQWdCO0FBQUEsb0JBQ2QsTUFBTSxDQUFDLGNBQWMsTUFBTTtBQUFBLGtCQUM3QjtBQUFBLGdCQUNGO0FBQUEsY0FDRjtBQUFBLFlBQ0Y7QUFBQSxVQUNGO0FBQUEsUUFDRjtBQUFBLE1BQ0Y7QUFBQSxJQUNGLENBQUM7QUFBQSxJQUNELElBQUk7QUFBQSxNQUNGLFNBQVMsQ0FBQyxtQkFBbUI7QUFBQSxNQUM3QixhQUFhO0FBQUEsSUFDZixDQUFDO0FBQUEsRUFDSDtBQUFBLEVBQ0EsT0FBTztBQUFBLElBQ0wsS0FBSztBQUFBLE1BQ0gsT0FBTyxRQUFRLFdBQVcsY0FBYztBQUFBLE1BQ3hDLFNBQVMsQ0FBQyxPQUFPLElBQUk7QUFBQSxNQUNyQixTQUFTLFFBQVE7QUFDZixlQUFPLFdBQVcsUUFBUSxhQUFhO0FBQUEsTUFDekM7QUFBQSxJQUNGO0FBQUEsSUFDQSxRQUFRLFFBQVEsV0FBVyxNQUFNO0FBQUEsRUFDbkM7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
