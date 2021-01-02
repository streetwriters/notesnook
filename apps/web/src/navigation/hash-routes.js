import React from "react";
import {
  showAddNotebookDialog,
  showEditNotebookDialog,
} from "../components/dialogs/addnotebookdialog";
import { closeOpenedDialog } from "../components/dialogs/dialog";
import { showLogInDialog } from "../components/dialogs/logindialog";
import Editor from "../components/editor";
import RouteContainer from "../components/route-container";
import SplitEditor from "../components/spliteditor";
import Unlock from "../components/unlock";
import { store as editorStore } from "../stores/editor-store";
import { store as noteStore } from "../stores/note-store";
import { isMobile } from "../utils/dimensions";

const hashroutes = {
  "/": () => {
    closeOpenedDialog();
  },
  "/notebooks/create": () => {
    showAddNotebookDialog();
  },
  "/notebooks/:notebookId/edit": ({ notebookId }) => {
    showEditNotebookDialog(notebookId);
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
  "/notes/create": () => {
    editorStore.newSession(noteStore.get().context);
  },
  "/login": () => {
    showLogInDialog();
  },
};

export default hashroutes;
