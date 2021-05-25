var hidden, visibilityChange;
if (typeof document.hidden !== "undefined") {
  // Opera 12.10 and Firefox 18 and later support
  hidden = "hidden";
  visibilityChange = "visibilitychange";
} else if (typeof document.msHidden !== "undefined") {
  hidden = "msHidden";
  visibilityChange = "msvisibilitychange";
} else if (typeof document.webkitHidden !== "undefined") {
  hidden = "webkitHidden";
  visibilityChange = "webkitvisibilitychange";
}

// // If the page is hidden, pause the video;
// // if the page is shown, play the video
// function handleVisibilityChange() {
//   if (document[hidden]) {
//   } else {
//   }
// }

export function onPageVisibilityChanged(handler) {
  // Handle page visibility change
  document.addEventListener(visibilityChange, () => handler(document[hidden]));
}
