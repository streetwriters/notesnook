import { invokeCommand } from "./index";

export default function saveFile(filePath, data) {
  invokeCommand("saveFile", { filePath, data });
}
