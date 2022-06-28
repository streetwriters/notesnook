import React from "react";
import Vault from "../common/vault";
import {
  showBuyDialog,
  showCreateTagDialog,
  showEditTagDialog,
  showEmailVerificationDialog,
  showFeatureDialog,
  showOnboardingDialog,
} from "../common/dialog-controller";
import {
  showAddNotebookDialog,
  showEditNotebookDialog,
} from "../common/dialog-controller";
import { closeOpenedDialog } from "../common/dialog-controller";
import RouteContainer from "../components/route-container";
import DiffViewer from "../components/diff-viewer";
import Unlock from "../components/unlock";
import { store as appStore } from "../stores/app-store";
import { store as editorStore } from "../stores/editor-store";
import { isMobile } from "../utils/dimensions";
import {
  showEditTopicDialog,
  showCreateTopicDialog,
} from "../common/dialog-controller";
import { hashNavigate } from ".";
import { Suspense } from "react";
import EditorLoading from "../components/editor/loading";
import EditorPlaceholder from "../components/editor/-placeholder";
import { EditorLoader } from "../components/loaders/editor-loader";
const Editor = React.lazy(() => import("../components/editor"));

const hashroutes = {
  "/": () => {
    closeOpenedDialog();
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
    showCreateTopicDialog();
  },
  "/notebooks/:notebookId/topics/:topicId/edit": ({ notebookId, topicId }) => {
    showEditTopicDialog(notebookId, topicId);
  },
  "/tags/create": () => {
    showCreateTagDialog();
  },
  "/tags/:tagId/edit": ({ tagId }) => {
    showEditTagDialog(tagId);
  },
  "/notes/create": () => {
    closeOpenedDialog();
    hashNavigate("/notes/create", { addNonce: true, replace: true });
  },
  "/notes/create/:nonce": ({ nonce }) => {
    closeOpenedDialog();
    return (
      <Suspense fallback={<EditorLoader />}>
        <Editor noteId={0} nonce={nonce} />
      </Suspense>
    );
  },
  "/notes/:noteId/edit": ({ noteId }) => {
    closeOpenedDialog();

    return (
      <Suspense fallback={<EditorLoader />}>
        <Editor noteId={noteId} />
      </Suspense>
    );
  },
  "/notes/:noteId/unlock": ({ noteId }) => {
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
    closeOpenedDialog();
    return <DiffViewer noteId={noteId} />;
  },
  "/vault/changePassword": () => {
    Vault.changeVaultPassword();
  },
  "/vault/create": () => {
    Vault.createVault().then((res) => {
      appStore.setIsVaultCreated(res);
    });
  },
  "/buy": () => {
    showBuyDialog();
  },
  "/buy/:code": ({ code }) => {
    showBuyDialog("monthly", code);
  },
  "/buy/:plan/:code": ({ plan, code }) => {
    showBuyDialog(plan, code);
  },
  "/welcome": () => {
    showOnboardingDialog("new");
  },
  "/confirmed": () => {
    showFeatureDialog("confirmed");
  },
};

export default hashroutes;
