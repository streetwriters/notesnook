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
import { isMobile, isTablet } from "../utils/dimensions";
import {
  showEditTopicDialog,
  showTopicDialog,
} from "../common/dialog-controller";
import { hashNavigate } from ".";
import { Suspense } from "react";
import EditorLoading from "../components/editor/loading";
import EditorPlaceholder from "../components/editor/-placeholder";
import { store as userStore } from "../stores/user-store";
import { upgrade } from "../common/upgrade";
import { isUserPremium } from "../common";
const Editor = React.lazy(() => import("../components/editor"));

const hashroutes = {
  "/": () => {
    closeOpenedDialog();
    if (isMobile() || isTablet()) editorStore.clearSession(false);

    return !editorStore.get().session.state && <EditorPlaceholder />;
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
    hashNavigate("/notes/create", { addNonce: true, replace: true });
  },
  "/notes/create/:nonce": ({ nonce }) => {
    return (
      <Suspense fallback={<EditorLoading />}>
        <Editor noteId={0} nonce={nonce} />
      </Suspense>
    );
  },
  "/notes/:noteId/edit": ({ noteId }) => {
    return (
      <Suspense fallback={<EditorLoading text="Opening note..." />}>
        <Editor noteId={noteId} />
      </Suspense>
    );
  },
  "/notes/:noteId/unlock": ({ noteId }) => {
    return (
      <RouteContainer
        buttons={{
          back: isMobile()
            ? {
                title: "Go back",
                action: () =>
                  hashNavigate("/notes/create", {
                    addNonce: true,
                    replace: true,
                  }),
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
  "/buy/:code": ({ code }) => {
    hashNavigate("/", { notify: false });
    const user = userStore.get().user;
    if (!user || isUserPremium()) return;
    upgrade(user, code);
  },
};

export default hashroutes;
