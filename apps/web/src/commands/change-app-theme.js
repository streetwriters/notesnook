import { invokeCommand } from "./index";

export default function changeAppTheme(theme) {
  invokeCommand("changeAppTheme", { theme });
}
