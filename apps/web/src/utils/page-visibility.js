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

export function onPageVisibilityChanged(handler) {
  onDeviceOnline(() => handler("online", false));

  // Handle page visibility change
  document.addEventListener(visibilityChange, () =>
    handler("visibilitychange", document[hidden])
  );
}

function onDeviceOnline(handler) {
  window.addEventListener("online", function () {
    handler && handler();
  });
}
