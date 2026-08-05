<script setup lang="ts">
/**
 * Conversion block for high-intent pages (importers, comparisons, "how do I…"
 * pages that people land on from search). Renders real anchors so crawlers and
 * no-JS clients follow them.
 */
withDefaults(
  defineProps<{
    title?: string;
    text?: string;
    /** Primary link target: "download" | "pricing" */
    action?: string;
  }>(),
  {
    title: "Ready to move your notes?",
    text: "Notesnook is free to use, end-to-end encrypted by default, and open source. Install it on every device you own and your notes stay in sync — readable only by you.",
    action: "download"
  }
);
</script>

<template>
  <aside class="nn-cta">
    <p class="nn-cta__title">{{ title }}</p>
    <p class="nn-cta__text">{{ text }}</p>
    <p class="nn-cta__actions">
      <a
        v-if="action === 'download'"
        class="nn-cta__button"
        href="https://notesnook.com/downloads"
        >Download Notesnook</a
      >
      <a
        v-else
        class="nn-cta__button"
        href="https://notesnook.com/pricing"
        >See plans and pricing</a
      >
      <a class="nn-cta__link" href="/plans-and-limits">What's included in each plan</a>
    </p>
  </aside>
</template>

<style scoped>
.nn-cta {
  margin: 32px 0;
  padding: 20px 24px;
  border: 1px solid var(--vp-c-divider);
  border-left: 3px solid var(--nn-accent);
  border-radius: var(--nn-radius-large);
  background-color: var(--vp-c-bg-alt);
}

.nn-cta__title {
  margin: 0 0 6px;
  font-weight: 600;
  color: var(--vp-c-text-1);
}

.nn-cta__text {
  margin: 0 0 14px;
  font-size: 15px;
  line-height: 1.6;
  color: var(--vp-c-text-2);
}

.nn-cta__actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
  margin: 0;
}

.nn-cta__button {
  display: inline-block;
  padding: 8px 16px;
  border-radius: var(--nn-radius-button);
  background-color: var(--nn-accent);
  color: var(--nn-accent-foreground) !important;
  font-size: 14px;
  font-weight: 600;
  text-decoration: none !important;
  transition: background-color 100ms ease-out;
}

.nn-cta__button:hover {
  background-color: #008837e6;
}

.nn-cta__link {
  font-size: 14px;
  font-weight: 500;
}
</style>
