/*
This file is part of the Notesnook project (https://notesnook.com/)

Copyright (C) 2023 Streetwriters (Private) Limited

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

const FEATURE_CHECKS = {
  opfs: false,
  cache: false
};

async function isOPFSSupported() {
  const hasGetDirectory =
    "getDirectory" in window.navigator.storage &&
    typeof window.navigator.storage.getDirectory === "function";
  return (
    hasGetDirectory &&
    window.navigator.storage
      .getDirectory()
      .then(() => (FEATURE_CHECKS.opfs = true))
      .catch(() => (FEATURE_CHECKS.opfs = false))
  );
}

async function isCacheSupported() {
  const hasCacheStorage =
    "CacheStorage" in window &&
    "caches" in window &&
    window.caches instanceof CacheStorage;
  return (
    hasCacheStorage &&
    window.caches
      .has("something")
      .then((f) => (FEATURE_CHECKS.cache = true))
      .catch((a) => (FEATURE_CHECKS.cache = false))
  );
}

export async function initializeFeatureChecks() {
  await Promise.allSettled([isOPFSSupported(), isCacheSupported()]);
}

function isFeatureSupported(key: keyof typeof FEATURE_CHECKS) {
  return FEATURE_CHECKS[key];
}

export { isFeatureSupported };
