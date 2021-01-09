import { useState } from "react";
import { useEffect } from "react";
import { db } from "../common";

var APP_VERSION = {
  formatted: format(1110),
  numerical: 1110,
  appUpdated: false,
  appUpdateable: false,
  changelog: undefined,
  fetched: false,
};

var CACHED_VERSION = undefined;

export default () => {
  const [version, setVersion] = useState(APP_VERSION);

  useEffect(() => {
    (async function () {
      const version = await getVersion();
      setVersion(version);
    })();
  }, [setVersion]);

  return version;
};

/**
 *
 * @param {number} version
 */
function format(version) {
  const parts = version.toString().split("");
  return `${parts[0]}.${parts[1]}.${parts[2]}${
    parts[3] && parts[3] !== "0" ? parts[3] : ""
  }`;
}

export function getAppVersion() {
  return APP_VERSION;
}

export async function getVersion() {
  try {
    if (APP_VERSION.fetched) return CACHED_VERSION;

    const version = await db.version();
    if (!version) return APP_VERSION;

    const changelog = version.web_changelog || version.changelog;
    CACHED_VERSION = {
      formatted: format(version.web),
      numerical: version.web,
      appUpdated:
        version.web > APP_VERSION.numerical &&
        APP_VERSION.numerical === version.web,
      appUpdateable: version.web > APP_VERSION.numerical,
      updateSeverity: version.severity,
      changelog: !changelog ? undefined : changelog,
      fetched: true,
    };
    return CACHED_VERSION;
  } catch (e) {
    console.error(e);
  }
  return APP_VERSION;
}
