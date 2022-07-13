export type Platforms = "web" | "desktop";
export type AppVersion = typeof appVersion;
export const appVersion = {
  formatted: format(
    process.env.REACT_APP_VERSION,
    process.env.REACT_APP_GIT_HASH,
    process.env.REACT_APP_PLATFORM as Platforms,
    process.env.REACT_APP_BETA === "true"
  ),
  clean: formatVersion(process.env.REACT_APP_VERSION),
  numerical: parseInt(process.env.REACT_APP_VERSION || "0"),
  isBeta: process.env.REACT_APP_BETA === "true",
};

function format(
  version?: string,
  hash?: string,
  type?: "web" | "desktop",
  beta?: boolean
) {
  return `${formatVersion(version)}-${hash}-${type}${beta ? "-beta" : ""}`;
}

function formatVersion(version?: string) {
  if (!version) return "";
  const [major, minor, bugfix0, bugfix1] = version.toString().split("");
  return `${major}.${minor}.${bugfix0}${bugfix1 || ""}`;
}

export function getServiceWorkerVersion(
  serviceWorker: ServiceWorker
): Promise<AppVersion> {
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
        clean: formatVersion(version),
        isBeta: appVersion.isBeta,
      });
    });
    serviceWorker.postMessage({ type: "GET_VERSION" });
  });
}

export { getChangelog } from "@notesnook/desktop/changelog";
