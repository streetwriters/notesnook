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

import { useRef, useState, useEffect } from "react";
import { Box, Button, Flex, Input, Text, Select } from "@theme-ui/components";
import { formatDate, InboxApiKey } from "@notesnook/core";
import { db } from "../../../common/db";
import { showToast } from "../../../utils/toast";
import {
  Loading,
  Copy,
  Trash,
  Check,
  PasswordInvisible
} from "../../../components/icons";
import Field from "../../../components/field";
import { BaseDialogProps, DialogManager } from "../../../common/dialog-manager";
import Dialog from "../../../components/dialog";
import { usePromise } from "@notesnook/common";
import { ConfirmDialog } from "../../confirm";
import { PromptDialog } from "../../prompt";
import { showPasswordDialog } from "../../password-dialog";
import { strings } from "@notesnook/intl";

export function InboxApiKeys() {
  const apiKeysPromise = usePromise(() => db.inboxApiKeys.get(), []);

  if (apiKeysPromise.status === "pending") {
    return (
      <Flex sx={{ alignItems: "center", gap: 2, py: 3 }}>
        <Loading size={16} />
        <Text variant="body">Loading API keys...</Text>
      </Flex>
    );
  }

  if (apiKeysPromise.status === "rejected") {
    return (
      <Flex sx={{ alignItems: "center", gap: 2, py: 3 }}>
        <Text variant="body" sx={{ color: "error" }}>
          Failed to load API keys. Please try again.
        </Text>
        <Button onClick={() => apiKeysPromise.refresh()}>Retry</Button>
      </Flex>
    );
  }

  const apiKeys = apiKeysPromise.value || [];

  return (
    <Box>
      <Flex sx={{ flexDirection: "column", gap: 3 }}>
        <Flex sx={{ justifyContent: "space-between", alignItems: "center" }}>
          <Text variant="body" sx={{ fontWeight: "bold" }}>
            API Keys
          </Text>
          <Button
            variant="accent"
            onClick={() => {
              if (apiKeys.length >= 10) {
                PromptDialog.show({
                  title: "API Keys Limit Reached",
                  description:
                    "Cannot create more than 10 api keys at a time. Please revoke some existing keys before creating new ones."
                });
              } else {
                AddApiKeyDialog.show({
                  onAdd: () => apiKeysPromise.refresh()
                });
              }
            }}
          >
            Create Key
          </Button>
        </Flex>

        {apiKeys.length === 0 ? (
          <Box
            sx={{
              p: 4,
              textAlign: "center",
              border: "1px dashed",
              borderColor: "border",
              borderRadius: "default",
              bg: "background-secondary"
            }}
          >
            <Text variant="body" sx={{ color: "paragraph-secondary" }}>
              Create your first api key to get started.
            </Text>
          </Box>
        ) : (
          <Box>
            {apiKeys.map((key, i) => (
              <ApiKeyItem
                key={key.key}
                apiKey={key}
                onRevoke={() => apiKeysPromise.refresh()}
                isAtEnd={i === apiKeys.length - 1}
              />
            ))}
          </Box>
        )}
      </Flex>
    </Box>
  );
}

type ApiKeyItemProps = {
  apiKey: InboxApiKey;
  onRevoke: () => void;
  isAtEnd: boolean;
};

const VIEW_KEY_TIMEOUT = 15;

function ApiKeyItem({ apiKey, onRevoke, isAtEnd }: ApiKeyItemProps) {
  const [copied, setCopied] = useState(false);
  const [viewing, setViewing] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(VIEW_KEY_TIMEOUT);

  async function viewKey() {
    const result = await showPasswordDialog({
      title: "Authenticate to view API key",
      inputs: {
        password: {
          label: strings.accountPassword(),
          autoComplete: "current-password"
        }
      },
      validate: ({ password }) => {
        return db.user.verifyPassword(password);
      }
    });
    if (!result) return;

    setViewing(true);
  }

  async function copyToClipboard() {
    if (!viewing) return;
    try {
      await navigator.clipboard.writeText(apiKey.key);
      setCopied(true);
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
      showToast("error", "Failed to copy to clipboard");
    }
  }

  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => {
        setCopied(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  useEffect(() => {
    if (viewing) {
      setSecondsLeft(VIEW_KEY_TIMEOUT);
      const interval = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            setViewing(false);
            return VIEW_KEY_TIMEOUT;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [viewing]);

  const isApiKeyExpired = Date.now() > apiKey.expiryDate;

  return (
    <Box
      sx={{
        px: 1,
        py: 2,
        borderBottom: isAtEnd ? "" : "1px solid",
        borderColor: "border"
      }}
    >
      <Flex
        sx={{
          justifyContent: "space-between",
          alignItems: "center"
        }}
      >
        <Box sx={{ flex: 1 }}>
          <Flex sx={{ alignItems: "center", gap: 2, mb: 2 }}>
            <Text variant="body" sx={{ fontWeight: "bold" }}>
              {apiKey.name}
            </Text>
            {isApiKeyExpired && (
              <Text
                variant="subBody"
                sx={{
                  py: 0.8,
                  px: 1,
                  bg: "accent-error",
                  color: "background",
                  fontWeight: "bold",
                  borderRadius: "default"
                }}
              >
                EXPIRED
              </Text>
            )}
          </Flex>

          <Flex sx={{ mb: 1, flexDirection: "column" }}>
            <Text variant="subBody" sx={{ color: "paragraph-secondary" }}>
              {apiKey.lastUsedAt
                ? `Last used on ${formatDate(apiKey.lastUsedAt)}`
                : "Never used"}
            </Text>
            <Text variant="subBody" sx={{ color: "paragraph-secondary" }}>
              Created on {formatDate(apiKey.dateCreated)}
            </Text>
            <Text variant="subBody" sx={{ color: "paragraph-secondary" }}>
              {apiKey.expiryDate === -1
                ? "Never expires"
                : `${isApiKeyExpired ? "Expired" : "Expires"} on
              ${formatDate(apiKey.expiryDate)}`}
            </Text>
          </Flex>
        </Box>
        <Input
          readOnly
          value={
            viewing
              ? apiKey.key
              : `${apiKey.key.slice(0, 10)}${"*".repeat(
                  apiKey.key.length - 10
                )}`
          }
          sx={{
            paddingY: 1,
            paddingX: 2,
            fontFamily: "monospace",
            flex: 1,
            bg: "background-secondary"
          }}
        />
        {!viewing && (
          <Button variant="icon" onClick={() => viewKey()}>
            <PasswordInvisible size={14} />
          </Button>
        )}
        {viewing && (
          <>
            <Text
              variant="body"
              sx={{
                color: "accent",
                fontFamily: "monospace",
                width: "30px",
                textAlign: "center"
              }}
            >
              {secondsLeft}s
            </Text>
            <Button variant="icon" onClick={() => copyToClipboard()}>
              {copied ? <Check size={14} /> : <Copy size={14} />}
            </Button>
          </>
        )}
        <Button
          variant="icon"
          disabled={isRevoking}
          onClick={async () => {
            const ok = await ConfirmDialog.show({
              title: `Revoke Inbox API Key - ${apiKey.name}`,
              message: `Are you sure you want to revoke the key "${apiKey.name}"? All inbox actions using this key will stop working immediately.`,
              positiveButtonText: "Revoke",
              negativeButtonText: "Cancel"
            });
            if (!ok) return;

            try {
              setIsRevoking(true);
              await db.inboxApiKeys.revoke(apiKey.key);
              onRevoke();
              showToast("success", "API key revoked");
            } catch (error) {
              console.error("Failed to revoke inbox API key:", error);
              showToast("error", "Failed to revoke API key");
            } finally {
              setIsRevoking(false);
            }
          }}
        >
          <Trash size={16} color="accent-error" />
        </Button>
      </Flex>
    </Box>
  );
}

type AddApiKeyDialogProps = BaseDialogProps<boolean> & {
  onAdd: () => void;
};

const EXPIRY_OPTIONS = [
  { label: "1 day", value: 24 * 60 * 60 * 1000 },
  { label: "1 week", value: 7 * 24 * 60 * 60 * 1000 },
  { label: "1 month", value: 30 * 24 * 60 * 60 * 1000 },
  { label: "1 year", value: 365 * 24 * 60 * 60 * 1000 },
  { label: "Never", value: -1 }
];

const AddApiKeyDialog = DialogManager.register(function AddApiKeyDialog(
  props: AddApiKeyDialogProps
) {
  const { onClose, onAdd } = props;
  const inputRef = useRef<HTMLInputElement>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedExpiry, setSelectedExpiry] = useState(EXPIRY_OPTIONS[2].value);

  async function onSubmit() {
    try {
      setIsCreating(true);
      if (!inputRef.current || !inputRef.current.value.trim()) {
        showToast("error", "Please enter a key name");
        return;
      }
      await db.inboxApiKeys.create(inputRef.current.value, selectedExpiry);
      onAdd();
      onClose(true);
    } catch (error) {
      console.error("Failed to create inbox API key:", error);
      const message = error instanceof Error ? error.message : "";
      showToast(
        "error",
        `Failed to create API key${message ? `: ${message}` : ""}`
      );
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <Dialog
      isOpen={true}
      title="Create Inbox API Key"
      description="The API key allows you to access NN's inbox functionality."
      onClose={() => onClose(false)}
      positiveButton={{
        text: isCreating ? "Creating..." : "Create",
        onClick: onSubmit,
        disabled: isCreating
      }}
      negativeButton={{
        text: "Cancel",
        onClick: () => onClose(false)
      }}
    >
      <Flex sx={{ flexDirection: "column", gap: 2 }}>
        <Field
          inputRef={inputRef}
          autoFocus
          label="Key name"
          placeholder="e.g., Todo integration"
          onKeyUp={async (e) => {
            if (e.key === "Enter") {
              await onSubmit();
            }
          }}
          required
        />
        <Flex sx={{ flexDirection: "column" }}>
          <Text variant="subtitle" sx={{ mb: 2, fontWeight: "bold" }}>
            Expires in
          </Text>
          <Select
            value={String(selectedExpiry)}
            onChange={(e) => {
              const value = e.target.value;
              setSelectedExpiry(Number(value));
            }}
            sx={{
              bg: "background-secondary",
              border: "1px solid",
              borderColor: "border",
              padding: "5px"
            }}
          >
            {EXPIRY_OPTIONS.map((option) => (
              <option key={option.label} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </Flex>
      </Flex>
    </Dialog>
  );
});
