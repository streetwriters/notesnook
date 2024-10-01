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

import { z } from "zod";
import { Monograph } from "../components/monographpost/types";

export const SpamFilterRule = z.object({
  type: z.union([z.literal("literal"), z.literal("regex")]),
  property: z.union([
    z.literal("userId"),
    z.literal("content"),
    z.literal("id")
  ]),
  value: z.string()
});
export type SpamFilterRule = z.infer<typeof SpamFilterRule>;

export async function isSpamCached(id: string, kv: KVNamespace) {
  const cache = await json<string[]>(kv, "spam-cache", []);
  return cache.includes(id);
}

export async function isSpam(monograph: Monograph, kv: KVNamespace) {
  try {
    const cache = await json<string[]>(kv, "spam-cache", []);
    if (cache.includes(monograph.id)) return true;

    const rules = await json<SpamFilterRule[]>(kv, "rules", []);
    const userIdRules = new Set(
      rules.filter((r) => r.property === "userId").map((r) => r.value)
    );
    const idRules = new Set(
      rules.filter((r) => r.property === "id").map((r) => r.value)
    );

    const isSpam = (() => {
      if (userIdRules.has(monograph.userId) || idRules.has(monograph.id))
        return true;

      for (const rule of rules) {
        if (rule.property === "id" || rule.property === "userId") continue;
        const value = monograph.content?.data;
        if (!value || typeof value !== "string") continue;
        if (rule.type === "literal" && value.includes(rule.value)) return true;
        else if (rule.type === "regex") {
          const regex = new RegExp(rule.value, "igm");
          if (regex.test(value)) return true;
        }
      }
      return false;
    })();

    if (isSpam) {
      console.log("Spam detected", monograph.id);
      cache.push(monograph.id);
      await kv.put("spam-cache", JSON.stringify(cache));
    }
    return isSpam;
  } catch (e) {
    console.error(e);
    return false;
  }
}

export async function addSpamFilterRule(maybeRule: unknown, kv: KVNamespace) {
  const rule = SpamFilterRule.parse(maybeRule);
  const rules = await json<SpamFilterRule[]>(kv, "rules", []);
  rules.push(rule);
  await kv.put("rules", JSON.stringify(rules));
}

async function json<T>(kv: KVNamespace, key: string, fallback: T) {
  try {
    return (await kv.get<T>(key, "json")) || fallback;
  } catch (e) {
    console.error(e);
    return fallback;
  }
}
