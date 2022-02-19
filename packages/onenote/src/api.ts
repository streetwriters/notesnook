import "isomorphic-fetch"; // or import the fetch polyfill you installed
import {
  OnenoteNotebook,
  GraphAPIResponse,
  OnenoteSection,
  OnenoteSectionGroup,
  OnenotePage,
  OnenoteResource,
} from "./types";
import { Client, GraphError } from "@microsoft/microsoft-graph-client";

const token = `EwBoA8l6BAAUwihrrCrmQ4wuIJX5mbj7rQla6TUAARll4kg9eV/QH+DwI1/+z2MVG93Pq2KZSdA8E5ui19TId6g1rGjQbb439wCWaIOCtKU60WbFNRWfSwkjGiMmCkmOE1AGe1Kz/TBvWilsIOUXNalOJOEHBI38KrcYLOQU7jNs0Zwtd/Ikz2jqZBny1yyYbjwR+m9Az+ntVi02/L4bpLnf2aCoRL1DEum3e4+ON/V1edCA4jHzYs1jGU7vFceKKIccwnkp+I8tJZzGeaxyRl3R3raL2jc4SN56UBjbRR7TWTLImpRXrW3I+qjfuLi/HVUtdBBiP+bS2d1Jz7KgCoHaDZTsOS2aYBmjv8hPqP9QOgbWfq3WJQnQkLabwlgDZgAACBshWhx2XBDxOAISW96Za0H+cH2w/qmQ1rWeX1ohyyTdBaR2N2TR2GzHhGUAkzABC+uzCo0KPA5ZSbt6QrlAcnioeKjuPW6dYhRPgg4DLJ52xmeC4UW6R9mMZ84HL70p1+UBz/YM9LOkU/6tcde85S6O76bEvLDI574ArJoI6XqmqkvKMnzcmDOd9DCPaOoQdbCm6K59E/d5unQBbopi6L1ZZhYEGOyx1I6fv7k33UJ4Uqahp5pm7GHltIW/lGmF0tYyuqdt0eovlaYbcgosJdIma1ILGli+CCoyvUm1JVZT24Yf1XMNLVhe1O0WrawDSLIY0A3rXQY0CW9DGWXNBtaS1CdFQc2KdhkylWfEAwftiZteOkiB+MvCJIO6XOLo2CGpR7YPB5+jxcrVjynJ8JC3AfqbDzIvQiuKW/So4Gd/fmJifNIieSySfZY0U0K9TWZf6wXKlI99a0A9seOZTMrQRTGlOiC2SeEED5Arw8lHsmVYWI+XTMKkkmhVn/rETTsfhNxz7DyjKp793gniq0IL1GvRnW8Hy2IgkAEtzrbmhNH0GJS6VW0pl1YvTlQxnCGRWpkJ5DOjgOqNmZYKLmS2FfxLmbyME4+CmqPHGrSX412jx7gRcSiftayek5NKX5AXTBUEaFzkXIY7T9oq8+GgAOTrJKUumCQxDc7eZyAvlhKrdA2emmwi6ukAdr4Tl2r4idyTm1IIT/Hw6kBuSPEgTVKvAJHopIvDf54Baqan5BVxVFW19GQR5zxZxCkCO7tYdQI=`;
const msGraphClient = Client.init({
  authProvider: async (done) => {
    done(null, token);
    // return;
    // if ("window" in global) {
    //   const { authenticate } = await import("./auth/browser");
    //   const result = await authenticate();
    //   if (result) done(null, result.accessToken);
    //   else done("Could not get access token", null);
    // } else {
    //   const { authenticate } = await import("./auth/node");
    //   const result = await authenticate();
    //   console.log(result?.accessToken);
    //   if (result) done(null, result.accessToken);
    //   else done("Could not get access token", null);
    // }
  },
  defaultVersion: "beta",
});

const defaultProperties = [
  "createdDateTime",
  "displayName",
  "lastModifiedDateTime",
  "id",
] as const;

export async function getNotebooks(): Promise<OnenoteNotebook[]> {
  let notebooks: OnenoteNotebook[] = await getAll(
    `/me/onenote/notebooks`,
    defaultProperties
  );
  for (let notebook of notebooks) {
    if (!notebook.id) continue;
    notebook.sections = await getSections("notebooks", notebook.id);
    notebook.sectionGroups = await getSectionGroups(
      "sectionGroups",
      notebook.id
    );
  }
  return notebooks;
}

async function getSections(
  type: "notebooks" | "sectionGroups",
  parentId: string
): Promise<OnenoteSection[]> {
  let sections: OnenoteSection[] = await getAll(
    `/me/onenote/${type}/${parentId}/sections`,
    defaultProperties
  );
  for (let section of sections) {
    if (!section.id) continue;
    section.pages = await getPages(section.id);
  }
  return sections;
}

async function getSectionGroups(
  type: "notebooks" | "sectionGroups",
  parentId: string
): Promise<OnenoteSectionGroup[]> {
  let sectionGroups: OnenoteSectionGroup[] = await getAll(
    `/me/onenote/${type}/${parentId}/sectionGroups`,
    defaultProperties
  );
  for (let sectionGroup of sectionGroups) {
    if (!sectionGroup.id) continue;
    sectionGroup.sections = await getSections("sectionGroups", sectionGroup.id);
    sectionGroup.sectionGroups = await getSectionGroups(
      "sectionGroups",
      sectionGroup.id
    );
  }
  return sectionGroups;
}

export async function getPages(sectionId: string): Promise<OnenotePage[]> {
  let pages: OnenotePage[] = await getAll(
    `/me/onenote/sections/${sectionId}/pages`,
    [
      "id",
      "title",
      "createdDateTime",
      "lastModifiedDateTime",
      "level",
      "order",
      "userTags",
    ]
  );
  for (let page of pages) {
    if (!page.id) continue;
    console.log("getting page content for", page.id, page.contentUrl);
    page.content = await getPageContent(page.id);
  }
  return pages;
}

export async function getPageContent(pageId: string): Promise<string | null> {
  try {
    const stream = <NodeJS.ReadableStream | null>(
      await msGraphClient.api(`/me/onenote/pages/${pageId}/content`).getStream()
    );
    if (!stream) return null;

    return (await convertStream(stream)).toString("utf8");
  } catch (e) {
    if (e instanceof GraphError)
      console.error(
        "A graph error occured while getting content of page:",
        pageId,
        "Error code:",
        e.code
      );
    else if (e instanceof Error)
      console.error(
        "An error occured while getting content of page",
        pageId,
        "Error message:",
        e.message
      );

    return null;
  }
}

export async function resolveDataUrl(url: string): Promise<Buffer | null> {
  try {
    const stream = <NodeJS.ReadableStream | null>(
      await msGraphClient.api(url).getStream()
    );
    if (!stream) return null;

    return await convertStream(stream);
  } catch (e) {
    if (e instanceof Error)
      console.error(
        "An error occured while resolving data url.",
        "Error message:",
        e.message
      );

    return null;
  }
}

function convertStream(stream: NodeJS.ReadableStream): Promise<Buffer> {
  const chunks: Buffer[] = [];
  return new Promise((resolve, reject) => {
    stream.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    stream.on("error", (err) => reject(err));
    stream.on("end", () => resolve(Buffer.concat(chunks)));
  });
}

async function getAll<T, TKeys extends keyof T>(
  url: string,
  properties: readonly TKeys[]
): Promise<T[]> {
  let items: T[] = [];

  let response: GraphAPIResponse<T[]> | undefined = undefined;
  let skip = 0;
  let limit = 100;
  while (!response || !!response["@odata.nextLink"]) {
    response = <GraphAPIResponse<T[]>>await msGraphClient
      .api(url)
      .top(limit)
      .skip(skip)
      .select(<string[]>(<unknown>properties))
      .get()
      .catch((e) => {
        console.error(e.message, url);
        return undefined;
      });

    if (!response || !response.value) break;
    items.push(...response.value);
    skip += limit;

    console.log("Fetched", url, "total:", items.length);
  }

  return items;
}
