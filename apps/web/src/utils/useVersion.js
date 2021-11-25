// import { useEffect, useState } from "react";
// import { db } from "../common/db";
// import config from "./config";

var APP_VERSION = {
  formatted: format(
    1670,
    process.env.REACT_APP_GIT_HASH,
    process.env.REACT_APP_PLATFORM
  ),
  numerical: 1670,
  appUpdated: false,
  appUpdateable: false,
  changelog: undefined,
  fetched: false,
};

var CACHED_VERSION = undefined;

function useVersion() {
  // const [version, setVersion] = useState(APP_VERSION);

  // useEffect(() => {
  //   (async function () {
  //     const version = await getVersion();
  //     setVersion(version);
  //   })();
  // }, []);

  return [APP_VERSION, APP_VERSION];
}
export default useVersion;

/**
 *
 * @param {number} version
 * @param {string} hash
 * @param {"web"|"desktop"} type
 */
function format(version, hash, type) {
  const parts = version.toString().split("");
  return `${parts[0]}.${parts[1]}.${parts[2]}${
    parts[3] && parts[3] !== "0" ? parts[3] : ""
  }-${hash}-${type}`;
}

export function getAppVersion() {
  return APP_VERSION;
}

export function getCachedVersion() {
  return CACHED_VERSION;
}

// export async function getVersion() {
//   try {
//     var app_version = config.get("app_version");
//     if (!app_version) {
//       app_version = APP_VERSION;
//       config.set("app_version", APP_VERSION);
//     }
//     if (APP_VERSION.fetched) return CACHED_VERSION;

//     const version = await db.version();
//     if (!version) return APP_VERSION;

//     const changelog = version.web_changelog || version.changelog;
//     CACHED_VERSION = {
//       formatted: format(version.web),
//       numerical: version.web,
//       appUpdated:
//         version.web > app_version.numerical &&
//         APP_VERSION.numerical === version.web,
//       appUpdateable: version.web > APP_VERSION.numerical,
//       updateSeverity: version.severity,
//       changelog: !changelog ? undefined : changelog,
//       fetched: true,
//     };
//     if (CACHED_VERSION.appUpdated) {
//       config.set("app_version", CACHED_VERSION);
//     }
//     return CACHED_VERSION;
//   } catch (e) {
//     console.error(e);
//   }
//   return APP_VERSION;
// }
