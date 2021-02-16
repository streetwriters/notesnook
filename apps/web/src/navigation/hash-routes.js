import React from "react";
import Vault from "../common/vault";
import { showEmailVerificationDialog } from "../common/dialog-controller";
import {
  showAddNotebookDialog,
  showEditNotebookDialog,
} from "../common/dialog-controller";
import { closeOpenedDialog } from "../common/dialog-controller";
import { showLogInDialog } from "../common/dialog-controller";
import { showSignUpDialog } from "../common/dialog-controller";
import RouteContainer from "../components/route-container";
import SplitEditor from "../components/spliteditor";
import Unlock from "../components/unlock";
import { store as appStore } from "../stores/app-store";
import { store as editorStore } from "../stores/editor-store";
import { store as noteStore } from "../stores/note-store";
import { isMobile, isTablet } from "../utils/dimensions";
import {
  showEditTopicDialog,
  showTopicDialog,
} from "../common/dialog-controller";
import { hashNavigate } from ".";

const hashroutes = {
  "/": () => {
    closeOpenedDialog();
    if (isMobile() || isTablet()) editorStore.clearSession(false);
  },
  "/email/verify": () => {
    showEmailVerificationDialog();
  },
  "/notebooks/create": () => {
    showAddNotebookDialog();
  },
  "/notebooks/:notebookId/edit": ({ notebookId }) => {
    showEditNotebookDialog(notebookId);
  },
  "/topics/create": () => {
    showTopicDialog();
  },
  "/notebooks/:notebookId/topics/:topicId/edit": ({ notebookId, topicId }) => {
    showEditTopicDialog(notebookId, topicId);
  },
  "/notes/create": () => {
    editorStore.get().newSession(noteStore.get().context);
  },
  "/notes/:noteId/edit": ({ noteId }) => {
    editorStore.openSession(noteId);
  },
  "/notes/:noteId/unlock": ({ noteId }) => {
    return (
      <RouteContainer
        buttons={{
          back: isMobile()
            ? {
                title: "Go back",
                action: () => hashNavigate("/notes/create"),
              }
            : undefined,
        }}
        component={<Unlock noteId={noteId} />}
      />
    );
  },
  "/notes/:noteId/conflict": ({ noteId }) => {
    return <SplitEditor noteId={noteId} />;
  },
  "/signup": () => {
    showSignUpDialog();
  },
  "/vault/changePassword": () => {
    Vault.changeVaultPassword();
  },
  "/vault/create": () => {
    Vault.createVault().then((res) => {
      appStore.setIsVaultCreated(res);
    });
  },
  "/login": () => {
    showLogInDialog();
  },
};

export default hashroutes;
