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

import { describe, expect, test } from "vitest";
import { createEditor } from "../../../../test-utils/index.js";
import { AudioNode } from "../audio.js";

const AUDIO_DATA_URL =
  "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YQAAAAA=";

describe("audio data URLs", () => {
  test("derives attachment metadata while parsing HTML", () => {
    const { editor } = createEditor({
      initialContent: `<audio src="${AUDIO_DATA_URL}"></audio>`,
      extensions: { audio: AudioNode }
    });

    expect(editor.getJSON().content?.[0]).toMatchObject({
      type: "audio",
      attrs: {
        src: AUDIO_DATA_URL,
        mime: "audio/wav",
        size: 44
      }
    });
  });
});
