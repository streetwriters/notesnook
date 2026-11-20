import { getThemeScope, ThemeDefinition } from "@notesnook/theme";
import { useThemeStore } from "../../stores/use-theme-store";
import { IOSWidgets } from "./ios-widgets";

const accentOf = (theme?: ThemeDefinition) =>
  theme ? getThemeScope("base", theme).colors.primary.accent : undefined;

let published = "";
let watching = false;

function publish() {
  const { lightTheme, darkTheme } = useThemeStore.getState();
  const palette = { light: accentOf(lightTheme), dark: accentOf(darkTheme) };
  const serialized = JSON.stringify(palette);
  if (serialized === published) return;
  published = serialized;
  IOSWidgets.publish("theme", palette, [
    "NotesWidget",
    "NotesListWidget",
    "RemindersWidget",
    "NotePreviewWidget"
  ]);
}

export const WidgetTheme = {
  watch() {
    if (!IOSWidgets.isSupported || watching) return;
    watching = true;
    publish();
    useThemeStore.subscribe(publish);
  }
};
