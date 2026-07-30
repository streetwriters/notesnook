<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  /** essential | pro | believer | free — the LOWEST plan that unlocks the feature. */
  plan: string;
  /** Set when the feature is limited to one platform, e.g. "Android only". */
  note?: string;
}>();

const PLANS: Record<string, { label: string; title: string }> = {
  free: {
    label: "Free",
    title: "Available on every plan, including Free"
  },
  essential: {
    label: "Essential",
    title: "Requires the Essential plan or higher (Essential, Pro, Believer)"
  },
  pro: {
    label: "Pro",
    title: "Requires the Pro plan or higher (Pro, Believer)"
  },
  believer: {
    label: "Believer",
    title: "Requires the Believer plan"
  }
};

const tier = computed(() => PLANS[props.plan.toLowerCase()] ?? PLANS.pro);
</script>

<template>
  <span class="nn-plan-tag ignore-header" :class="`nn-plan-tag--${plan.toLowerCase()}`" :title="tier.title">
    {{ tier.label }}
    <span v-if="note" class="nn-plan-tag__note">· {{ note }}</span>
  </span>
</template>

<style scoped>
.nn-plan-tag {
  display: inline-block;
  vertical-align: middle;
  margin-left: 6px;
  padding: 1px 8px;
  border-radius: 100px;
  border: 1px solid transparent;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.03em;
  line-height: 1.7;
  white-space: nowrap;
  text-transform: uppercase;
  cursor: help;
}

.nn-plan-tag__note {
  font-weight: 500;
  text-transform: none;
  opacity: 0.85;
}

.nn-plan-tag--free {
  background-color: var(--vp-c-bg-alt);
  border-color: var(--vp-c-divider);
  color: var(--vp-c-text-2);
}

.nn-plan-tag--essential,
.nn-plan-tag--pro,
.nn-plan-tag--believer {
  background-color: var(--vp-c-brand-soft);
  border-color: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
}

.nn-plan-tag--believer {
  background-color: transparent;
  border-color: var(--nn-accent);
}

h1 .nn-plan-tag,
h2 .nn-plan-tag,
h3 .nn-plan-tag {
  position: relative;
  top: -2px;
  font-size: 12px;
}
</style>
