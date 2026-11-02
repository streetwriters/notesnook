<script setup lang="ts">
import { onMounted, ref } from "vue";

const isMac = ref(false);
onMounted(() => {
  isMac.value = /mac/i.test(navigator.platform || navigator.userAgent);
});

/**
 * Open the site's own search modal. VitePress listens for a Cmd/Ctrl+K keydown
 * on `window` and its nav button triggers search by dispatching exactly this
 * synthetic event, so we reuse that path rather than reimplementing search.
 */
function openSearch() {
  const event = new Event("keydown") as Event & { key: string; metaKey: boolean };
  event.key = "k";
  event.metaKey = true;
  window.dispatchEvent(event);
}
</script>

<template>
  <div class="nn-home-search">
    <button
      type="button"
      class="nn-home-search__button"
      aria-label="Search the documentation"
      @click="openSearch"
    >
      <span class="nn-home-search__icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
          <path
            d="M9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.44,13.73L14.71,14H15.5L20.5,19L19,20.5L14,15.5V14.71L13.73,14.44C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3M9.5,5C7,5 5,7 5,9.5C5,12 7,14 9.5,14C12,14 14,12 14,9.5C14,7 12,5 9.5,5Z"
          />
        </svg>
      </span>
      <span class="nn-home-search__placeholder">Search the docs…</span>
      <kbd class="nn-home-search__key">{{ isMac ? "⌘" : "Ctrl" }} K</kbd>
    </button>
    <p class="nn-home-search__hint">
      Try “import from Evernote”, “app lock”, or “why is my note not syncing”.
    </p>
  </div>
</template>

<style scoped>
.nn-home-search {
  max-width: 640px;
  /* The hero's own bottom padding stops here, so the space below the search box
     has to come from this margin — without it the features grid rides up over
     the hint text. */
  margin: 16px auto 56px;
  padding: 0 24px;
}

@media (max-width: 640px) {
  .nn-home-search {
    margin: 8px auto 40px;
  }
}

.nn-home-search__button {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 14px 16px;
  border: 1.5px solid var(--vp-c-divider);
  border-radius: var(--nn-radius-button, 10px);
  background-color: var(--vp-c-bg);
  color: var(--vp-c-text-3);
  font-size: 16px;
  text-align: left;
  cursor: text;
  transition: border-color 120ms ease-out, box-shadow 120ms ease-out;
}

.nn-home-search__button:hover,
.nn-home-search__button:focus-visible {
  border-color: var(--nn-accent);
  box-shadow: 0 0 0 3px var(--vp-c-brand-soft);
  outline: none;
}

.nn-home-search__icon {
  display: flex;
  color: var(--vp-c-text-3);
}

.nn-home-search__placeholder {
  flex: 1;
}

.nn-home-search__key {
  flex-shrink: 0;
  padding: 2px 6px;
  border: 1px solid var(--vp-c-divider);
  border-bottom-width: 2px;
  border-radius: var(--nn-radius-default, 5px);
  background-color: var(--vp-c-bg-alt);
  font-family: var(--vp-font-family-mono);
  font-size: 11px;
  line-height: 1.6;
  color: var(--vp-c-text-3);
}

.nn-home-search__hint {
  margin: 10px 2px 0;
  font-size: 13px;
  color: var(--vp-c-text-3);
}

@media (max-width: 640px) {
  .nn-home-search__key {
    display: none;
  }
}
</style>
