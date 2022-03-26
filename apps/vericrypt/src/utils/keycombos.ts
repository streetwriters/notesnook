import Platform from "platform";

const isMac = Platform.os
  ?.toString()
  .toLowerCase()
  .includes("mac");

const combos = {
  macos: {
    chromium: { developerTools: ["Cmd", "Opt", "J"] },
    firefox: { developerTools: ["Command", "Option", "K"] },
  },
  others: {
    chromium: { developerTools: ["Control", "Shift", "J"] },
    firefox: { developerTools: ["Control", "Shift", "K"] },
  },
};

type KeyboardTypes = keyof typeof combos;
type Browsers = keyof typeof combos[KeyboardTypes];
type ComboIds = keyof typeof combos[KeyboardTypes][Browsers];

export function getCombo(browser: Browsers, id: ComboIds): string[] {
  const keyboardType: KeyboardTypes = isMac ? "macos" : "others";
  return combos[keyboardType][browser][id];
}
