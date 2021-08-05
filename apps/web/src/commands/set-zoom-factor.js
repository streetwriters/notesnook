import { invokeCommand } from "./index";

export default function setZoomFactor(zoomFactor) {
  invokeCommand("setZoomFactor", { zoomFactor });
}
