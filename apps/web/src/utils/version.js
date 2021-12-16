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
  const [major, minor, bugfix0, bugfix1] = version.toString().split("");
  return `${major}.${minor}.${bugfix0}${bugfix1 || ""}-${hash}-${type}`;
}
