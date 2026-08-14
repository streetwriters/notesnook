<script setup lang="ts">
/**
 * Every page on the site, grouped exactly as the sidebar groups them.
 *
 * The home page has no sidebar, so without this there is no way to see what the
 * documentation actually covers. Reads the same sidebar module the site is
 * built from, so it can never drift from the navigation.
 */
import { sidebar } from "../../sidebar.mjs";

type Item = { text: string; link?: string; items?: Item[] };

// Drop this page's own entry — listing the index inside the index is noise.
const groups = (sidebar as Item[]).map((group) => ({
  ...group,
  items: group.items?.filter((item) => item.link !== "/docs")
}));

const pageCount = groups.reduce(
  (total, group) => total + (group.items?.filter((i) => i.link).length ?? 0),
  0
);
</script>

<template>
  <div class="nn-index">
    <p class="nn-index__count">{{ pageCount }} pages, grouped by what you're trying to do.</p>
    <div class="nn-index__grid">
      <section v-for="group in groups" :key="group.text" class="nn-index__group">
        <h2 class="nn-index__heading">{{ group.text }}</h2>
        <ul class="nn-index__list">
          <li v-for="item in group.items" :key="item.link || item.text">
            <a v-if="item.link" :href="item.link">{{ item.text }}</a>
            <span v-else>{{ item.text }}</span>
          </li>
        </ul>
      </section>
    </div>
  </div>
</template>

<style scoped>
.nn-index__count {
  margin: 0 0 28px;
  color: var(--vp-c-text-2);
}

.nn-index__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 28px 32px;
}

.nn-index__group {
  break-inside: avoid;
}

.nn-index__heading {
  margin: 0 0 10px;
  padding: 0 0 8px;
  border: none;
  border-bottom: 1px solid var(--vp-c-divider);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--vp-c-text-3);
}

.nn-index__list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.nn-index__list li {
  margin: 0 0 6px;
  line-height: 1.5;
}

.nn-index__list a {
  font-weight: 400;
  text-decoration: none;
}

.nn-index__list a:hover {
  text-decoration: underline;
}
</style>
