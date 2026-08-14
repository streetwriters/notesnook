<script setup lang="ts">
import { computed } from "vue";
import { useData } from "vitepress";

const { frontmatter, page } = useData();

const archived = computed(() => frontmatter.value.archivedVersion as string | undefined);
const latest = computed(() => frontmatter.value.latestVersion as string | undefined);

// The same article in the latest docs, if it still exists there.
const latestLink = computed(() => {
  const path = page.value.relativePath
    .replace(/^v[\d.]+\//, "/")
    .replace(/(index)?\.md$/, "");
  return path.startsWith("/") ? path : `/${path}`;
});
</script>

<template>
  <div v-if="archived" class="nn-version-banner">
    <p>
      You are reading the documentation for <strong>Notesnook v{{ archived }}</strong>.
      The current version is v{{ latest }}.
    </p>
    <a :href="latestLink">Read the latest version of this page →</a>
  </div>
</template>

<style scoped>
.nn-version-banner {
  margin-bottom: 24px;
  padding: 15px 20px;
  border: 1px solid var(--vp-c-warning-soft);
  border-left: 3px solid var(--vp-c-warning-1);
  border-radius: var(--nn-radius-large);
  background-color: var(--vp-custom-block-warning-bg);
  font-size: 14px;
  line-height: 1.6;
}

.nn-version-banner p {
  margin: 0;
  color: var(--vp-c-text-1);
}

.nn-version-banner a {
  display: inline-block;
  margin-top: 6px;
  color: var(--vp-c-brand-1);
  font-weight: 500;
  text-decoration: none;
}

.nn-version-banner a:hover {
  text-decoration: underline;
}
</style>
