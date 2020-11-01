function fallbackCopyTextToClipboard(text) {
  return new Promise((resolve, reject) => {
    var textArea = document.createElement("textarea");
    textArea.value = text;

    // Avoid scrolling to bottom
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.position = "fixed";

    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      var successful = document.execCommand("copy");
      resolve(successful);
    } catch (err) {
      reject(err);
    } finally {
      document.body.removeChild(textArea);
    }
  });
}
function copyToClipboard(text) {
  if (!navigator.clipboard) {
    return fallbackCopyTextToClipboard(text);
  }

  return navigator.permissions
    .query({ name: "clipboard-write" })
    .then((result) => {
      if (result.state === "granted" || result.state === "prompt") {
        return navigator.clipboard.writeText(text);
      }
    });
}
export default copyToClipboard;
