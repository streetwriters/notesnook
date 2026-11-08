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

export const TEXT_SCORE_THRESHOLD = 0.1;
