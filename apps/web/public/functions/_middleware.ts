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

function isBeta(cookie: string) {
  console.log("Checking cookie:", cookie);
  const releaseTrack = cookie
    .split("; ")
    .find((row) => row.startsWith("release-track="))
    ?.split("=")[1];
  return releaseTrack === "beta";
}

interface Env {
  BETA_BASE_URL: string;
}

export const onRequest: PagesFunction<Env> = async ({ request, env, next }) => {
  try {
    const url = new URL(request.url);
    const response = await (async () => {
      if (isBeta(request.headers.get("Cookie") || "")) {
        const betaUrl = new URL(env.BETA_BASE_URL);
        betaUrl.pathname = url.pathname;
        betaUrl.search = url.search;
        console.log("Fetching asset from beta URL:", betaUrl.toString());
        const asset = await fetch(betaUrl);
        return new Response(asset.body, asset);
      } else {
        return await next();
      }
    })();
    return response;
  } catch (thrown) {
    console.error("Error occurred:", thrown);
    return new Response(thrown);
  }
};
