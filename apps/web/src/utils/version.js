import showdown from "showdown";

export const appVersion = {
  formatted: format(
    process.env.REACT_APP_VERSION,
    process.env.REACT_APP_GIT_HASH,
    process.env.REACT_APP_PLATFORM
  ),
  numerical: parseInt(process.env.REACT_APP_VERSION),
};

/**
 *
 * @param {number} version
 * @param {string} hash
 * @param {"web"|"desktop"} type
 */
function format(version, hash, type) {
  return `${formatVersion(version)}-${hash}-${type}`;
}

/**
 *
 * @param {number} version
 * @param {string} hash
 * @param {"web"|"desktop"} type
 */
function formatVersion(version) {
  if (!version) return "";
  const [major, minor, bugfix0, bugfix1] = version.toString().split("");
  return `${major}.${minor}.${bugfix0}${bugfix1 || ""}`;
}

/**
 *
 * @param {ServiceWorker} serviceWorker
 * @returns {Promise<{formatted: string, numerical: number}>}
 */
export function getServiceWorkerVersion(serviceWorker) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(
      () => reject("Service worker did not respond."),
      10 * 1000
    );
    navigator.serviceWorker.addEventListener("message", (ev) => {
      const { type } = ev.data;
      if (type !== "GET_VERSION") return;
      clearTimeout(timeout);

      const { version } = ev.data;
      resolve({
        formatted: formatVersion(version),
        numerical: parseInt(version),
      });
    });
    serviceWorker.postMessage({ type: "GET_VERSION" });
  });
}

var converter = new showdown.Converter();
converter.setFlavor("github");

export async function getChangelog(tag) {
  try {
    if (!tag) return;

    const url = `https://api.github.com/repos/streetwriters/notesnook/releases/tags/v${tag}`;
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
    });
    if (!response.ok) return "No changelog found.";

    const release = await response.json();
    if (!release) return "No changelog found.";

    const { body } = release;

    const html = converter.makeHtml(body);
    return html;
  } catch {
    return "No changelog found.";
  }
}
