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
import { Orama, ProvidedTypes, create, search } from "@orama/orama";
import { ThemeDefinition } from "./notesnook-themes/types";

let db = null;
export async function getDB(renew?: boolean): Promise<Orama<ProvidedTypes>> {
  if (db && !renew) return db;
  return (db = await create({
    schema: {
      name: "string",
      author: "string",
      colorScheme: "string",
      compatibilityVersion: "string",
      description: "string",
      homepage: "string",
      id: "string",
      tags: "string[]",
      version: "string"
    },
    id: "notesnook-themes"
  }));
}

export async function getThemes(query = "", count, from) {
  const db = await getDB();
  const results = await search(db, {
    term: query
  });
  results.hits = [
    ...results.hits,
    ...results.hits,
    ...results.hits,
    ...results.hits,
    ...results.hits,
    ...results.hits,
    ...results.hits,
    ...results.hits,
    ...results.hits,
    ...results.hits,
    ...results.hits,
    ...results.hits,
    ...results.hits,
    ...results.hits,
    ...results.hits,
    ...results.hits,
    ...results.hits,
    ...results.hits,
    ...results.hits,
    ...results.hits,
    ...results.hits,
    ...results.hits,
    ...results.hits,
    ...results.hits,
    ...results.hits,
    ...results.hits,
    ...results.hits,
    ...results.hits,
    ...results.hits,
    ...results.hits,
    ...results.hits,
    ...results.hits,
    ...results.hits,
    ...results.hits,
    ...results.hits,
    ...results.hits,
    ...results.hits,
    ...results.hits,
    ...results.hits,
    ...results.hits,
    ...results.hits,
    ...results.hits,
    ...results.hits,
    ...results.hits,
    ...results.hits,
    ...results.hits,
    ...results.hits,
    ...results.hits,
    ...results.hits,
    ...results.hits,
    ...results.hits,
    ...results.hits,
    ...results.hits,
    ...results.hits,
    ...results.hits,
    ...results.hits
  ];
  const themes = results.hits
    .map((hit) => hit.document)
    .slice(from, from + count) as Omit<
    ThemeDefinition,
    "scopes" | "codeBlockCss"
  >[];

  return {
    themes,
    nextCursor: from + count < results.hits.length ? from + count : undefined
  };
}
