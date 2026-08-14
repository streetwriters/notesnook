/**
 * Documentation versions.
 *
 * The **latest** version is served from the site root (`/create-a-note`,
 * `/organizing-notes/...`) so canonical URLs never move. Older versions are
 * served from `/v<version>/`.
 *
 * Older versions are stored as *differences*, not copies. `contents/_versions/`
 * holds only the pages whose content actually differs from the current docs;
 * every other page is shared, and the full `/v<version>/` tree is composed at
 * build time by `scripts/build-versions.mjs`.
 *
 * Cutting a new version:      npm run version -- 3.5
 * Changing a page afterwards: npm run fork -- 3.4 <page>   (before editing)
 */

/** The version the docs at the site root describe. */
export const LATEST = "3.4";

/** Older versions, newest first. */
export const ARCHIVED = [];

export const isArchivedPath = (path) =>
  ARCHIVED.some((v) => path.startsWith(`/v${v}/`));

export const versionOfPath = (path) =>
  ARCHIVED.find((v) => path.startsWith(`/v${v}/`)) ?? LATEST;

/** The version picker shown in the nav bar. */
export const versionsNavItem = {
  text: `v${LATEST}`,
  items: [
    { text: `v${LATEST} (latest)`, link: "/" },
    ...ARCHIVED.map((v) => ({ text: `v${v}`, link: `/v${v}/` }))
  ]
};
