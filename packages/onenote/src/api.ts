import "isomorphic-fetch"; // or import the fetch polyfill you installed
import {
  Entity,
  OnenotePage,
  Notebook as OnenoteNotebook,
  OnenoteSection,
  SectionGroup as OnenoteSectionGroup,
} from "@microsoft/microsoft-graph-types-beta";

import { GraphAPIResponse } from "./types";
import { Client } from "@microsoft/microsoft-graph-client";
import { Content } from "./content";

const msGraphClient = Client.init({
  authProvider: async (done) => {
    if ("window" in global) {
      const { authenticate } = await import("./auth/browser");
      const result = await authenticate();
      if (result) done(null, result.accessToken);
      else done("Could not get access token", null);
    } else {
      const { authenticate } = await import("./auth/node");
      const result = await authenticate();
      if (result) done(null, result.accessToken);
      else done("Could not get access token", null);
    }
  },
});

const defaultProperties = [
  "createdDateTime",
  "displayName",
  "lastModifiedDateTime",
  "id",
] as const;

type ItemType = "notebook" | "sectionGroup" | "section" | "page";
type Op = "fetch" | "process";
type ProgressPayload = {
  type: ItemType;
  op: Op;
  total: number;
  current: number;
};

interface IProgressReporter {
  report: (payload: ProgressPayload) => void;
}

export async function getNotebooks(
  reporter?: IProgressReporter
): Promise<OnenoteNotebook[]> {
  let notebooks: OnenoteNotebook[] = await getAll(
    `/me/onenote/notebooks`,
    defaultProperties,
    "notebook",
    reporter
  );

  return await processAll(
    notebooks,
    async (notebook: OnenoteNotebook) => {
      if (!notebook.id) return;

      notebook.sections = await getSections("notebooks", notebook.id, reporter);
      notebook.sectionGroups = await getSectionGroups(
        "sectionGroups",
        notebook.id,
        reporter
      );
    },
    "notebook",
    reporter
  );
}

async function getSections(
  parentType: "notebooks" | "sectionGroups",
  parentId: string,
  reporter?: IProgressReporter
): Promise<OnenoteSection[]> {
  let sections: OnenoteSection[] = await getAll(
    `/me/onenote/${parentType}/${parentId}/sections`,
    defaultProperties,
    "section",
    reporter
  );

  return await processAll(
    sections,
    async (section) => {
      if (!section.id) return;
      section.pages = await getPages(section.id, reporter);
    },
    "section",
    reporter
  );
}

async function getSectionGroups(
  parentType: "notebooks" | "sectionGroups",
  parentId: string,
  reporter?: IProgressReporter
): Promise<OnenoteSectionGroup[]> {
  let sectionGroups: OnenoteSectionGroup[] = await getAll(
    `/me/onenote/${parentType}/${parentId}/sectionGroups`,
    defaultProperties,
    "sectionGroup",
    reporter
  );

  return await processAll(
    sectionGroups,
    async (sectionGroup) => {
      if (!sectionGroup.id) return;

      sectionGroup.sections = await getSections(
        "sectionGroups",
        sectionGroup.id,
        reporter
      );
      sectionGroup.sectionGroups = await getSectionGroups(
        "sectionGroups",
        sectionGroup.id,
        reporter
      );
    },
    "sectionGroup",
    reporter
  );
}

export async function getPages(
  sectionId: string,
  reporter?: IProgressReporter
): Promise<OnenotePage[]> {
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
    ],
    "page",
    reporter
  );

  return await processAll(
    pages,
    async (page) => {
      if (!page.id) return;
      page.content = await getPageContent(page.id);
    },
    "page",
    reporter
  );
}

export async function getPageContent(pageId: string): Promise<Content | null> {
  try {
    const stream = <NodeJS.ReadableStream | null>(
      await msGraphClient.api(`/me/onenote/pages/${pageId}/content`).getStream()
    );
    if (!stream) return null;

    const html = (await convertStream(stream)).toString("utf8");
    return new Content(html, { attachmentResolver: resolveDataUrl });
  } catch (e) {
    console.error(
      "An error occured while getting page content.",
      "Error message:",
      (<Error>e).message
    );
  }
  return null;
}

export async function resolveDataUrl(url: string): Promise<Buffer | null> {
  try {
    const stream = <NodeJS.ReadableStream | null>(
      await msGraphClient.api(url).getStream()
    );
    if (!stream) return null;

    return await convertStream(stream);
  } catch (e) {
    console.error(
      "An error occured while resolving data url.",
      "Error message:",
      (<Error>e).message
    );
  }
  return null;
}

function convertStream(stream: NodeJS.ReadableStream): Promise<Buffer> {
  const chunks: Buffer[] = [];
  return new Promise((resolve, reject) => {
    stream.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    stream.on("error", (err) => reject(err));
    stream.on("end", () => resolve(Buffer.concat(chunks)));
  });
}

async function processAll<T extends Entity>(
  items: T[],
  process: (item: T) => Promise<void>,
  type: ItemType,
  reporter?: IProgressReporter
): Promise<T[]> {
  for (let i = 0; i < items.length; ++i) {
    reporter?.report({
      op: "process",
      type,
      total: items.length,
      current: i + 1,
    });
    const item = items[i];
    await process(item);
  }
  return items;
}

async function getAll<T, TKeys extends keyof T>(
  url: string,
  properties: readonly TKeys[],
  type: ItemType,
  reporter?: IProgressReporter
): Promise<T[]> {
  let items: T[] = [];

  let response: GraphAPIResponse<T[]> | undefined = undefined;
  let skip = 0;
  let limit = 100;
  while (!response || !!response["@odata.nextLink"]) {
    reporter?.report({
      op: "fetch",
      type,
      total: skip + limit,
      current: skip,
    });

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
  }

  reporter?.report({
    op: "fetch",
    type,
    total: items.length,
    current: items.length,
  });
  return items;
}
