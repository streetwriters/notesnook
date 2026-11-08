export type SectionSpec = {
  title: string;
  keys: string[];
};

export const accountSections: SectionSpec[] = [
  {
    title: "Profile",
    keys: ["delete-data-for-not-logged-in-user"]
  }
];

export const customizationSections: SectionSpec[] = [
  { title: "Appearance", keys: ["zoom-factor", "color-scheme", "themes"] },
  {
    title: "Behaviour",
    keys: ["app-language", "default-sidebar-tab", "date-format"]
  },
  { title: "Editor", keys: ["default-title", "default-font", "line-height"] },
  { title: "Desktop integration", keys: ["auto-start", "minimize-to-tray"] },
  { title: "Notifications", keys: ["reminders"] },
  { title: "Servers", keys: ["config"] }
];

export const dataSections: SectionSpec[] = [
  {
    title: "Backup & export",
    keys: ["create-backup", "restore-backup", "auto-backup"]
  },
  { title: "Notesnook Importer", keys: ["import-notes"] },
  { title: "App lock", keys: ["enable-app-lock"] },
  { title: "Vault", keys: ["create-vault"] },
  { title: "Privacy", keys: ["marketing", "hide-note-title"] }
];

export const otherSections: SectionSpec[] = [
  { title: "Legal", keys: ["privacy-policy", "tos", "license"] },
  { title: "Help and support", keys: ["report-issue", "email-us", "docs"] },
  { title: "About", keys: ["version", "release-track", "source-code"] }
];
