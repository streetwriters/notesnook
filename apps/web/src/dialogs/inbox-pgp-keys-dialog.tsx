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

import { IconBox, buttonProps } from "../components/settings-ui";
import { useState } from "react";
import { Box, Flex, Text } from "@theme-ui/components";
import Dialog from "../components/dialog";
import { BaseDialogProps, DialogManager } from "../common/dialog-manager";
import { db } from "../common/db";
import Field from "../components/field";
import { showToast } from "../utils/toast";
import { SerializedKeyPair } from "@notesnook/crypto";
import { ConfirmDialog } from "./confirm";
import { strings } from "@notesnook/intl";
import { Icon, KeyIcon, MagicWand } from "../components/icons";

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
        showToast("success", strings.inboxKeysGenerated());
        onClose(true);
      } catch (error) {
        showToast("error", strings.failedToGenerateInboxKeys());
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }

    async function handleSave() {
      const trimmedPublicKey = publicKey.trim();
      const trimmedPrivateKey = privateKey.trim();
      if (!trimmedPublicKey || !trimmedPrivateKey) {
        showToast("error", strings.publicAndPrivateKeysRequired());
        return;
      }

      try {
        setIsLoading(true);
        const result = await db.storage().validatePGPKeyPair({
          publicKey: trimmedPublicKey,
          privateKey: trimmedPrivateKey
        });
        if (!result.isValid) {
          showToast("error", result.message);
          return;
        }

        if (initialKeys) {
          const ok = await ConfirmDialog.show({
            title: strings.changeInboxPgpKeys(),
            subtitle: strings.changingInboxPgpKeysNotice(),
            positiveButtonText: strings.yes(),
            negativeButtonText: strings.no()
          });
          if (!ok) return;
        }

        await db.user.saveInboxKeys({
          publicKey: trimmedPublicKey,
          privateKey: trimmedPrivateKey
        });
        showToast("success", strings.inboxKeysSaved());
        onClose(true);
      } catch (error) {
        showToast("error", strings.failedToSaveInboxKeys());
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }

    if (mode === "choose") {
      return (
        <Dialog
          isOpen={true}
          title={strings.setupInboxPgpKeys()}
          description={strings.setupInboxPgpKeysDescription()}
          width={550}
          negativeButton={{
            text: strings.cancel(),
            onClick: () => onClose(false)
          }}
        >
          <Flex sx={{ flexDirection: "column", mb: "spacing7" }}>
            <Box sx={{ height: "1px", bg: "separator", my: "spacing6" }} />
            <Flex sx={{ flexDirection: "column", gap: "spacing4" }}>
              <KeyOption
                icon={MagicWand}
                iconSize={13}
                title={
                  isLoading ? strings.generating() : strings.autoGenerateKeys()
                }
                description={strings.autoGenerateKeysDesc()}
                selected={isLoading}
                disabled={isLoading}
                onClick={handleAutoGenerate}
              />
              <KeyOption
                icon={KeyIcon}
                iconSize={15}
                title={strings.provideOwnKeys()}
                description={strings.provideOwnKeysDesc()}
                disabled={isLoading}
                onClick={() => setMode("edit")}
              />
            </Flex>
          </Flex>
        </Dialog>
      );
    }

    return (
      <Dialog
        isOpen={true}
        title={strings.manageInboxKeys()}
        width={700}
        positiveButton={{
          text: isLoading ? strings.saving() : strings.save(),
          onClick: handleSave,
          disabled: isLoading || !hasChanges
        }}
        negativeButton={{
          text: strings.cancel(),
          onClick: () => onClose(false)
        }}
      >
        <Flex
          sx={{
            flexDirection: "column",
            gap: "spacing7",
            mt: "spacing7",
            mb: "spacing7"
          }}
        >
          <KeyField
            label={strings.publicKeyLabel()}
            id="publicKey"
            value={publicKey}
            onChange={setPublicKey}
            placeholder={strings.enterPgpPublicKey()}
            disabled={isLoading}
          />
          <KeyField
            label={strings.privateKeyLabel()}
            id="privateKey"
            value={privateKey}
            onChange={setPrivateKey}
            placeholder={strings.enterPgpPrivateKey()}
            disabled={isLoading}
          />
        </Flex>
      </Dialog>
    );
  }
);

function KeyField(props: {
  label: string;
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  disabled: boolean;
}) {
  const { label, id, value, onChange, placeholder, disabled } = props;
  return (
    <Field
      label={label}
      id={id}
      name={id}
      as="textarea"
      required
      value={value}
      onChange={(e) => onChange(e.target.value)}
      styles={{
        input: {
          px: "spacing4",
          py: "spacing6",
          fontSize: "sm",
          lineHeight: 1.2,
          minHeight: "100px",
          height: value ? "165px" : "100px",
          resize: "vertical",
          "::placeholder": { fontSize: "xs", color: "paragraph-secondary" }
        }
      }}
      placeholder={placeholder}
      disabled={disabled}
    />
  );
}

function KeyOption(props: {
  icon: Icon;
  iconSize: number;
  title: string;
  description: string;
  selected?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  const { icon: OptionIcon, iconSize, title, description, selected } = props;
  return (
    <Flex
      {...buttonProps(props.onClick, props.disabled)}
      sx={{
        alignItems: "center",
        gap: "spacing3",
        px: "spacing3",
        py: "spacing4",
        bg: selected ? "background-selected" : "background",
        border: "1px solid",
        borderColor: selected ? "transparent" : "border",
        borderRadius: "radius2",
        cursor: props.disabled ? "default" : "pointer",
        ":hover:not([aria-disabled=true])": {
          bg: "hover",
          borderColor: "transparent",
          ".option-icon": { bg: "hover-secondary" }
        }
      }}
    >
      <IconBox
        className="option-icon"
        sx={selected ? { bg: "background" } : undefined}
      >
        <OptionIcon size={iconSize} />
      </IconBox>
      <Flex sx={{ flexDirection: "column", gap: "spacing3", flex: 1 }}>
        <Text
          sx={{
            fontSize: "sm",
            fontWeight: 500,
            lineHeight: 1,
            color: "heading"
          }}
        >
          {title}
        </Text>
        <Text sx={{ fontSize: "xs", lineHeight: 1, color: "paragraph" }}>
          {description}
        </Text>
      </Flex>
    </Flex>
  );
}
