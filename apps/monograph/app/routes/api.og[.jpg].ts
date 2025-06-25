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

import { LoaderFunctionArgs } from "@remix-run/node";
import { makeImage } from "../utils/generate-og-image.server";
import { formatDate } from "@notesnook/core";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const title = url.searchParams.get("title") || "Not found";
  const description = url.searchParams.get("description") || "";
  const date =
    url.searchParams.get("date") ||
    formatDate(new Date(), {
      type: "date-time",
      dateFormat: "YYYY-MM-DD",
      timeFormat: "24-hour"
    });

  return new Response(
    await makeImage(
      {
        date,
        description,
        title
      },
      url.search
    ),
    {
      status: 200,
      headers: {
        "Content-Type": "image/jpeg"
      }
    }
  );
}
