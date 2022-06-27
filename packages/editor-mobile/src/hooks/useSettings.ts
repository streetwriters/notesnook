import { useState } from "react";

const settingsJson = localStorage.getItem("editorSettings");

const initialState = {
  readonly: false,
  fullscreen: false,
  deviceMode: "mobile",
  premium: false,
  tools: [
    [
      "insertBlock",
      "tableSettings",
      "imageSettings",
      "embedSettings",
      "attachmentSettings",
      "linkSettings",
      "codeRemove",
    ],
    [
      "bold",
      "italic",
      "underline",
      [
        "strikethrough",
        "code",
        "subscript",
        "superscript",
        "highlight",
        "textColor",
      ],
    ],
    ["fontSize"],
    ["headings", "fontFamily"],
    ["numberedList", "bulletList"],
    ["addLink"],
    ["alignCenter", ["alignLeft", "alignRight", "alignJustify", "ltr", "rtl"]],
    ["clearformatting"],
  ],
};

global.settingsController = {
  update: (settings) => {
    const nextSettings = { ...settingsController.previous, ...settings };
    if (settingsController.set) settingsController.set(nextSettings);
    if (settings) {
      localStorage.setItem("editorSettings", JSON.stringify(nextSettings));
    } else {
      localStorage.removeItem("editorSettings");
    }
    settingsController.previous = nextSettings;
  },
  previous: settingsJson ? JSON.parse(settingsJson) : initialState,
};

export const useSettings = () => {
  const [settings, setSettings] = useState(global.settingsController.previous);
  global.settingsController.set = setSettings;
  return settings;
};
