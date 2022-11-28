import { browser } from "webextension-polyfill-ts";
import { storeClip } from "./utils/storage";

browser.runtime.onMessage.addListener((message) => {
  if (message?.type === "manual") {
    storeClip(message.data).then(() => {
      return browser.notifications?.create({
        title: "Clip successful!",
        message: "Open Notesnook Web Clipper to save the clip!",
        type: "basic",
        iconUrl: browser.runtime.getURL("256x256.png"),
        isClickable: false
      });
    });
    return;
  }
});
