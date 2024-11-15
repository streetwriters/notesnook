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

import { hashNavigate } from ".";
import { defineRoutes } from "./types";
import { useEditorStore } from "../stores/editor-store";
import {
  AddNotebookDialog,
  EditNotebookDialog
} from "../dialogs/add-notebook-dialog";
import { EmailVerificationDialog } from "../dialogs/email-verification-dialog";
import { SettingsDialog } from "../dialogs/settings";
import { BuyDialog } from "../dialogs/buy-dialog";
import {
  AddReminderDialog,
  EditReminderDialog
} from "../dialogs/add-reminder-dialog";
import { FeatureDialog } from "../dialogs/feature-dialog";
import { CreateTagDialog } from "../dialogs/item-dialog";
import { OnboardingDialog } from "../dialogs/onboarding-dialog";

const hashroutes = defineRoutes({
  "/": () => {},
  "/email/verify": () => {
    EmailVerificationDialog.show({}).then(afterAction);
  },
  "/notebooks/create": () => {
    AddNotebookDialog.show({}).then(afterAction);
  },
  "/notebooks/:notebookId/edit": ({ notebookId }) => {
    EditNotebookDialog.show({ notebookId })?.then(afterAction);
  },
  "/reminders/create": () => {
    AddReminderDialog.show({}).then(afterAction);
  },
  "/reminders/:reminderId/edit": ({ reminderId }) => {
    EditReminderDialog.show({ reminderId }).then(afterAction);
  },
  "/tags/create": () => {
    CreateTagDialog.show().then(afterAction);
  },
  "/notes/:noteId/create": ({ noteId }) => {
    useEditorStore.getState().openSession(noteId);
  },
  "/notes/:noteId/edit": ({ noteId }) => {
    useEditorStore.getState().openSession(noteId);
  },
  "/buy": () => {
    BuyDialog.show({}).then(afterAction);
  },
  "/buy/:code": ({ code }: { code: string }) => {
    BuyDialog.show({ couponCode: code, plan: "monthly" }).then(afterAction);
  },
  "/buy/:plan/:code": ({ plan, code }) => {
    BuyDialog.show({
      plan: plan === "monthly" ? "monthly" : "yearly",
      couponCode: code
    }).then(afterAction);
  },
  "/welcome": () => {
    OnboardingDialog.show({ type: "new" })?.then(afterAction);
  },
  "/confirmed": () => {
    FeatureDialog.show({ featureName: "confirmed" }).then(afterAction);
  },
  "/settings": () => {
    SettingsDialog.show({}).then(afterAction);
  }
});

export default hashroutes;
export type HashRoute = keyof typeof hashroutes;

function afterAction() {
  hashNavigate("/", { replace: true, notify: false });
  if (!history.state.replace) history.back();
}
