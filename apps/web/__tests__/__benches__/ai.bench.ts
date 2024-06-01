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

import { describe, bench } from "vitest";
import { pipeline } from "@xenova/transformers";
import path from "path";

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
export attachments with notes
.ccccccccccxccccccc`;

describe("benchmarking embeddings", async () => {
  const models = [
    ["Xenova/jina-embeddings-v2-small-en", 87],
    ["Snowflake/snowflake-arctic-embed-s", 41],
    ["Snowflake/snowflake-arctic-embed-m", 20],
    ["Snowflake/snowflake-arctic-embed-xs", 62],
    // "Alibaba-NLP/gte-base-en-v1.5",
    // "andersonbcdefg/bge-small-4096"
    ["Xenova/GIST-small-Embedding-v0", 57],
    ["Xenova/GIST-all-MiniLM-L6-v2", 88],
    // "Xenova/all-MiniLM-L12-v2" // 96
    ["Xenova/NoInstruct-small-Embedding-v0", 40],
    ["TaylorAI/bge-micro-v2", 100],
    // "Snowflake/snowflake-arctic-embed-m-long" // 19
    // "Xenova/e5-small-v2" // 67
    // "nomic-ai/nomic-embed-text-v1.5",
    // "Xenova/bert-base-uncased",
    ["TaylorAI/gte-tiny", 88],
    ["Xenova/gte-small", 63]
  ];
  for (const provider of ["cpu"]) {
    for (const [model, rank] of models) {
      const extractor = await pipeline("feature-extraction", model, {
        // progress_callback: console.log,
        device: provider,
        dtype: "q8",
        cache_dir: path.join(__dirname, "..", "..", "public", "models")
      });
      console.log(model, extractor.tokenizer.model_max_length);
      extractor.tokenizer.model_max_length = 512;
      bench(`${rank}. ${model} (${provider})`, async () => {
        const output = await extractor(text, {
          pooling: extractor.tokenizer._tokenizer_config.cls_token
            ? "cls"
            : "mean"
        });
      });
    }
  }
});

// console.time("extraction");
// const output = await extractor(text);
// console.timeEnd("extraction");
// console.log(output.data.length);
