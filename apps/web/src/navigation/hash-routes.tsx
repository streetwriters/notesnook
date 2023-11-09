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
  showAddReminderDialog,
  showBuyDialog,
  showCreateTagDialog,
  showEditReminderDialog,
  showEditTagDialog,
  showEmailVerificationDialog,
  showFeatureDialog,
  showOnboardingDialog,
  showSettings
} from "../common/dialog-controller";
import {
  showAddNotebookDialog,
  showEditNotebookDialog
} from "../common/dialog-controller";
import { closeOpenedDialog } from "../common/dialog-controller";
import RouteContainer from "../components/route-container";
import DiffViewer from "../components/diff-viewer";
import Unlock from "../components/unlock";
import { store as editorStore } from "../stores/editor-store";
import { isMobile } from "../utils/dimensions";
import { hashNavigate } from ".";
import Editor from "../components/editor";
import { defineRoutes } from "./types";

const hashroutes = defineRoutes({
  "/": () => {
    return !editorStore.get().session.state && <Editor nonce={"-1"} />;
  },
  "/email/verify": () => {
    showEmailVerificationDialog().then(afterAction);
  },
  "/notebooks/create": () => {
    showAddNotebookDialog().then(afterAction);
  },
  "/notebooks/:notebookId/edit": ({ notebookId }) => {
    showEditNotebookDialog(notebookId)?.then(afterAction);
  },
  "/reminders/create": () => {
    showAddReminderDialog().then(afterAction);
  },
  "/reminders/:reminderId/edit": ({ reminderId }) => {
    showEditReminderDialog(reminderId).then(afterAction);
  },
  "/tags/create": () => {
    showCreateTagDialog().then(afterAction);
  },
  "/tags/:tagId/edit": ({ tagId }) => {
    showEditTagDialog(tagId)?.then(afterAction);
  },
  "/notes/create": () => {
    closeOpenedDialog();
    hashNavigate("/notes/create", { addNonce: true, replace: true });
  },
  "/notes/create/:nonce": ({ nonce }) => {
    closeOpenedDialog();
    return <Editor nonce={nonce} />;
  },
  "/notes/:noteId/edit": ({ noteId }) => {
    closeOpenedDialog();

    return <Editor noteId={noteId} />;
  },
  "/notes/:noteId/unlock": ({ noteId }) => {
    closeOpenedDialog();
    return (
      <RouteContainer
        type="unlock"
        buttons={{
          back: isMobile()
            ? {
                title: "Go back",
                onClick: () =>
                  hashNavigate("/notes/create", {
                    addNonce: true,
                    replace: true
                  })
              }
            : undefined
        }}
      >
        <Unlock noteId={noteId} />
      </RouteContainer>
    );
  },
  "/notes/:noteId/conflict": ({ noteId }) => {
    closeOpenedDialog();
    return <DiffViewer noteId={noteId} />;
  },
  "/buy": () => {
    showBuyDialog().then(afterAction);
  },
  "/buy/:code": ({ code }: { code: string }) => {
    showBuyDialog("monthly", code).then(afterAction);
  },
  "/buy/:plan/:code": ({ plan, code }) => {
    showBuyDialog(plan === "monthly" ? "monthly" : "yearly", code).then(
      afterAction
    );
  },
  "/welcome": () => {
    showOnboardingDialog("new")?.then(afterAction);
  },
  "/confirmed": () => {
    showFeatureDialog("confirmed").then(afterAction);
  },
  "/settings": () => {
    showSettings().then(afterAction);
  }
});

export default hashroutes;
export type HashRoute = keyof typeof hashroutes;

function afterAction() {
  window.location.hash = "";
}
