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
import {
  showEditTopicDialog,
  showCreateTopicDialog
} from "../common/dialog-controller";
import { hashNavigate } from ".";
import Editor from "../components/editor";

const hashroutes = {
  "/": () => {
    return (
      !editorStore.get().session.state && <Editor noteId={0} nonce={"-1"} />
    );
  },
  "/email/verify": () => {
    showEmailVerificationDialog().then(afterAction);
  },
  "/notebooks/create": () => {
    showAddNotebookDialog().then(afterAction);
  },
  "/notebooks/:notebookId/edit": ({ notebookId }: { notebookId: string }) => {
    showEditNotebookDialog(notebookId)?.then(afterAction);
  },
  "/topics/create": () => {
    showCreateTopicDialog().then(afterAction);
  },
  "/reminders/create": () => {
    showAddReminderDialog().then(afterAction);
  },
  "/reminders/:reminderId/edit": ({ reminderId }: { reminderId: string }) => {
    showEditReminderDialog(reminderId).then(afterAction);
  },
  "/notebooks/:notebookId/topics/:topicId/edit": ({
    notebookId,
    topicId
  }: {
    notebookId: string;
    topicId: string;
  }) => {
    showEditTopicDialog(notebookId, topicId)?.then(afterAction);
  },
  "/tags/create": () => {
    showCreateTagDialog().then(afterAction);
  },
  "/tags/:tagId/edit": ({ tagId }: { tagId: string }) => {
    showEditTagDialog(tagId)?.then(afterAction);
  },
  "/notes/create": () => {
    closeOpenedDialog();
    hashNavigate("/notes/create", { addNonce: true, replace: true });
  },
  "/notes/create/:nonce": ({ nonce }: { nonce: string }) => {
    closeOpenedDialog();
    return <Editor noteId={0} nonce={nonce} />;
  },
  "/notes/:noteId/edit": ({ noteId }: { noteId: string }) => {
    closeOpenedDialog();

    return <Editor noteId={noteId} />;
  },
  "/notes/:noteId/unlock": ({ noteId }: { noteId: string }) => {
    closeOpenedDialog();
    return (
      <RouteContainer
        buttons={{
          back: isMobile()
            ? {
                title: "Go back",
                action: () =>
                  hashNavigate("/notes/create", {
                    addNonce: true,
                    replace: true
                  })
              }
            : undefined
        }}
        component={<Unlock noteId={noteId} />}
      />
    );
  },
  "/notes/:noteId/conflict": ({ noteId }: { noteId: string }) => {
    closeOpenedDialog();
    return <DiffViewer noteId={noteId} />;
  },
  "/buy": () => {
    showBuyDialog().then(afterAction);
  },
  "/buy/:code": ({ code }: { code: string }) => {
    showBuyDialog("monthly", code).then(afterAction);
  },
  "/buy/:plan/:code": ({
    plan,
    code
  }: {
    plan: "monthly" | "yearly";
    code: string;
  }) => {
    showBuyDialog(plan, code).then(afterAction);
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
};

export default hashroutes;
export type HashRoute = keyof typeof hashroutes;

function afterAction() {
  window.location.hash = "";
}
