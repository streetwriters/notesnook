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

import { SubscriptionPlan } from "@notesnook/core";
import { database as db } from "../database.js";

type CaptionValue = ("infinity" | (string & {})) | boolean | number;
type Limit<TCaption extends CaptionValue = CaptionValue> = {
  caption: TCaption;
  value: number | boolean;
  isAllowed: (value?: number) => Promise<boolean> | boolean;
};
type FeatureAvailability<TCaption extends CaptionValue = CaptionValue> = {
  free: Limit<TCaption>;
  essential: Limit<TCaption>;
  pro: Limit<TCaption>;
  believer: Limit<TCaption>;

  legacyPro: Limit<TCaption>;
};
export type Feature<TCaption extends CaptionValue = CaptionValue> = {
  id: string;
  title: string;
  error: (limit: Limit) => string;
  used?: () => Promise<number> | number;
  availability: FeatureAvailability<TCaption>;
};

export type FeatureResult<TId extends FeatureId = FeatureId> = {
  id: TId;
  isAllowed: boolean;
  availableOn?: SubscriptionPlan;
  caption: Caption<TId>;
  error: string;
};

type CaptionsFromAvailability<A> = A extends Record<
  string,
  { caption: infer C }
>
  ? C
  : never;

function createFeature<A extends FeatureAvailability>(
  feature: Omit<Feature, "error" | "availability"> & {
    error?: Feature["error"];
    availability: A;
  }
): Feature<CaptionsFromAvailability<A>> {
  return {
    ...feature,
    error:
      feature.error ??
      ((l) =>
        typeof l.caption === "number"
          ? `You have reached your limit of ${
              l.caption
            } ${feature.title.toLowerCase()}.`
          : `${feature.title} is not available on this plan.`)
  } as unknown as Feature<CaptionsFromAvailability<A>>;
}

function createLimit<
  TCaption extends Limit["caption"],
  TValue extends Limit["value"]
>(
  caption: TCaption,
  value?: TValue,
  isAllowed?: (value: TValue) => Limit["isAllowed"]
): Limit<TCaption> {
  const inferredValue =
    value ??
    (caption === "infinity"
      ? Infinity
      : typeof caption === "boolean"
      ? !!caption
      : typeof caption === "number"
      ? caption
      : false);
  return {
    caption,
    isAllowed: isAllowed
      ? isAllowed(inferredValue as TValue)
      : caption === "infinity"
      ? alwaysInfinite
      : inferredValue === false
      ? alwaysFalse
      : inferredValue === true
      ? alwaysTrue
      : typeof inferredValue === "number"
      ? lt(inferredValue)
      : alwaysFalse,
    value: inferredValue
  };
}

export type FeatureId = keyof typeof features;
type Features = typeof features;
type Caption<TId extends FeatureId> =
  Features[TId]["availability"][keyof FeatureAvailability]["caption"];

const features = {
  storage: createFeature({
    id: "storage",
    title: "Storage",
    used: async () => {
      const user = await db.user.getUser();
      return user?.storageUsed || 0;
    },
    availability: {
      free: createLimit("50MB/mo", 50 * 1024 * 1024),
      essential: createLimit("1GB/mo", 1024 * 1024 * 1024),
      pro: createLimit("10GB/mo", 10 * 1024 * 1024 * 1024),
      believer: createLimit("25GB/mo", 25 * 1024 * 1024 * 1024),
      legacyPro: createLimit("infinity", Infinity)
    }
  }),
  fileSize: createFeature({
    id: "fileSize",
    title: "Maximum file size",
    error: (limit) =>
      `You cannot upload files larger than ${limit.caption} on this plan.`,
    availability: {
      free: createLimit("10MB", 10 * 1024 * 1024),
      essential: createLimit("100MB", 100 * 1024 * 1024),
      pro: createLimit("1GB", 1024 * 1024 * 1024),
      believer: createLimit("5GB", 5 * 1024 * 1024 * 1024),
      legacyPro: createLimit("512MB", 512 * 1024 * 1024)
    }
  }),
  fullQualityImages: createFeature({
    id: "fullQualityImages",
    title: "Full quality images",
    availability: {
      free: createLimit(false),
      essential: createLimit(false),
      pro: createLimit(true),
      believer: createLimit(true),
      legacyPro: createLimit(true)
    }
  }),
  blockLinking: createFeature({
    id: "blockLinking",
    title: "Block-level note links",
    error: () => `Block-level note links are not available on this plan.`,
    availability: {
      free: createLimit(false),
      essential: createLimit(true),
      pro: createLimit(true),
      believer: createLimit(true),
      legacyPro: createLimit(true)
    }
  }),
  taskList: createFeature({
    id: "taskList",
    title: "Task list",
    availability: {
      free: createLimit(false),
      essential: createLimit(true),
      pro: createLimit(true),
      believer: createLimit(true),
      legacyPro: createLimit(true)
    }
  }),
  outlineList: createFeature({
    id: "outlineList",
    title: "Outline list",
    availability: {
      free: createLimit(false),
      essential: createLimit(true),
      pro: createLimit(true),
      believer: createLimit(true),
      legacyPro: createLimit(true)
    }
  }),
  callout: createFeature({
    id: "callout",
    title: "Callouts",
    availability: {
      free: createLimit(false),
      essential: createLimit(true),
      pro: createLimit(true),
      believer: createLimit(true),
      legacyPro: createLimit(true)
    }
  }),
  colors: createFeature({
    id: "colors",
    title: "Colors",
    used: () => db.colors.all.count(),
    availability: {
      free: createLimit(7),
      essential: createLimit(20),
      pro: createLimit("infinity"),
      believer: createLimit("infinity"),
      legacyPro: createLimit("infinity")
    }
  }),
  tags: createFeature({
    id: "tags",
    title: "Tags",
    used: () => db.tags.all.count(),
    availability: {
      free: createLimit(50),
      essential: createLimit(500),
      pro: createLimit("infinity"),
      believer: createLimit("infinity"),
      legacyPro: createLimit("infinity")
    }
  }),
  notebooks: createFeature({
    id: "notebooks",
    title: "Notebooks",
    used: () => db.notebooks.all.count(),
    availability: {
      free: createLimit(50),
      essential: createLimit(500),
      pro: createLimit("infinity"),
      believer: createLimit("infinity"),
      legacyPro: createLimit("infinity")
    }
  }),
  activeReminders: createFeature({
    id: "activeReminders",
    title: "Active reminders",
    used: () => db.reminders.active.count(),
    availability: {
      free: createLimit(10),
      essential: createLimit(50),
      pro: createLimit("infinity"),
      believer: createLimit("infinity"),
      legacyPro: createLimit("infinity")
    }
  }),
  shortcuts: createFeature({
    id: "shortcuts",
    title: "Shortcuts",
    used: () => db.shortcuts.all.length,
    availability: {
      free: createLimit(10),
      essential: createLimit("infinity"),
      pro: createLimit("infinity"),
      believer: createLimit("infinity"),
      legacyPro: createLimit("infinity")
    }
  }),
  defaultNotebookAndTag: createFeature({
    id: "defaultNotebookAndTag",
    title: "Default notebook & tag",
    error: () => `You cannot set a default notebook or tag on this plan.`,
    availability: {
      free: createLimit(false),
      essential: createLimit(false),
      pro: createLimit(true),
      believer: createLimit(true),
      legacyPro: createLimit(true)
    }
  }),
  recurringReminders: createFeature({
    id: "recurringReminders",
    title: "Recurring reminders",
    availability: {
      free: createLimit(false),
      essential: createLimit(true),
      pro: createLimit(true),
      believer: createLimit(true),
      legacyPro: createLimit(true)
    }
  }),
  pinNoteInNotification: createFeature({
    id: "pinNoteInNotification",
    title: "Pin note in notification",
    availability: {
      free: createLimit(false),
      essential: createLimit(false),
      pro: createLimit(true),
      believer: createLimit(true),
      legacyPro: createLimit(true)
    }
  }),
  createNoteFromNotificationDrawer: createFeature({
    id: "createNoteFromNotificationDrawer",
    title: "Create note from notification drawer",
    availability: {
      free: createLimit(false),
      essential: createLimit(false),
      pro: createLimit(true),
      believer: createLimit(true),
      legacyPro: createLimit(true)
    }
  }),
  defaultSidebarTab: createFeature({
    id: "defaultSidebarTab",
    title: "Default sidebar tab",
    availability: {
      free: createLimit(false),
      essential: createLimit(false),
      pro: createLimit(true),
      believer: createLimit(true),
      legacyPro: createLimit(true)
    }
  }),
  customHomepage: createFeature({
    id: "customHomepage",
    title: "Custom homepage",
    availability: {
      free: createLimit(false),
      essential: createLimit(false),
      pro: createLimit(true),
      believer: createLimit(true),
      legacyPro: createLimit(true)
    }
  }),
  markdownShortcuts: createFeature({
    id: "markdownShortcuts",
    title: "Markdown shortcuts",
    availability: {
      free: createLimit(false),
      essential: createLimit(true),
      pro: createLimit(true),
      believer: createLimit(true),
      legacyPro: createLimit(true)
    }
  }),
  fontLigatures: createFeature({
    id: "fontLigatures",
    title: "Font ligatures",
    availability: {
      free: createLimit(false),
      essential: createLimit(false),
      pro: createLimit(true),
      believer: createLimit(true),
      legacyPro: createLimit(true)
    }
  }),
  customToolbarPreset: createFeature({
    id: "customToolbarPreset",
    title: "Custom toolbar preset",
    availability: {
      free: createLimit(false),
      essential: createLimit(false),
      pro: createLimit(true),
      believer: createLimit(true),
      legacyPro: createLimit(true)
    }
  }),
  customizableSidebar: createFeature({
    id: "customizableSidebar",
    title: "Customizable sidebar",
    availability: {
      free: createLimit(false),
      essential: createLimit(true),
      pro: createLimit(true),
      believer: createLimit(true),
      legacyPro: createLimit(true)
    }
  }),
  disableTrashCleanup: createFeature({
    id: "disableTrashCleanup",
    title: "Disable trash cleanup",
    availability: {
      free: createLimit(false),
      essential: createLimit(false),
      pro: createLimit(true),
      believer: createLimit(true),
      legacyPro: createLimit(true)
    }
  }),
  appLock: createFeature({
    id: "appLock",
    title: "App lock",
    availability: {
      free: createLimit(false),
      essential: createLimit(false),
      pro: createLimit(true),
      believer: createLimit(true),
      legacyPro: createLimit(true)
    }
  }),
  maxNoteVersions: createFeature({
    id: "maxNoteVersions",
    title: "Maximum note versions",
    availability: {
      free: createLimit(100),
      essential: createLimit(1000),
      pro: createLimit("infinity"),
      believer: createLimit("infinity"),
      legacyPro: createLimit("infinity")
    }
  }),
  fullOfflineMode: createFeature({
    id: "fullOfflineMode",
    title: "Full offline mode",
    availability: {
      free: createLimit(false),
      essential: createLimit(true),
      pro: createLimit(true),
      believer: createLimit(true),
      legacyPro: createLimit(true)
    }
  }),
  syncControls: createFeature({
    id: "syncControls",
    title: "Sync controls",
    availability: {
      free: createLimit(false),
      essential: createLimit(false),
      pro: createLimit(true),
      believer: createLimit(true),
      legacyPro: createLimit(true)
    }
  }),
  monographLinksAndEmbeds: createFeature({
    id: "monographLinksAndEmbeds",
    title: "Links & embeds in monographs",
    availability: {
      free: createLimit(false),
      essential: createLimit(true),
      pro: createLimit(true),
      believer: createLimit(true),
      legacyPro: createLimit(true)
    }
  }),
  monographAnalytics: createFeature({
    id: "monographAnalytics",
    title: "Monographs analytics",
    availability: {
      free: createLimit(false),
      essential: createLimit(false),
      pro: createLimit(true),
      believer: createLimit(true),
      legacyPro: createLimit(true)
    }
  }),
  sms2FA: createFeature({
    id: "sms2FA",
    title: "2FA via SMS",
    availability: {
      free: createLimit(false),
      essential: createLimit(false),
      pro: createLimit(true),
      believer: createLimit(true),
      legacyPro: createLimit(true)
    }
  }),
  notesnookCircle: createFeature({
    id: "notesnookCircle",
    title: "Notesnook Circle",
    availability: {
      free: createLimit(false),
      essential: createLimit(true),
      pro: createLimit(true),
      believer: createLimit(true),
      legacyPro: createLimit(true)
    }
  })
};

export async function isFeatureAvailable<TId extends FeatureId>(
  id: TId,
  value?: number
): Promise<FeatureResult<TId>> {
  const feature = getFeature(id);
  const limit = await getFeatureLimit(feature);
  const isAllowed = await limit.isAllowed(value || (await feature.used?.()));

  return {
    id,
    isAllowed,
    availableOn: isAllowed ? undefined : await availableOn(id, value),
    caption: limit.caption,
    error: features[id].error(limit)
  };
}

export async function getFeatureLimit<TId extends FeatureId>(
  feature: Feature<TId>
) {
  const plan = await getUserPlan();
  return getFeatureLimitFromPlan(feature, plan);
}

export async function areFeaturesAvailable<TIds extends FeatureId[]>(
  ids: TIds,
  values: number[] = []
): Promise<{
  [K in TIds[number]]: FeatureResult<K>;
}> {
  const plan = await getUserPlan();
  const results = {} as {
    [K in TIds[number]]: FeatureResult<K>;
  };
  for (let i = 0; i < ids.length; ++i) {
    const value = values.at(i);
    const id = ids[i];

    const feature = getFeature(id);
    const limit = getFeatureLimitFromPlan(feature, plan);
    const isAllowed = await limit.isAllowed(value || (await feature.used?.()));

    results[id as TIds[number]] = {
      id: id as TIds[number],
      isAllowed,
      availableOn: isAllowed ? undefined : await availableOn(id, value),
      caption: limit.caption as Caption<TIds[number]>,
      error: features[id].error(limit)
    };
  }

  return results;
}

async function getUserPlan() {
  const user = await db.user.getUser();
  const plan = user?.subscription?.plan || SubscriptionPlan.FREE;
  return plan;
}

async function availableOn(id: FeatureId, value?: number) {
  const feature = features[id];
  for (const key in feature.availability) {
    if (key === "legacyPro") continue;

    if (
      await feature.availability[
        key as keyof typeof feature.availability
      ].isAllowed(value)
    )
      return AVAILABILITY_TO_PLAN[key as keyof typeof feature.availability];
  }
}

export function getFeature<TId extends FeatureId>(id: TId): Feature<TId> {
  return features[id] as unknown as Feature<TId>;
}

export function planToAvailability(plan: SubscriptionPlan) {
  return PLAN_TO_AVAILABILITY[plan];
}

export function getFeaturesTable() {
  // Feature  FREE  ESSENTIAL  PRO   BELIEVER
  const rows: [string, Limit, Limit, Limit, Limit][] = [];
  for (const key in features) {
    const feature = features[key as FeatureId];
    rows.push([
      feature.title,
      feature.availability.free,
      feature.availability.essential,
      feature.availability.pro,
      feature.availability.believer
    ]);
  }
  return rows;
}

export type FeatureUsage = {
  id: FeatureId;
  total: number;
  used: number;
};
export async function getFeaturesUsage(): Promise<FeatureUsage[]> {
  const plan = await getUserPlan();
  const usage: FeatureUsage[] = [];
  for (const key in features) {
    const feature = getFeature(key as FeatureId);
    const limit = getFeatureLimitFromPlan(feature, plan);
    if (!feature.used || typeof limit.value !== "number") continue;
    usage.push({
      id: key as FeatureId,
      total: limit.value,
      used: await feature.used()
    });
  }
  return usage;
}

function getFeatureLimitFromPlan<TId extends FeatureId>(
  feature: Feature<TId>,
  plan: SubscriptionPlan
): Limit<Caption<TId>> {
  const key = PLAN_TO_AVAILABILITY[plan];
  return feature.availability[key] as unknown as Limit<Caption<TId>>;
}

const PLAN_TO_AVAILABILITY: Record<
  SubscriptionPlan,
  keyof Feature["availability"]
> = {
  [SubscriptionPlan.FREE]: "free",
  [SubscriptionPlan.ESSENTIAL]: "essential",
  [SubscriptionPlan.PRO]: "pro",
  [SubscriptionPlan.BELIEVER]: "believer",
  [SubscriptionPlan.EDUCATION]: "pro",
  [SubscriptionPlan.LEGACY_PRO]: "legacyPro"
};

const AVAILABILITY_TO_PLAN: Record<
  keyof Feature["availability"],
  SubscriptionPlan | undefined
> = {
  free: SubscriptionPlan.FREE,
  essential: SubscriptionPlan.ESSENTIAL,
  pro: SubscriptionPlan.PRO,
  believer: SubscriptionPlan.BELIEVER,
  legacyPro: undefined
};

function lt(limit: number) {
  return async (value?: number) => {
    if (typeof value === "undefined") return false;
    return value < limit;
  };
}
function alwaysTrue() {
  return true;
}
function alwaysFalse() {
  return false;
}
function alwaysInfinite() {
  return true;
}
