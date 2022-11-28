import { browser } from "webextension-polyfill-ts";
import {
  clipArticle,
  cleanup,
  clipPage,
  clipScreenshot,
  enterNodeSelectionMode
} from "@notesnook/clipper";
import { ClipArea, ClipMode } from "../common/bridge";

browser.runtime.onMessage.addListener((request) => {
  const message = request as {
    type?: string;
    mode?: ClipMode;
    area?: ClipArea;
  };

  if (message.type === "viewport") {
    return Promise.resolve({
      x: 0,
      y: 0,
      height: document.body.clientHeight,
      width: document.body.clientWidth
    });
  }

  try {
    const isScreenshot = message.mode === "screenshot";
    const withStyles = message.mode === "complete" || isScreenshot;

    if (isScreenshot && message.area === "full-page") {
      return clipScreenshot(document.body, "jpeg");
    } else if (message.area === "full-page") {
      return clipPage(document, withStyles, false);
    } else if (message.area === "selection") {
      enterNodeSelectionMode(document).then((result) =>
        browser.runtime.sendMessage({ type: "manual", data: result })
      );
    } else if (message.area === "article") {
      return clipArticle(document, withStyles);
    } else if (message.area === "visible") {
      return clipPage(document, withStyles, true);
    }
  } catch (e) {
    console.error(e);
  } finally {
    if (message.area !== "selection") cleanup();
  }
});
