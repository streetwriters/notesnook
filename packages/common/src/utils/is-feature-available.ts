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

import { database as db } from "../database";
import { SubscriptionPlan, SubscriptionType } from "@notesnook/core";

type Limit<
  TCaption extends string | boolean | number = string | boolean | number
> = {
  caption: TCaption;
  isAllowed: (value?: number) => Promise<boolean> | boolean;
};
export type Feature = {
  id: string;
  title: string;
  error: (limit: Limit) => string;
  availability: {
    free: Limit;
    essential: Limit;
    pro: Limit;
    believer: Limit;

    legacyPro: Limit;
  };
};

export type FeatureResult<TId extends FeatureId = FeatureId> = {
  isAllowed: boolean;
  availableOn?: SubscriptionPlan;
  caption: Caption<TId>;
  error: string;
};

function createFeature<T extends Feature>(
  feature: Omit<T, "error"> & { error?: Feature["error"] }
): T {
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
  } as unknown as T;
}

function createLimit<TCaption extends Limit["caption"]>(
  caption: TCaption,
  isAllowed: Limit["isAllowed"]
): Limit<TCaption> {
  return {
    caption,
    isAllowed
  };
}

export type FeatureId = keyof typeof features;
type Features = typeof features;
type Caption<TId extends FeatureId> =
  Features[TId]["availability"][keyof Feature["availability"]]["caption"];

const features = {
  fileSize: createFeature({
    id: "fileSize",
    title: "File size",
    error: (limit) =>
      `You cannot upload files larger than ${limit.caption} on this plan.`,
    availability: {
      free: createLimit("10MB", lte(10 * 1024 * 1024)),
      essential: createLimit("100MB", lte(100 * 1024 * 1024)),
      pro: createLimit("1GB", lte(1024 * 1024 * 1024)),
      believer: createLimit("5GB", lte(5 * 1024 * 1024 * 1024)),
      legacyPro: createLimit("Unlimited", alwaysInfinite)
    }
  }),
  fullQualityImages: createFeature({
    id: "fullQualityImages",
    title: "Full quality images",
    availability: {
      free: createLimit(false, alwaysFalse),
      essential: createLimit(false, alwaysFalse),
      pro: createLimit(true, alwaysTrue),
      believer: createLimit(true, alwaysTrue),
      legacyPro: createLimit(true, alwaysTrue)
    }
  }),
  // checkList: createFeature({
  //   id: "checkList",
  //   title: "Check list",
  //   availability: {
  //     free: createLimit(true, alwaysTrue),
  //     essential: createLimit(true, alwaysTrue),
  //     pro: createLimit(true, alwaysTrue),
  //     believer: createLimit(true, alwaysTrue),
  //     legacyPro: createLimit(true, alwaysTrue)
  //   }
  // }),

  noteLink: createFeature({
    id: "blockLinking",
    title: "Block-level note links",
    availability: {
      free: createLimit(false, alwaysFalse),
      essential: createLimit(true, alwaysTrue),
      pro: createLimit(true, alwaysTrue),
      believer: createLimit(true, alwaysTrue),
      legacyPro: createLimit(true, alwaysTrue)
    }
  }),
  taskList: createFeature({
    id: "taskList",
    title: "Task list",
    availability: {
      free: createLimit(false, alwaysFalse),
      essential: createLimit(true, alwaysTrue),
      pro: createLimit(true, alwaysTrue),
      believer: createLimit(true, alwaysTrue),
      legacyPro: createLimit(true, alwaysTrue)
    }
  }),
  outlineList: createFeature({
    id: "outlineList",
    title: "Outline list",
    availability: {
      free: createLimit(false, alwaysFalse),
      essential: createLimit(true, alwaysTrue),
      pro: createLimit(true, alwaysTrue),
      believer: createLimit(true, alwaysTrue),
      legacyPro: createLimit(true, alwaysTrue)
    }
  }),
  callout: createFeature({
    id: "callout",
    title: "Callouts",
    availability: {
      free: createLimit(false, alwaysFalse),
      essential: createLimit(true, alwaysTrue),
      pro: createLimit(true, alwaysTrue),
      believer: createLimit(true, alwaysTrue),
      legacyPro: createLimit(true, alwaysTrue)
    }
  }),
  colors: createFeature({
    id: "colors",
    title: "Colors",
    availability: {
      free: createLimit(
        7,
        lt(7, () => db.colors.all.count())
      ),
      essential: createLimit(
        20,
        lt(20, () => db.colors.all.count())
      ),
      pro: createLimit("∞", alwaysInfinite),
      believer: createLimit("∞", alwaysInfinite),
      legacyPro: createLimit("∞", alwaysInfinite)
    }
  }),
  tags: createFeature({
    id: "tags",
    title: "Tags",
    availability: {
      free: createLimit(
        50,
        lt(50, () => db.tags.all.count())
      ),
      essential: createLimit(
        500,
        lt(500, () => db.tags.all.count())
      ),
      pro: createLimit("∞", alwaysInfinite),
      believer: createLimit("∞", alwaysInfinite),
      legacyPro: createLimit("∞", alwaysInfinite)
    }
  }),
  notebooks: createFeature({
    id: "notebooks",
    title: "Notebooks",
    availability: {
      free: createLimit(
        50,
        lt(50, () => db.notebooks.all.count())
      ),
      essential: createLimit(
        500,
        lt(500, () => db.notebooks.all.count())
      ),
      pro: createLimit("∞", alwaysInfinite),
      believer: createLimit("∞", alwaysInfinite),
      legacyPro: createLimit("∞", alwaysInfinite)
    }
  }),
  activeReminders: createFeature({
    id: "activeReminders",
    title: "Active reminders",
    availability: {
      free: createLimit(
        10,
        lt(10, () => db.reminders.active.count())
      ),
      essential: createLimit(
        50,
        lt(50, () => db.reminders.active.count())
      ),
      pro: createLimit("∞", alwaysInfinite),
      believer: createLimit("∞", alwaysInfinite),
      legacyPro: createLimit("∞", alwaysInfinite)
    }
  }),
  shortcuts: createFeature({
    id: "shortcuts",
    title: "Shortcuts",
    availability: {
      free: createLimit(
        10,
        lt(10, () => db.shortcuts.all.length)
      ),
      essential: createLimit("∞", alwaysInfinite),
      pro: createLimit("∞", alwaysInfinite),
      believer: createLimit("∞", alwaysInfinite),
      legacyPro: createLimit("∞", alwaysInfinite)
    }
  }),
  // noteHistory: createFeature({
  //   id: "noteHistory",
  //   title: "Note history",
  //   availability: {
  //     free: createLimit("Local", alwaysTrue),
  //     essential: createLimit("Local", alwaysTrue),
  //     pro: createLimit("Synced", alwaysTrue),
  //     believer: createLimit("Synced", alwaysTrue),
  //     legacyPro: createLimit("Synced", alwaysTrue)
  //   }
  // }),
  defaultNotebookAndTag: createFeature({
    id: "defaultNotebookAndTag",
    title: "Default notebook & tag",
    error: () => `You cannot set a default notebook or tag on this plan.`,
    availability: {
      free: createLimit(false, alwaysFalse),
      essential: createLimit(false, alwaysFalse),
      pro: createLimit(true, alwaysTrue),
      believer: createLimit(true, alwaysTrue),
      legacyPro: createLimit(true, alwaysTrue)
    }
  }),
  // securityKeyAppLock: createFeature({
  //   id: "securityKeyAppLock",
  //   title: "Security key app lock",
  //   availability: {
  //     free: createLimit(false, alwaysFalse),
  //     essential: createLimit(false, alwaysFalse),
  //     pro: createLimit(true, alwaysTrue),
  //     believer: createLimit(true, alwaysTrue),
  //     legacyPro: createLimit(true, alwaysTrue)
  //   }
  // }),
  recurringReminders: createFeature({
    id: "recurringReminders",
    title: "Recurring reminders",
    availability: {
      free: createLimit(false, alwaysFalse),
      essential: createLimit(false, alwaysTrue),
      pro: createLimit(true, alwaysTrue),
      believer: createLimit(true, alwaysTrue),
      legacyPro: createLimit(true, alwaysTrue)
    }
  }),
  pinNoteInNotification: createFeature({
    id: "pinNoteInNotification",
    title: "Pin note in notification",
    availability: {
      free: createLimit(false, alwaysFalse),
      essential: createLimit(false, alwaysFalse),
      pro: createLimit(true, alwaysTrue),
      believer: createLimit(true, alwaysTrue),
      legacyPro: createLimit(true, alwaysTrue)
    }
  }),
  createNoteFromNotificationDrawer: createFeature({
    id: "createNoteFromNotificationDrawer",
    title: "Create note from notification drawer",
    availability: {
      free: createLimit(false, alwaysFalse),
      essential: createLimit(false, alwaysFalse),
      pro: createLimit(true, alwaysTrue),
      believer: createLimit(true, alwaysTrue),
      legacyPro: createLimit(true, alwaysTrue)
    }
  }),
  defaultSidebarTab: createFeature({
    id: "defaultSidebarTab",
    title: "Default sidebar tab",
    availability: {
      free: createLimit(false, alwaysFalse),
      essential: createLimit(false, alwaysFalse),
      pro: createLimit(true, alwaysTrue),
      believer: createLimit(true, alwaysTrue),
      legacyPro: createLimit(true, alwaysTrue)
    }
  }),
  markdownShortcuts: createFeature({
    id: "markdownShortcuts",
    title: "Markdown shortcuts",
    availability: {
      free: createLimit(false, alwaysFalse),
      essential: createLimit(true, alwaysTrue),
      pro: createLimit(true, alwaysTrue),
      believer: createLimit(true, alwaysTrue),
      legacyPro: createLimit(true, alwaysTrue)
    }
  }),
  fontLigatures: createFeature({
    id: "fontLigatures",
    title: "Font ligatures",
    availability: {
      free: createLimit(false, alwaysFalse),
      essential: createLimit(false, alwaysFalse),
      pro: createLimit(true, alwaysTrue),
      believer: createLimit(true, alwaysTrue),
      legacyPro: createLimit(true, alwaysTrue)
    }
  }),
  customToolbarPreset: createFeature({
    id: "customToolbarPreset",
    title: "Custom toolbar preset",
    availability: {
      free: createLimit(false, alwaysFalse),
      essential: createLimit(false, alwaysFalse),
      pro: createLimit(true, alwaysTrue),
      believer: createLimit(true, alwaysTrue),
      legacyPro: createLimit(true, alwaysTrue)
    }
  }),
  customizableSidebar: createFeature({
    id: "customizableSidebar",
    title: "Customizable sidebar",
    availability: {
      free: createLimit(false, alwaysFalse),
      essential: createLimit(true, alwaysTrue),
      pro: createLimit(true, alwaysTrue),
      believer: createLimit(true, alwaysTrue),
      legacyPro: createLimit(true, alwaysTrue)
    }
  }),
  disableTrashCleanup: createFeature({
    id: "disableTrashCleanup",
    title: "Disable trash cleanup",
    availability: {
      free: createLimit(false, alwaysFalse),
      essential: createLimit(false, alwaysFalse),
      pro: createLimit(true, alwaysTrue),
      believer: createLimit(true, alwaysTrue),
      legacyPro: createLimit(true, alwaysTrue)
    }
  })
  // filesInMonograph: createFeature({
  //   id: "filesInMonograph",
  //   title: "Files in monograph",
  //   availability: {
  //     free: createLimit("Images", alwaysTrue),
  //     essential: createLimit("Images & files", alwaysTrue),
  //     pro: createLimit("Images & files", alwaysTrue),
  //     believer: createLimit("Images & files", alwaysTrue),
  //     legacyPro: createLimit("Images & files", alwaysTrue)
  //   }
  // }),
  // noteHistoryRetention: createFeature({
  //   id: "noteHistoryRetention",
  //   title: "Note history retention",
  //   availability: {
  //     free: createLimit("1 month", alwaysTrue),
  //     essential: createLimit("∞", alwaysInfinite),
  //     pro: createLimit("∞", alwaysInfinite),
  //     believer: createLimit("∞", alwaysInfinite),
  //     legacyPro: createLimit("∞", alwaysInfinite)
  //   }
  // }),
  // appLock: createFeature({
  //   id: "appLockDelay",
  //   title: "App lock delay",
  //   availability: {
  //     free: createLimit("immediate", alwaysTrue),
  //     essential: createLimit("immediate", alwaysTrue),
  //     pro: createLimit("any", alwaysTrue),
  //     believer: createLimit("any", alwaysTrue),
  //     legacyPro: createLimit("any", alwaysTrue)
  //   }
  // }),
  // passwordOnMonograph: createFeature({
  //   id: "passwordOnMonograph",
  //   title: "Password on monograph",
  //   availability: {
  //     free: createLimit("Default", alwaysTrue),
  //     essential: createLimit("Custom", alwaysTrue),
  //     pro: createLimit("Custom", alwaysTrue),
  //     believer: createLimit("Custom", alwaysTrue),
  //     legacyPro: createLimit("Custom", alwaysTrue)
  //   }
  // }),
  // voiceMemos: createFeature({
  //   id: "voiceMemos",
  //   title: "Voice memos",
  //   availability: {
  //     free: createLimit("5 minute", lte(5)),
  //     essential: createLimit("1 hour", lte(60)),
  //     pro: createLimit("∞", alwaysInfinite),
  //     believer: createLimit(true, alwaysTrue),
  //     legacyPro: createLimit(true, alwaysTrue)
  //   }
  // }),
  // notebookPublishing: createFeature({
  //   id: "notebookPublishing",
  //   title: "Notebook publishing",
  //   availability: {
  //     free: createLimit(1, lte(1)),
  //     essential: createLimit(2, lte(2)),
  //     pro: createLimit(5, lte(5)),
  //     believer: createLimit(true, alwaysTrue),
  //     legacyPro: createLimit(true, alwaysTrue)
  //   }
  // }),
  // vaults: createFeature({
  //   id: "vaults",
  //   title: "Vaults",
  //   availability: {
  //     free: createLimit(1, lte(1)),
  //     essential: createLimit(3, lte(3)),
  //     pro: createLimit("∞", alwaysInfinite),
  //     believer: createLimit("∞", alwaysInfinite),
  //     legacyPro: createLimit("∞", alwaysInfinite)
  //   }
  // })
};

export async function isFeatureAvailable<TId extends FeatureId>(
  id: TId,
  value?: number
): Promise<FeatureResult<TId>> {
  const user = await db.user.getUser();
  const type = user?.subscription?.type;

  const isLegacyPro =
    type !== undefined &&
    (type === SubscriptionType.BETA ||
      type === SubscriptionType.PREMIUM ||
      type === SubscriptionType.PREMIUM_CANCELED ||
      type === SubscriptionType.TRIAL);
  const plan = user?.subscription?.plan || SubscriptionPlan.FREE;

  const limit = getFeatureLimitFromPlan(id, plan, isLegacyPro);
  const isAllowed = await limit.isAllowed(value);

  return {
    isAllowed,
    availableOn: isAllowed ? undefined : await availableOn(id, value),
    caption: limit.caption as Caption<TId>,
    error: features[id].error(limit)
  };
}

export async function areFeaturesAvailable<TIds extends FeatureId[]>(
  ids: TIds,
  values: number[] = []
): Promise<Record<TIds[number], FeatureResult<TIds[number]>>> {
  const user = await db.user.getUser();
  const type = user?.subscription?.type;

  const isLegacyPro =
    type !== undefined &&
    (type === SubscriptionType.BETA ||
      type === SubscriptionType.PREMIUM ||
      type === SubscriptionType.PREMIUM_CANCELED ||
      type === SubscriptionType.TRIAL);
  const plan = user?.subscription?.plan || SubscriptionPlan.FREE;

  const results = {} as Record<TIds[number], FeatureResult<TIds[number]>>;
  for (let i = 0; i < ids.length; ++i) {
    const value = values.at(i);
    const id = ids[i];

    const limit = getFeatureLimitFromPlan(id, plan, isLegacyPro);
    const isAllowed = await limit.isAllowed(value);

    results[id as TIds[number]] = {
      isAllowed,
      availableOn: isAllowed ? undefined : await availableOn(id, value),
      caption: limit.caption as Caption<TIds[number]>,
      error: features[id].error(limit)
    };
  }

  return results;
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

function getFeatureLimitFromPlan(
  id: FeatureId,
  plan: SubscriptionPlan,
  isLegacyPro: boolean
) {
  const feature = features[id];
  const key = isLegacyPro ? "legacyPro" : PLAN_TO_AVAILABILITY[plan];

  return feature.availability[key];
}

const PLAN_TO_AVAILABILITY: Record<
  SubscriptionPlan,
  keyof Feature["availability"]
> = {
  [SubscriptionPlan.FREE]: "free",
  [SubscriptionPlan.ESSENTIAL]: "essential",
  [SubscriptionPlan.PRO]: "pro",
  [SubscriptionPlan.BELIEVER]: "believer",
  [SubscriptionPlan.EDUCATION]: "pro"
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

function lte(
  limit: number,
  getValue?: () => Promise<number | undefined> | number | undefined
) {
  return async (value?: number) => {
    value = value ?? (await getValue?.());
    if (typeof value === "undefined") return false;
    return value <= limit;
  };
}

function lt(
  limit: number,
  getValue?: () => Promise<number | undefined> | number | undefined
) {
  return async (value?: number) => {
    value = value ?? (await getValue?.());
    if (typeof value === "undefined") return false;
    return value < limit;
  };
}
// Helper to always allow
function alwaysTrue() {
  return true;
}
// Helper to always disallow
function alwaysFalse() {
  return false;
}
// Helper for "infinite" or "any" values
function alwaysInfinite() {
  return true;
}
