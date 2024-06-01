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

import {
  showBackupPasswordDialog,
  showFeatureDialog,
  showPasswordDialog,
  showReminderDialog
} from "./dialog-controller";
import Config from "../utils/config";
import { hashNavigate, getCurrentHash } from "../navigation";
import { db } from "./db";
import { sanitizeFilename } from "@notesnook/common";
import { useStore as useUserStore } from "../stores/user-store";
import { useStore as useSettingStore } from "../stores/setting-store";
import { showToast } from "../utils/toast";
import { SUBSCRIPTION_STATUS } from "./constants";
import { readFile, showFilePicker } from "../utils/file-picker";
import { logger } from "../utils/logger";
import { PATHS } from "@notesnook/desktop";
import { TaskManager } from "./task-manager";
import { EVENTS } from "@notesnook/core/dist/common";
import { createWritableStream } from "./desktop-bridge";
import { createZipStream } from "../utils/streams/zip-stream";
import { FeatureKeys } from "../dialogs/feature-dialog";
import { ZipEntry, createUnzipIterator } from "../utils/streams/unzip-stream";
import { User } from "@notesnook/core";
import { LegacyBackupFile } from "@notesnook/core";
import { useEditorStore } from "../stores/editor-store";
import { formatDate } from "@notesnook/core/dist/utils/date";
import {
  pipeline,
  AutoModel,
  env,
  Tensor,
  mean_pooling,
  FeatureExtractionPipeline
} from "@xenova/transformers";
import { toChunks } from "@notesnook/core/dist/utils/array";

env.allowLocalModels = true;
console.log(env);
const text = `I am generally not in favor of huge feature packed releases instead preferring small releases without one or two features at most. v3 is a special case in that the sheer amount of changes required to migrate from our old key value database to SQLite forced us to release all of these updates together.
Migrating to SQLite
Initially, as all plans go, our only goal was to migrate to SQLite as quickly and with as few changes as possible. Unfortunately, that plan died in its infancy. Our old legacy database was not designed to handle tens of thousands of notes or gigabytes of data — something we quickly realized after some users with over 100K notes approached us with significant performance issues. While it "worked", it was neither efficient nor particularly safe.
In August 2023, we began slowly migrating the Notesnook Core to SQLite. While migrating we quickly realized we'd need TypeScript if this was ever going to work because Kysely (the underlying query builder we used) heavily relied on types being there. So from the very first day we were doing 2 things: migrating the database to SQLite, and migrating the codebase to TypeScript.
I won't bore you with too many technical details but we had a few primary goals behind all this upheaval:
The clients should perform predictably regardless of how much data you have.
The clients should use as less RAM as possible to work in extremely constrained enviroments (e.g. iOS limits all Share Extensions to around 50 MB before crashing).
With v3 we have acheived both of these goals.
Fixing the Sync
Sync has notoriously been one of the least stable parts of Notesnook. From the beginning, we opted for a decentralized syncing system where each client could independently sync items without depending on a central server. This had a few drawbacks:
Since each client was independent, it was a nightmare to debug why something wasn't syncing.
In order to be efficient, we detected changed items based on their modified timestamp, but this forced us to juggle with the various inconsistencies of time on different devices.
Building everything on top of timestamps meant resumability during sync could never be stable.
In short, our old sync logic heavily depended on time to be the exact same (down to the last millisecond) for things to work. As you can imagine, this didn't work out that well.
While migrating everything to SQLite, we greatly simplified the sync logic opting for a centralized system this time. This allowed us to completely get rid of all the time juggling resolving all the edge cases in our previous logic.
As a result, in v3 you'll notice a bug free sync that "just works" regardless of where you are, how many devices you are on, the time difference between them etc.
Features, Features
In every new release, it is always a struggle to decide which features to add and which features to leave behind for later. v3 was no different because ultimately each feature you add pushes the deadline further and further away. Even then, v3 is one of our biggest releases ever.
Note linking
The crown jewel of v3! Yes, finally, you can link 2 notes together and even link directly to a specific block inside a note.
 We have also added controls to quickly see which notes you have linked to, and which notes link to a particular note.
 To keep things simple, a note link is no different than a normal hyperlink except that clicking on it will take you to the note instead of an external page. This also means that when you export your notes, your note links are automatically converted into hyperlinks that directly open the linked Markdown or HTML files of the notes. This is something no other app does instead keeping the links in their proprietary format making them essentially useless.
Tabs
The only reason we added tabs was to allow quick navigation to/from a note on clicking a note link. You can, of course, use tabs without ever linking a note.
 Notesnook is one of the few note taking apps (besides Obsidian & OneNote) that has a full fledged tab experience. With v3, we are slowly upgrading Notesnook to become a power user's tool while keeping things just as simple as before.
Nested notebooks

At rest encryption
Thanks to SQLite, at rest encryption is now a thing on all platforms. The encryption key is randomly generated on database creation without requiring any user intervention. In other words, it "just works" keeping your notes secure even if your device is compromised. Which brings me to...
App lock
App lock is an enhancement on at rest encryption. When you enable app lock, it further encrypts your database encryption key with your app lock pin (or security key) so it's not just an "overlay". If you forget your app lock pin, the only way into the app is to reset & clear the database and start over.
At Notesnook, we take your security & privacy very seriously.
Export attachments with notes
Exports got a lot of love in v3 with things like automatic downloading & linking of attachments, organization of note files based on your notebook structure, and resolution of internal note links to actual HTML/MD files.
User profile
   Custom colors for note organization
Fixed colors were nice but not nicer than custom colors.
Customizable side bar
You can now drag/drop and reorganize how things in your side bar looks including hiding things that you don't use. It can be as simple or as complex as you want.
Callouts

Beta release channels


Nested notebooks/topics
Note linking
Tabs
Table of Contents
Customizable/sortable sidebar
User profile
Custom colors
Yearly reminders
Callouts in editor 
Migration to SQLite
New sync system
At rest encryption
app lock
export attachments with notes.`;

const average = (array: number[]) =>
  array.reduce((a, b) => a + b) / array.length;

function createTensorWithBatchSize(opt: [number, number]) {
  const size = opt.reduce((n, i) => n * i, 1);
  return new Tensor("int64", new BigInt64Array(size).fill(BigInt(1)), opt);
}

function createBatch(batchSize: number, sequenceLength: number) {
  const tensor = createTensorWithBatchSize([batchSize, sequenceLength]);
  return {
    input_ids: tensor,
    attention_mask: tensor
  };
}

function chunkify(tokens: string[], chunkSize: number, overlap: number) {
  const chunks = [];
  const totalParts = Math.ceil(tokens.length / chunkSize);
  for (let i = 0; i < totalParts; ++i) {
    const start = i === 0 ? 0 : i * chunkSize - i * overlap;
    const end = start + chunkSize;
    chunks.push(tokens.slice(start, end));
  }
  return chunks;
}

/**
 *
 * Helper function for padding values of an object, which are each arrays.
 * NOTE: No additional checks are made here for validity of arguments.
 * @param {Record<string, any[]>} item The input object.
 * @param {number} length The length to pad to.
 * @param {(key: string) => any} value_fn Determine the value to fill the array, based on its key.
 * @param {string} side Which side to pad the array.
 * @private
 */
function padHelper(
  item: Record<string, any[]>,
  length: number,
  value_fn: (key: string) => any,
  side: string
) {
  for (const key of Object.keys(item)) {
    const diff = length - item[key].length;
    const value = value_fn(key);

    const padData = new Array(diff).fill(value);
    item[key] =
      side === "right"
        ? [...item[key], ...padData]
        : [...padData, ...item[key]];
  }
}

function tokenizeInput(
  pipeline: FeatureExtractionPipeline,
  options: { max_length: number }
) {
  const { tokenizer } = pipeline;
  const { max_length } = options;

  const encoded = tokenizer._encode_text(text) ?? [];
  const encodedTokens = chunkify(encoded, max_length - 12, 20).map((chunk) => {
    const { tokens, token_type_ids } = tokenizer.post_processor._call(
      chunk,
      [],
      { add_special_tokens: true }
    );
    const input_ids = tokenizer.model.convert_tokens_to_ids(tokens);

    return {
      input_ids,
      attention_mask: new Array(input_ids.length).fill(1),
      token_type_ids: token_type_ids || []
    };
  });

  for (let i = 0; i < encodedTokens.length; ++i) {
    if (encodedTokens[i].input_ids.length === max_length) {
      continue;
    } else if (encodedTokens[i].input_ids.length > max_length) {
      throw new Error("Truncation is not allowed.");
    } else {
      // t.length < max_length
      // possibly pad
      padHelper(
        encodedTokens[i],
        max_length,
        (key) => (key === "input_ids" ? tokenizer.pad_token_id : 0),
        tokenizer.padding_side
      );
    }
  }

  const dims = [encodedTokens.length, encodedTokens[0].input_ids.length];
  const input: Record<string, Tensor> = {};
  for (const key of Object.keys(encodedTokens[0])) {
    input[key] = new Tensor(
      "int64",
      BigInt64Array.from(encodedTokens.flatMap((x) => x[key]).map(BigInt)),
      dims
    );
  }
  return input;
}
async function generateEmbeddings(
  pipeline: FeatureExtractionPipeline,
  input: Record<string, Tensor>
) {
  const { tokenizer, model } = pipeline;

  const outputs = await model._call(input);

  let result =
    outputs.last_hidden_state ?? outputs.logits ?? outputs.token_embeddings;
  const pooling: "mean" | "cls" = tokenizer._tokenizer_config.cls_token
    ? "cls"
    : "mean";
  if (pooling === "mean") {
    result = mean_pooling(result, input.attention_mask);
  } else if (pooling === "cls") {
    result = result.slice(null, 0);
  }
  return result;
}

export const CREATE_BUTTON_MAP = {
  notes: {
    title: "Add a note",
    onClick: async () => {
      const models = [
        // ["Xenova/jina-embeddings-v2-small-en", 87]
        ["Snowflake/snowflake-arctic-embed-s", 41],
        // ["Snowflake/snowflake-arctic-embed-m", 20],
        ["Snowflake/snowflake-arctic-embed-xs", 62],
        // ["Xenova/GIST-small-Embedding-v0", 57],
        ["Xenova/GIST-all-MiniLM-L6-v2", 88],
        // ["Xenova/NoInstruct-small-Embedding-v0", 40],
        ["TaylorAI/bge-micro-v2", 100]
        // ["TaylorAI/gte-tiny", 88],
        // ["Xenova/gte-small", 63]
      ] as const;

      //  env.backends.onnx.wasm.proxy = false;
      // env.backends.onnx.webgpu.profiling = {
      //   mode: "default"
      // };
      // env.webgpu.profiling = {
      //   mode: "default"
      // };
      console.log(env);
      for (const provider of ["webgpu"] as const) {
        if (provider === "webgpu") env.backends.onnx.wasm.proxy = false;
        else env.backends.onnx.wasm.proxy = true;

        for (const [modelId, rank] of models) {
          console.log("loading model", modelId);

          const extractor = await pipeline("feature-extraction", modelId, {
            // progress_callback: console.log,
            device: provider,
            dtype: "fp32",
            cache_dir: "/models",
            local_files_only: true
            // session_options: {
            //   //   enableGraphCapture: true
            // }
          });

          const input = tokenizeInput(extractor, { max_length: 512 });

          // console.time(`[warming up] ${rank}. ${modelId} (${provider})`);
          for (let i = 0; i < 3; ++i) {
            console.time(`${rank}. ${modelId} (${provider})`);
            await generateEmbeddings(extractor, input);
            console.timeEnd(`${rank}. ${modelId} (${provider})`);
          }
          // console.timeEnd(`[warming up] ${rank}. ${modelId} (${provider})`);

          // const timings: number[] = [];
          // for (let i = 0; i < 10; ++i) {
          //   const now = performance.now();
          //   await generateEmbeddings(extractor, input);
          //   timings.push(performance.now() - now);
          // }
          // console.log(
          //   `[bench] ${rank}. ${modelId} (${provider})`,
          //   `avg: ${average(timings)}ms`,
          //   `min: ${Math.min(...timings)}ms`,
          //   `max: ${Math.max(...timings)}ms`
          // );
        }
      }
    } // useEditorStore.getState().newSession()
  },
  notebooks: {
    title: "Create a notebook",
    onClick: () => hashNavigate("/notebooks/create", { replace: true })
  },
  tags: {
    title: "Create a tag",
    onClick: () => hashNavigate(`/tags/create`, { replace: true })
  },
  reminders: {
    title: "Add a reminder",
    onClick: () => hashNavigate(`/reminders/create`, { replace: true })
  }
};

export async function introduceFeatures() {
  const hash = getCurrentHash().replace("#", "");
  if (!!hash || IS_TESTING) return;
  const features: FeatureKeys[] = [];
  for (const feature of features) {
    if (!Config.get(`feature:${feature}`)) {
      await showFeatureDialog(feature);
    }
  }
}

export const DEFAULT_CONTEXT = { colors: [], tags: [], notebook: {} };

export async function createBackup(
  options: {
    rescueMode?: boolean;
    noVerify?: boolean;
  } = {}
) {
  const { rescueMode, noVerify } = options;
  const { isLoggedIn } = useUserStore.getState();
  const { encryptBackups, toggleEncryptBackups } = useSettingStore.getState();
  if (!isLoggedIn && encryptBackups) toggleEncryptBackups();

  const verified =
    rescueMode || encryptBackups || noVerify || (await verifyAccount());
  if (!verified) {
    showToast("error", "Could not create a backup: user verification failed.");
    return false;
  }

  const encryptedBackups = !rescueMode && isLoggedIn && encryptBackups;

  const filename = sanitizeFilename(
    `${formatDate(Date.now(), {
      type: "date-time",
      dateFormat: "YYYY-MM-DD",
      timeFormat: "24-hour"
    })}-${new Date().getSeconds()}`,
    { replacement: "-" }
  );
  const directory = Config.get("backupStorageLocation", PATHS.backupsDirectory);
  const ext = "nnbackupz";
  const filePath = IS_DESKTOP_APP
    ? `${directory}/${filename}.${ext}`
    : `${filename}.${ext}`;

  const encoder = new TextEncoder();
  const error = await TaskManager.startTask<Error | void>({
    type: "modal",
    title: "Creating backup",
    subtitle: "We are creating a backup of your data. Please wait...",
    action: async (report) => {
      const writeStream = await createWritableStream(filePath);

      await new ReadableStream({
        start() {},
        async pull(controller) {
          for await (const file of db.backup!.export("web", encryptedBackups)) {
            report({
              text: `Saving chunk ${file.path}`
            });
            controller.enqueue({
              path: file.path,
              data: encoder.encode(file.data)
            });
          }
          controller.close();
        }
      })
        .pipeThrough(createZipStream())
        .pipeTo(writeStream);
    }
  });
  if (error) {
    showToast(
      "error",
      `Could not create a backup of your data: ${(error as Error).message}`
    );
    console.error(error);
  } else {
    showToast("success", `Backup saved at ${filePath}.`);
    return true;
  }
  return false;
}

export async function selectBackupFile() {
  const [file] = await showFilePicker({
    acceptedFileTypes: ".nnbackup,.nnbackupz"
  });
  if (!file) return;
  return file;
}

export async function importBackup() {
  const backupFile = await selectBackupFile();
  if (!backupFile) return false;
  await restoreBackupFile(backupFile);
  return true;
}

export async function restoreBackupFile(backupFile: File) {
  const isLegacy = !backupFile.name.endsWith(".nnbackupz");

  if (isLegacy) {
    const backup = JSON.parse(await readFile(backupFile));

    if (backup.data.iv && backup.data.salt) {
      await showBackupPasswordDialog(async ({ password, key }) => {
        if (!password && !key) return false;
        const error = await restoreWithProgress(backup, password, key);
        return !error;
      });
    } else {
      await restoreWithProgress(backup);
    }
    await db.initCollections();
  } else {
    const error = await TaskManager.startTask<Error | void>({
      title: "Restoring backup",
      subtitle: "Please wait while we restore your backup...",
      type: "modal",
      action: async (report) => {
        let cachedPassword: string | undefined = undefined;
        let cachedKey: string | undefined = undefined;
        // const { read, totalFiles } = await Reader(backupFile);
        const entries: ZipEntry[] = [];
        let filesProcessed = 0;

        let isValid = false;
        for await (const entry of createUnzipIterator(backupFile)) {
          if (entry.name === ".nnbackup") {
            isValid = true;
            continue;
          }
          entries.push(entry);
        }
        if (!isValid)
          console.warn(
            "The backup file does not contain the verification .nnbackup file."
          );

        await db.transaction(async () => {
          for (const entry of entries) {
            const backup = JSON.parse(await entry.text());
            if (backup.encrypted) {
              if (!cachedPassword && !cachedKey) {
                const result = await showBackupPasswordDialog(
                  async ({ password, key }) => {
                    if (!password && !key) return false;
                    await db.backup?.import(backup, password, key);
                    cachedPassword = password;
                    cachedKey = key;
                    return true;
                  }
                );
                if (!result) break;
              } else await db.backup?.import(backup, cachedPassword, cachedKey);
            } else {
              await db.backup?.import(backup);
            }

            report({
              text: `Processed ${entry.name}`,
              current: filesProcessed++,
              total: entries.length
            });
          }
        });
        await db.initCollections();
      }
    });
    if (error) {
      console.error(error);
      showToast("error", `Failed to restore backup: ${error.message}`);
    }
  }
}

async function restoreWithProgress(
  backup: LegacyBackupFile,
  password?: string,
  key?: string
) {
  return await TaskManager.startTask<Error | void>({
    title: "Restoring backup",
    subtitle: "This might take a while",
    type: "modal",
    action: (report) => {
      db.eventManager.subscribe(
        EVENTS.migrationProgress,
        ({
          collection,
          total,
          current
        }: {
          collection: string;
          total: number;
          current: number;
        }) => {
          report({
            text: `Restoring ${collection}...`,
            current,
            total
          });
        }
      );

      report({ text: `Restoring...` });
      return restore(backup, password, key);
    }
  });
}

export async function verifyAccount() {
  if (!(await db.user?.getUser())) return true;
  return await showPasswordDialog({
    title: "Verify it's you",
    subtitle: "Enter your account password to proceed.",
    inputs: {
      password: {
        label: "Password",
        autoComplete: "current-password"
      }
    },
    validate: async ({ password }) => {
      return !!password && (await db.user?.verifyPassword(password));
    }
  });
}

export function totalSubscriptionConsumed(user: User) {
  if (!user) return 0;
  const start = user.subscription?.start;
  const end = user.subscription?.expiry;
  if (!start || !end) return 0;

  const total = end - start;
  const consumed = Date.now() - start;

  return Math.round((consumed / total) * 100);
}

export async function showUpgradeReminderDialogs() {
  if (IS_TESTING) return;

  const user = useUserStore.getState().user;
  if (!user || !user.subscription || user.subscription?.expiry === 0) return;

  const consumed = totalSubscriptionConsumed(user);
  const isTrial = user.subscription?.type === SUBSCRIPTION_STATUS.TRIAL;
  const isBasic = user.subscription?.type === SUBSCRIPTION_STATUS.BASIC;
  if (isBasic && consumed >= 100) {
    await showReminderDialog("trialexpired");
  } else if (isTrial && consumed >= 75) {
    await showReminderDialog("trialexpiring");
  }
}

async function restore(
  backup: LegacyBackupFile,
  password?: string,
  key?: string
) {
  try {
    await db.backup?.import(backup, password, key);
    showToast("success", "Backup restored!");
  } catch (e) {
    logger.error(e as Error, "Could not restore the backup");
    showToast(
      "error",
      `Could not restore the backup: ${(e as Error).message || e}`
    );
  }
}
