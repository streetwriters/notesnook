import React from "react";
import Vault from "../common/vault";
import { showEmailVerificationDialog } from "../components/dialogs/emailverificationdialog";
import {
  showAddNotebookDialog,
  showEditNotebookDialog,
} from "../components/dialogs/addnotebookdialog";
import { closeOpenedDialog } from "../components/dialogs/dialog";
import { showLogInDialog } from "../components/dialogs/logindialog";
import { showSignUpDialog } from "../components/dialogs/signupdialog";
import RouteContainer from "../components/route-container";
import SplitEditor from "../components/spliteditor";
import Unlock from "../components/unlock";
import { store as appStore } from "../stores/app-store";
import { store as editorStore } from "../stores/editor-store";
import { store as noteStore } from "../stores/note-store";
import { isMobile } from "../utils/dimensions";

const hashroutes = {
  "/": () => {
    closeOpenedDialog();
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
  "/notes/create": () => {
    console.log("session");
    editorStore.get().newSession(noteStore.get().context);
  },
  "/notes/:noteId/edit": ({ noteId }) => {
    editorStore.openSession(noteId);
  },
  "/notes/:noteId/unlock": ({ noteId }) => {
    return (
      <RouteContainer
        onlyBackButton={isMobile()}
        route={<Unlock noteId={noteId} />}
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
