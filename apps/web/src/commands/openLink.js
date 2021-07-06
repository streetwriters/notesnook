import { isDesktop } from "../utils/platform";
import { invokeCommand } from "./index";

const windowOpen = window.open.bind(window);
export default function openLink(link, target = "_blank") {
  if (isDesktop() && target === "_blank") {
    invokeCommand("openLink", { link });
  } else {
    windowOpen(link, target);
  }
}
