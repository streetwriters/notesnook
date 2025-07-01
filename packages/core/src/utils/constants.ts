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

import { extractHostname } from "./hostname.js";

const COMPATIBLE_SERVER_VERSION = 1;

export function isServerCompatible(version: number) {
  return COMPATIBLE_SERVER_VERSION === version;
}

function isProduction() {
  return false;
  return (
    process.env.NODE_ENV === "production" || process.env.NODE_ENV === "test"
  );
}

export const hosts = {
  API_HOST: isProduction()
    ? "https://api.notesnook.com"
    : "http://localhost:5264",
  AUTH_HOST: isProduction()
    ? "https://auth.streetwriters.co"
    : "http://localhost:8264",
  SSE_HOST: isProduction()
    ? "https://events.streetwriters.co"
    : "http://localhost:7264",
  SUBSCRIPTIONS_HOST: isProduction()
    ? "https://subscriptions.streetwriters.co"
    : "http://localhost:9264",
  ISSUES_HOST: isProduction()
    ? "https://issues.streetwriters.co"
    : "http://localhost:2624",
  MONOGRAPH_HOST: isProduction() ? "https://monogr.ph" : "http://localhost:6264"
};

export default hosts;

const HOSTNAMES = {
  [extractHostname(hosts.API_HOST)]: "Notesnook Sync Server",
  [extractHostname(hosts.AUTH_HOST)]: "Authentication Server",
  [extractHostname(hosts.SSE_HOST)]: "Eventing Server",
  [extractHostname(hosts.SUBSCRIPTIONS_HOST)]:
    "Subscriptions Management Server",
  [extractHostname(hosts.ISSUES_HOST)]: "Bug Reporting Server",
  [extractHostname(hosts.MONOGRAPH_HOST)]: "Monograph Server"
};

export const getServerNameFromHost = (host: string) => {
  return HOSTNAMES[host];
};
