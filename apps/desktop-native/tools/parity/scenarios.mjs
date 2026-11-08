const DAY = 24 * 60 * 60 * 1000;
const HOUR = 60 * 60 * 1000;

const TITLES = [
  "Meeting notes",
  "Grocery list",
  "Project plan for the next quarter",
  "Travel itinerary",
  "Book recommendations",
  "Recipe: lentil soup",
  "Ideas",
  "Reading list"
];

export function shellSeed(now) {
  return TITLES.map((title, index) => {
    const age = index * (index < 4 ? 3 * HOUR : 9 * DAY);
    return {
      title,
      content: `${title}. A short body of text that continues for a few words so the list shows a headline under the title.`,
      favorite: index % 3 === 0,
      dateEdited: now - age,
      dateCreated: now - age
    };
  });
}

export const extras = {
  notebooks: [{ title: "Work" }, { title: "Personal" }, { title: "Recipes" }],
  tags: [{ title: "urgent" }, { title: "ideas" }, { title: "later" }],
  colors: [
    { title: "Red", colorCode: "#f44336" },
    { title: "Blue", colorCode: "#2196f3" }
  ]
};

export const scenarios = {
  shell: {
    size: [1200, 800],
    scale: 2,
    schemes: ["light", "dark"],
    route: "/notes",
    seed: shellSeed,
    mask: {
      reason: "editor and editor footer are deferred",
      ids: [
        "editor-title",
        "tags",
        "editor-tag-input",
        "Disable editor margins",
        "Enter fullscreen",
        "Focus mode",
        "editor-word-count",
        "editor-save-state-notsaved"
      ],
      rects: [{ x: 630, y: 45, width: 570, height: 755 }]
    }
  }
};

scenarios.userMenu = {
  ...scenarios.shell,
  steps: [{ click: "profile-dropdown" }]
};

scenarios.notebooksTab = {
  ...scenarios.shell,
  steps: [{ click: "tab-notebooks" }]
};
scenarios.tagsTab = {
  ...scenarios.shell,
  steps: [{ click: "tab-tags" }]
};
scenarios.navHover = {
  ...scenarios.shell,
  steps: [{ hover: { id: "navigation-item", nth: 1 } }],
  keepPointer: true
};
scenarios.listSelected = {
  ...scenarios.shell,
  steps: [{ click: { id: "list-item", nth: 1 } }]
};
scenarios.listHover = {
  ...scenarios.shell,
  steps: [{ hover: { id: "list-item", nth: 2 } }],
  keepPointer: true
};

scenarios.compactList = {
  ...scenarios.shell,
  steps: [{ click: "home-view-mode-button" }]
};
scenarios.emptyList = {
  ...scenarios.shell,
  seed: () => [],
  noExtras: true
};

scenarios.notebookOpen = {
  ...scenarios.shell,
  steps: [{ click: "tab-notebooks" }, { click: { id: "list-item", nth: 0 } }]
};

scenarios.notebookTree = {
  ...scenarios.shell,
  notebooks: [
    {
      title: "Work",
      children: [
        { title: "Plans", children: [{ title: "Quarter one" }] },
        { title: "Reports" }
      ]
    },
    { title: "Personal" },
    { title: "Recipes" }
  ],
  steps: [{ click: "tab-notebooks" }, { expand: 0 }, { expand: 1 }]
};

scenarios.search = {
  ...scenarios.shell,
  steps: [{ type: { id: "search-input", text: "short body" } }]
};

scenarios.searchEmpty = {
  ...scenarios.shell,
  steps: [{ type: { id: "search-input", text: "zzzqq" } }]
};

const LONG_WORDS =
  "supercalifragilisticexpialidocious-unbroken-token-without-any-space-to-wrap-at-all";
const LONG_SENTENCE =
  "This note has a body that is much longer than the list can show, so the headline has to be cut off after a few lines. ".repeat(
    6
  );

scenarios.longContent = {
  ...scenarios.shell,
  seed: (now) => [
    {
      title:
        "A very long note title that keeps going well past the width of the list pane so it must be cut with an ellipsis",
      content: LONG_SENTENCE,
      favorite: true,
      dateEdited: now - HOUR,
      dateCreated: now - HOUR
    },
    {
      title: LONG_WORDS,
      content: LONG_WORDS.repeat(3),
      dateEdited: now - 2 * HOUR,
      dateCreated: now - 2 * HOUR
    },
    {
      title: "Short title",
      content: LONG_SENTENCE,
      dateEdited: now - 3 * HOUR,
      dateCreated: now - 3 * HOUR
    },
    {
      title: "Accents and symbols: café, naïve, 日本語, emoji 🙂",
      content: "Ünïcödé body with 日本語 text and an emoji 🙂 at the end.",
      dateEdited: now - 4 * HOUR,
      dateCreated: now - 4 * HOUR
    }
  ]
};

scenarios.settingsAppearance = {
  ...scenarios.shell,
  steps: [
    { click: "profile-dropdown" },
    { click: "menu-button-settings" },
    { clickText: "Appearance" }
  ]
};

const openSettings = [
  { click: "profile-dropdown" },
  { click: "menu-button-settings" }
];

const SETTINGS_SECTIONS = {
  settingsProfile: "Profile",
  settingsBehaviour: "Behaviour",
  settingsEditor: "Editor",
  settingsDesktopIntegration: "Desktop integration",
  settingsNotifications: "Notifications",
  settingsServers: "Servers",
  settingsBackupExport: "Backup & export",
  settingsImporter: "Notesnook Importer",
  settingsAppLock: "App lock",
  settingsVault: "Vault",
  settingsPrivacy: "Privacy",
  settingsLegal: "Legal",
  settingsSupport: "Help and support",
  settingsAbout: "About"
};

for (const [name, title] of Object.entries(SETTINGS_SECTIONS))
  scenarios[name] = {
    ...scenarios.shell,
    steps: [...openSettings, { clickText: title }]
  };

scenarios.settingsFirstSection = {
  ...scenarios.shell,
  steps: openSettings
};

scenarios.settingsSearch = {
  ...scenarios.shell,
  steps: [...openSettings, { type: { id: "settings-search", text: "theme" } }]
};

scenarios.settingsEscape = {
  ...scenarios.shell,
  steps: [...openSettings, { press: "escape" }]
};

scenarios.dialogAddNotebook = {
  ...scenarios.shell,
  steps: [{ click: "tab-notebooks" }, { click: "create-notebook-button" }]
};

scenarios.dialogAddNotebookFilled = {
  ...scenarios.shell,
  steps: [
    { click: "tab-notebooks" },
    { click: "create-notebook-button" },
    { type: { id: "title-input", text: "Projects" } }
  ]
};

scenarios.dialogAddNotebookEscape = {
  ...scenarios.shell,
  steps: [
    { click: "tab-notebooks" },
    { click: "create-notebook-button" },
    { press: "escape" }
  ]
};

scenarios.dialogCreateTag = {
  ...scenarios.shell,
  steps: [{ click: "tab-tags" }, { click: "create-tag-button" }]
};

scenarios.dialogCreateTagFilled = {
  ...scenarios.shell,
  steps: [
    { click: "tab-tags" },
    { click: "create-tag-button" },
    { type: { id: "title-input", text: "groceries" } }
  ]
};

scenarios.dialogAddReminder = {
  ...scenarios.shell,
  steps: [
    { clickText: "Reminders", in: "nav" },
    { click: "reminders-action-button" }
  ]
};

scenarios.dialogAddReminderRepeat = {
  ...scenarios.dialogAddReminder,
  steps: [
    { clickText: "Reminders", in: "nav" },
    { click: "reminders-action-button" },
    { click: "mode-repeat" }
  ]
};

scenarios.dialogCommandPalette = {
  ...scenarios.shell,
  steps: [{ click: "command-palette" }]
};


const shellMask = {
  reason: "editor and editor footer are deferred",
  ids: ["editor-title", "editor-word-count"],
  rects: [{ x: 630, y: 45, width: 570, height: 755 }]
};

scenarios.tablet = {
  ...scenarios.shell,
  size: [800, 700],
  mask: { ...shellMask, rects: [] }
};

scenarios.mobile = {
  ...scenarios.shell,
  size: [420, 800],
  mask: { reason: "editor is deferred", ids: [], rects: [] }
};

scenarios.navCollapsed = {
  ...scenarios.shell,
  steps: [{ click: "sidebar-toggle" }],
  mask: shellMask
};

scenarios.navCollapsedHover = {
  ...scenarios.shell,
  steps: [{ click: "sidebar-toggle" }, { hover: "navigation-menu-root" }],
  keepPointer: true,
  mask: shellMask
};

for (const [name, route] of [
  ["signup", "/signup"],
  ["login", "/login"],
  ["recover", "/recover"],
  ["sessionExpired", "/sessionexpired"]
]) {
  scenarios[name] = {
    size: [1200, 800],
    scale: 2,
    schemes: ["light", "dark"],
    route,
    initialPath: route,
    seed: () => [],
    noExtras: true,
    mask: { reason: "no live data on the auth pages", ids: [], rects: [] }
  };
}

export const TEXT_SCORE_THRESHOLD = 0.1;
