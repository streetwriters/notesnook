import { invokeCommand } from "./index";

export function openPath(path) {
  invokeCommand("open", { link: path, linkType: "path" });
}
