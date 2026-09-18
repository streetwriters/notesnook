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
import { InboxApiKey } from "@notesnook/core";
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
import { getFormattedDate, usePromise } from "@notesnook/common";
import { ConfirmDialog } from "../../confirm";
import { showPasswordDialog } from "../../password-dialog";
import { strings } from "@notesnook/intl";

export function InboxApiKeys() {
  const apiKeysPromise = usePromise(() => db.inboxApiKeys.get(), []);

  if (apiKeysPromise.status === "pending") {
    return (
      <Flex sx={{ alignItems: "center", gap: 2, py: 3 }}>
        <Loading size={16} />
        <Text variant="body">{strings.loadingApiKeys()}</Text>
      </Flex>
    );
  }

  if (apiKeysPromise.status === "rejected") {
    return (
      <Flex sx={{ alignItems: "center", gap: 2, py: 3 }}>
        <Text variant="body" sx={{ color: "error" }}>
          {strings.failedToLoadApiKeys()}
        </Text>
        <Button onClick={() => apiKeysPromise.refresh()}>{strings.retry()}</Button>
      </Flex>
    );
  }

  const apiKeys = apiKeysPromise.value || [];

  return (
    <Box>
      <Flex sx={{ flexDirection: "column", gap: 3 }}>
        <Flex sx={{ justifyContent: "space-between", alignItems: "center" }}>
          <Text variant="body" sx={{ fontWeight: "bold" }}>
            {strings.viewAPIKeys()}
          </Text>
          <Button
            variant="accent"
            onClick={() => {
              if (apiKeys.length >= 10) {
                ConfirmDialog.show({
                  title: strings.apiKeysLimitReached(),
                  subtitle: strings.apiKeysLimitReachedMessage(),
                  positiveButtonText: strings.ok()
                });
              } else {
                AddApiKeyDialog.show({
                  onAdd: () => apiKeysPromise.refresh()
                });
              }
            }}
          >
            {strings.createKey()}
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
              {strings.createFirstApiKey()}
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
      title: strings.authenticateToViewApiKey(),
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
      showToast("error", strings.failedToCopyToClipboard());
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

  const isApiKeyExpired =
    apiKey.expiryDate === -1 ? false : Date.now() > apiKey.expiryDate;

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
                {strings.expired().toUpperCase()}
              </Text>
            )}
          </Flex>

          <Flex sx={{ mb: 1, flexDirection: "column" }}>
            <Text variant="subBody" sx={{ color: "paragraph-secondary" }}>
              {apiKey.lastUsedAt
                ? `${strings.lastUsedOn()} ${getFormattedDate(apiKey.lastUsedAt)}`
                : strings.neverUsed()}
            </Text>
            <Text variant="subBody" sx={{ color: "paragraph-secondary" }}>
              {strings.createdOn()} {getFormattedDate(apiKey.dateCreated)}
            </Text>
            <Text variant="subBody" sx={{ color: "paragraph-secondary" }}>
              {apiKey.expiryDate === -1
                ? strings.neverExpires()
                : `${isApiKeyExpired ? strings.expired() : strings.expiresOn()} ${getFormattedDate(apiKey.expiryDate)}`}
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
              title: strings.revokeInboxApiKey(apiKey.name),
              message: strings.revokeApiKeyConfirmation(apiKey.name),
              positiveButtonText: strings.revoke(),
              negativeButtonText: strings.cancel()
            });
            if (!ok) return;

            try {
              setIsRevoking(true);
              await db.inboxApiKeys.revoke(apiKey.key);
              onRevoke();
              showToast("success", strings.apiKeyRevoked());
            } catch (error) {
              console.error("Failed to revoke inbox API key:", error);
              showToast("error", strings.failedToRevokeApiKey());
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

const getExpiryOptions = () => [
  { label: strings.expiryOneDay(), value: 24 * 60 * 60 * 1000 },
  { label: strings.expiryOneWeek(), value: 7 * 24 * 60 * 60 * 1000 },
  { label: strings.expiryOneMonth(), value: 30 * 24 * 60 * 60 * 1000 },
  { label: strings.expiryOneYear(), value: 365 * 24 * 60 * 60 * 1000 },
  { label: strings.never(), value: -1 }
];

const AddApiKeyDialog = DialogManager.register(function AddApiKeyDialog(
  props: AddApiKeyDialogProps
) {
  const { onClose, onAdd } = props;
  const inputRef = useRef<HTMLInputElement>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedExpiry, setSelectedExpiry] = useState(getExpiryOptions()[2].value);

  async function onSubmit() {
    try {
      setIsCreating(true);
      if (!inputRef.current || !inputRef.current.value.trim()) {
        showToast("error", strings.enterKeyName());
        return;
      }
      await db.inboxApiKeys.create(inputRef.current.value, selectedExpiry);
      onAdd();
      onClose(true);
    } catch (error) {
      console.error("Failed to create inbox API key:", error);
      const message = error instanceof Error ? error.message : "";
      showToast("error", strings.failedToCreateApiKey(message));
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <Dialog
      isOpen={true}
      title={strings.createApiKey()}
      description={strings.createInboxApiKeyDescription()}
      onClose={() => onClose(false)}
      positiveButton={{
        text: isCreating ? strings.creating() : strings.createKey(),
        onClick: onSubmit,
        disabled: isCreating
      }}
      negativeButton={{
        text: strings.cancel(),
        onClick: () => onClose(false)
      }}
    >
      <Flex sx={{ flexDirection: "column", gap: 2 }}>
        <Field
          inputRef={inputRef}
          autoFocus
          label={strings.keyName()}
          placeholder={strings.exampleKeyName()}
          onKeyUp={async (e) => {
            if (e.key === "Enter") {
              await onSubmit();
            }
          }}
          required
        />
        <Flex sx={{ flexDirection: "column" }}>
          <Text variant="subtitle" sx={{ mb: 2, fontWeight: "bold" }}>
            {strings.expiresIn()}
          </Text>
          <Select
            value={String(selectedExpiry)}
            onChange={(e) => {
              const value = e.target.value;
              setSelectedExpiry(Number(value));
            }}
            sx={{
              color: "var(--paragraph)",
              bg: "background-secondary",
              border: "1px solid",
              borderColor: "border",
              padding: "5px",
              "& + svg": {
                fill: "var(--paragraph)"
              }
            }}
          >
            {getExpiryOptions().map((option) => (
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
