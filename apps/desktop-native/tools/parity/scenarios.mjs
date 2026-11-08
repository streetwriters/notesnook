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

export const TEXT_SCORE_THRESHOLD = 0.1;
