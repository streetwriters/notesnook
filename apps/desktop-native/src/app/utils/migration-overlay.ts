export const MIGRATION_OVERLAY_DELAY_MS = 300;

export function createMigrationOverlay(
  onChange: (visible: boolean) => void,
  delay = MIGRATION_OVERLAY_DELAY_MS
) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return {
    start() {
      if (timer !== undefined) return;
      timer = setTimeout(() => onChange(true), delay);
    },
    finish() {
      if (timer !== undefined) clearTimeout(timer);
      timer = undefined;
      onChange(false);
    },
    dispose() {
      if (timer !== undefined) clearTimeout(timer);
      timer = undefined;
    }
  };
}
