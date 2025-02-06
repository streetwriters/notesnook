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
import { Platform } from "react-native";
import { db } from "../common/database";
import ReminderSheet from "../components/sheets/reminder";
import { setAppState } from "../screens/editor/tiptap/utils";
import { eOnLoadNote } from "../utils/events";
import { NotesnookModule } from "../utils/notesnook-module";
import { eSendEvent } from "./event-manager";
import { fluidTabsRef } from "../utils/global-refs";

const launchIntent = Platform.OS === "ios" ? {} : NotesnookModule.getIntent();
let used = false;
let launched = false;
export const IntentService = {
  getLaunchIntent() {
    if (used || Platform.OS === "ios") return null;
    used = true;
    return launchIntent;
  },
  onLaunch() {
    if (launched || Platform.OS === "ios") return;
    launched = true;
    if (launchIntent["com.streetwriters.notesnook.OpenNoteId"]) {
      setAppState({
        movedAway: false,
        editing: true,
        timestamp: Date.now(),
        noteId: launchIntent["com.streetwriters.notesnook.OpenNoteId"]
      });
    }
  },
  async onAppStateChanged() {
    if (Platform.OS === "ios") return;
    try {
      const intent = NotesnookModule.getIntent();

      if (intent["com.streetwriters.notesnook.OpenNoteId"]) {
        const note = await db.notes.note(
          intent["com.streetwriters.notesnook.OpenNoteId"]
        );
        if (note) {
          eSendEvent(eOnLoadNote, {
            item: note
          });
          fluidTabsRef.current?.goToPage(1, false);
        }
      } else if (intent["com.streetwriters.notesnook.OpenReminderId"]) {
        const reminder = await db.reminders.reminder(
          intent["com.streetwriters.notesnook.OpenReminderId"]
        );
        if (reminder) ReminderSheet.present(reminder);
      } else if (intent["com.streetwriters.notesnook.NewReminder"]) {
        ReminderSheet.present();
      }
    } catch (e) {
      /* empty */
    }
  }
};
