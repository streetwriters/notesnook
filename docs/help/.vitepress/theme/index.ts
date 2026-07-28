import type { Theme } from "vitepress";
// theme-without-fonts skips the default theme's own bundled Inter — we ship the
// exact Inter files the Notesnook app uses instead (see fonts.css).
import DefaultTheme from "vitepress/theme-without-fonts";
import { enhanceAppWithTabs } from "vitepress-plugin-tabs/client";
import { h } from "vue";
import VersionBanner from "./components/VersionBanner.vue";
import PlanTag from "./components/PlanTag.vue";
import GetNotesnook from "./components/GetNotesnook.vue";
import "./fonts.css";
import "./notesnook.css";

export default {
  extends: DefaultTheme,
  Layout: () =>
    h(DefaultTheme.Layout, null, {
      // Renders only on pages under an archived /v<version>/ tree.
      "doc-before": () => h(VersionBanner)
    }),
  enhanceApp({ app }) {
    enhanceAppWithTabs(app);
    // Usable directly in markdown, no per-page import.
    app.component("PlanTag", PlanTag);
    app.component("GetNotesnook", GetNotesnook);
  }
} satisfies Theme;
