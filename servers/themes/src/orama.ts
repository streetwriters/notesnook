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
import { Orama, SearchParams, create, search } from "@orama/orama";
import { CompiledThemeDefinition, ThemeMetadata } from "./sync";
import { ThemeQuerySchema } from "./schemas";

export let ThemesDatabase: Orama | null = null;
export async function initializeDatabase(): Promise<Orama> {
  ThemesDatabase = await create({
    schema: {
      id: "string",
      name: "string",
      authors: { name: "string", email: "string", url: "string" },
      colorScheme: "string",
      compatibilityVersion: "number",
      description: "string",
      tags: "string[]"
    },
    id: "notesnook-themes"
  });
  return ThemesDatabase;
}

export async function findTheme(
  id: string,
  compatibilityVersion: number
): Promise<CompiledThemeDefinition | undefined> {
  if (!ThemesDatabase) await initializeDatabase();

  const results = await search(ThemesDatabase!, {
    term: "",
    where: {
      id,
      compatibilityVersion: { eq: compatibilityVersion }
    }
  });
  console.log("EHLO");
  return results.hits[0].document as CompiledThemeDefinition;
}

export async function getThemes(query: (typeof ThemeQuerySchema)["_type"]) {
  if (!ThemesDatabase) await initializeDatabase();

  const from = query.cursor;
  const count = query.limit;

  const searchParams: SearchParams = {
    where: {
      compatibilityVersion: {
        eq: query.compatibilityVersion
      }
    }
  };
  for (const filter of query.filters || []) {
    switch (filter.type) {
      case "term":
        searchParams.term = filter.value;
        searchParams.properties = [
          "name",
          "authors.name",
          "description",
          "tags",
          "id"
        ];
        break;
      case "colorScheme":
        searchParams.where = {
          ...searchParams.where,
          colorScheme: filter.value
        };
        break;
    }
  }
  const results = await search(ThemesDatabase!, searchParams);
  // results.hits = [
  //   ...results.hits,
  //   ...results.hits,
  //   ...results.hits,
  //   ...results.hits,
  //   ...results.hits,
  //   ...results.hits,
  //   ...results.hits,
  //   ...results.hits,
  //   ...results.hits,
  //   ...results.hits,
  //   ...results.hits,
  //   ...results.hits,
  //   ...results.hits,
  //   ...results.hits,
  //   ...results.hits,
  //   ...results.hits,
  //   ...results.hits,
  //   ...results.hits,
  //   ...results.hits,
  //   ...results.hits,
  //   ...results.hits,
  //   ...results.hits,
  //   ...results.hits,
  //   ...results.hits,
  //   ...results.hits,
  //   ...results.hits,
  //   ...results.hits,
  //   ...results.hits,
  //   ...results.hits,
  //   ...results.hits,
  //   ...results.hits,
  //   ...results.hits,
  //   ...results.hits,
  //   ...results.hits,
  //   ...results.hits,
  //   ...results.hits,
  //   ...results.hits,
  //   ...results.hits,
  //   ...results.hits,
  //   ...results.hits,
  //   ...results.hits,
  //   ...results.hits,
  //   ...results.hits,
  //   ...results.hits,
  //   ...results.hits,
  //   ...results.hits,
  //   ...results.hits,
  //   ...results.hits,
  //   ...results.hits,
  //   ...results.hits,
  //   ...results.hits,
  //   ...results.hits,
  //   ...results.hits,
  //   ...results.hits,
  //   ...results.hits,
  //   ...results.hits
  // ];

  const themes = results.hits
    .map((hit) => {
      return {
        ...(hit.document as CompiledThemeDefinition),
        scope: undefined,
        codeBlockCSS: undefined
      } as ThemeMetadata;
    })
    .slice(from, from + count);

  return {
    themes,
    nextCursor: (from + count < results.hits.length
      ? from + count
      : undefined) as number | undefined
  };
}
