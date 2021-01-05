import { useEffect } from "react";
import { db } from "../common";
import { usePersistentState } from "./hooks";

const APP_VERSION = {
  formatted: format(1000),
  numerical: 1000,
  updateAvailable: false,
  changelog: undefined,
};
var versionChecked = false;
export default () => {
  const [version, setVersion] = usePersistentState("app_version", APP_VERSION);

  useEffect(() => {
    (async function () {
      setVersion(await getVersion(version));
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return version;
};

/**
 *
 * @param {number} version
 */
function format(version) {
  const parts = version.toString().split("");
  return `${parts[0]}.${parts[1]}.${parts[2]}${
    parts[3] !== "0" ? parts[3] : ""
  }`;
}

export async function getVersion(oldVersion) {
  const version = await db.version();
  if (!version || versionChecked) return oldVersion;
  versionChecked = true;
  return {
    formatted: format(version.web),
    numerical: version.web,
    appUpdated:
      version.web > oldVersion.numerical &&
      APP_VERSION.numerical === version.web,
    updateSeverity: version.severity,
    changelog: version.changelog === "" ? undefined : version.changelog,
  };
}
