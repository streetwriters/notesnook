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

import { useState } from "react";
import { Button, Flex, Text } from "@theme-ui/components";
import Dialog from "../components/dialog";
import { BaseDialogProps, DialogManager } from "../common/dialog-manager";
import { db } from "../common/db";
import Field from "../components/field";
import { showToast } from "../utils/toast";
import { SerializedKeyPair } from "@notesnook/crypto";
import { ConfirmDialog } from "./confirm";

type InboxPGPKeysDialogProps = BaseDialogProps<boolean> & {
  keys?: SerializedKeyPair | null;
};

export const InboxPGPKeysDialog = DialogManager.register(
  function InboxPGPKeysDialog(props: InboxPGPKeysDialogProps) {
    const { keys: initialKeys, onClose } = props;
    const [mode, setMode] = useState<"choose" | "edit">(
      initialKeys ? "edit" : "choose"
    );
    const [publicKey, setPublicKey] = useState(initialKeys?.publicKey || "");
    const [privateKey, setPrivateKey] = useState(initialKeys?.privateKey || "");
    const [isLoading, setIsLoading] = useState(false);

    const hasChanges =
      publicKey !== (initialKeys?.publicKey || "") ||
      privateKey !== (initialKeys?.privateKey || "");

    async function handleAutoGenerate() {
      try {
        setIsLoading(true);
        await db.user.getInboxKeys();
        showToast("success", "Inbox keys generated");
        onClose(true);
      } catch (error) {
        showToast("error", "Failed to generate inbox keys");
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }

    async function handleSave() {
      const trimmedPublicKey = publicKey.trim();
      const trimmedPrivateKey = privateKey.trim();
      if (!trimmedPublicKey || !trimmedPrivateKey) {
        showToast("error", "Both public and private keys are required");
        return;
      }

      try {
        setIsLoading(true);
        const isValid = await db.storage().validatePGPKeyPair({
          publicKey: trimmedPublicKey,
          privateKey: trimmedPrivateKey
        });
        if (!isValid) {
          showToast(
            "error",
            "Invalid PGP key pair. Please check your keys and try again."
          );
          return;
        }

        if (initialKeys) {
          const ok = await ConfirmDialog.show({
            title: "Change Inbox PGP Keys",
            message:
              "Changing Inbox PGP keys will delete all your unsynced inbox items. Are you sure?",
            positiveButtonText: "Yes",
            negativeButtonText: "No"
          });
          if (!ok) return;
        }

        await db.user.saveInboxKeys({
          publicKey: trimmedPublicKey,
          privateKey: trimmedPrivateKey
        });
        showToast("success", "Inbox keys saved");
        onClose(true);
      } catch (error) {
        showToast("error", "Failed to save inbox keys");
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }

    if (mode === "choose") {
      return (
        <Dialog
          isOpen={true}
          title="Setup Inbox PGP Keys"
          width={500}
          negativeButton={{
            text: "Cancel",
            onClick: () => onClose(false)
          }}
        >
          <Flex sx={{ flexDirection: "column", gap: 3 }}>
            <Text sx={{ fontSize: "body", color: "paragraph" }}>
              Choose how you want to set up your Inbox PGP keys:
            </Text>
            <Flex sx={{ flexDirection: "column", gap: 2 }}>
              <Button
                variant="secondary"
                onClick={handleAutoGenerate}
                disabled={isLoading}
                sx={{ width: "100%" }}
              >
                {isLoading ? "Generating..." : "Auto-generate keys"}
              </Button>
              <Text
                sx={{
                  fontSize: "body",
                  color: "paragraph",
                  textAlign: "center"
                }}
              >
                Or
              </Text>
              <Button
                variant="secondary"
                onClick={() => setMode("edit")}
                disabled={isLoading}
                sx={{ width: "100%" }}
              >
                Provide your own keys
              </Button>
            </Flex>
          </Flex>
        </Dialog>
      );
    }

    return (
      <Dialog
        isOpen={true}
        title="Inbox PGP Keys"
        width={600}
        positiveButton={{
          text: isLoading ? "Saving..." : "Save",
          onClick: handleSave,
          disabled: isLoading || !hasChanges
        }}
        negativeButton={{
          text: "Cancel",
          onClick: () => onClose(false)
        }}
      >
        <Flex sx={{ flexDirection: "column", gap: 3 }}>
          <Field
            label="Public Key"
            id="publicKey"
            name="publicKey"
            as="textarea"
            required
            value={publicKey}
            onChange={(e) => setPublicKey(e.target.value)}
            sx={{
              fontFamily: "monospace",
              fontSize: "body",
              minHeight: 150,
              resize: "vertical"
            }}
            placeholder="Enter your PGP public key..."
            disabled={isLoading}
          />
          <Field
            label="Private Key"
            id="privateKey"
            name="privateKey"
            as="textarea"
            required
            value={privateKey}
            onChange={(e) => setPrivateKey(e.target.value)}
            sx={{
              fontFamily: "monospace",
              fontSize: "body",
              minHeight: 150,
              resize: "vertical"
            }}
            placeholder="Enter your PGP private key..."
            disabled={isLoading}
          />
        </Flex>
      </Dialog>
    );
  }
);
