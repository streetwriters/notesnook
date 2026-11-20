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

import { SettingsCard, buttonProps } from "../../../components/settings-ui";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Button, Flex, Text } from "@theme-ui/components";
import { InboxApiKey } from "@notesnook/core";
import { db } from "../../../common/db";
import { showToast } from "../../../utils/toast";
import {
  Loading,
  Copy,
  TrashSimple,
  CheckIcon,
  CaretDownOutline,
  PasswordInvisible,
  PasswordVisible
} from "../../../components/icons";
import Field from "../../../components/field";
import { BaseDialogProps, DialogManager } from "../../../common/dialog-manager";
import Dialog from "../../../components/dialog";
import { getFormattedDate } from "@notesnook/common";
import { ConfirmDialog } from "../../confirm";
import { confirmAccountPassword } from "../../password-dialog";
import { useCopyToClipboard } from "../../../hooks/use-copy-to-clipboard";
import { strings } from "@notesnook/intl";
import { Select } from "../../../components/select";

type InboxApiKeysState = {
  status: "pending" | "fulfilled" | "rejected";
  keys: InboxApiKey[];
};

// The rows card (in inbox-settings.ts) needs to know whether there are any
// keys, so the list lives in a tiny shared store instead of component state.
let apiKeysState: InboxApiKeysState = { status: "pending", keys: [] };
const apiKeysListeners = new Set<(state: InboxApiKeysState) => void>();

function setApiKeysState(state: InboxApiKeysState) {
  apiKeysState = state;
  apiKeysListeners.forEach((listener) => listener(state));
}

export const inboxApiKeysStore = {
  getState: () => apiKeysState,
  getKeys: () => apiKeysState.keys,
  subscribe(listener: (state: InboxApiKeysState) => void) {
    apiKeysListeners.add(listener);
    return () => {
      apiKeysListeners.delete(listener);
    };
  },
  async refresh(reset = false) {
    if (reset || apiKeysState.status !== "fulfilled")
      setApiKeysState({ status: "pending", keys: apiKeysState.keys });
    try {
      const keys = await db.inboxApiKeys.get();
      setApiKeysState({ status: "fulfilled", keys: keys || [] });
    } catch (error) {
      console.error("Failed to load inbox API keys:", error);
      setApiKeysState({ status: "rejected", keys: apiKeysState.keys });
    }
  }
};

export function createInboxApiKey() {
  if (inboxApiKeysStore.getKeys().length >= 10) {
    return ConfirmDialog.show({
      title: strings.apiKeysLimitReached(),
      subtitle: strings.apiKeysLimitReachedMessage(),
      positiveButtonText: strings.ok()
    });
  }
  return AddApiKeyDialog.show({
    onAdd: () => inboxApiKeysStore.refresh()
  });
}

function InboxApiKeysEmptyState() {
  return (
    <Flex
      sx={{
        flexDirection: "column",
        alignItems: "center",
        gap: "spacing4",
        pt: "spacing11",
        pb: "spacing8"
      }}
    >
      <Text
        sx={{
          fontSize: "sm",
          fontWeight: 600,
          lineHeight: "normal",
          color: "heading"
        }}
      >
        No API keys yet
      </Text>
      <Text
        sx={{
          fontSize: "xs",
          lineHeight: "normal",
          color: "paragraph-secondary"
        }}
      >
        {strings.createFirstApiKey()}
      </Text>
      <Button
        variant="new_accent"
        onClick={() => createInboxApiKey()}
        sx={{
          px: "spacing6",
          py: "8px",
          fontSize: "xs",
          lineHeight: "16px",
          borderRadius: "radius1"
        }}
      >
        {strings.createApiKey()}
      </Button>
    </Flex>
  );
}

function InboxApiKeysLoadingState() {
  return (
    <Flex
      sx={{
        alignItems: "center",
        gap: "spacing4",
        height: "54px",
        px: "spacing5",
        pt: "spacing6"
      }}
    >
      <Loading size={15} />
      <Text sx={{ fontSize: "xs", lineHeight: 1, color: "paragraph" }}>
        {strings.loadingApiKeys()}
      </Text>
    </Flex>
  );
}

function InboxApiKeysErrorState() {
  return (
    <Flex
      sx={{
        alignItems: "center",
        gap: "spacing4",
        height: "54px",
        px: "spacing5",
        pt: "spacing6"
      }}
    >
      <Text sx={{ fontSize: "xs", lineHeight: 1, color: "paragraph-error" }}>
        {strings.failedToLoadApiKeys()}
      </Text>
      <Button
        variant="new_secondary"
        onClick={() => inboxApiKeysStore.refresh(true)}
      >
        {strings.retry()}
      </Button>
    </Flex>
  );
}

/** The "API Keys" card's content while the keys load, fail to load, or are empty. */
export function InboxApiKeysStatus() {
  const { status } = useSyncExternalStore(
    inboxApiKeysStore.subscribe,
    inboxApiKeysStore.getState
  );
  if (status === "pending") return <InboxApiKeysLoadingState />;
  if (status === "rejected") return <InboxApiKeysErrorState />;
  return <InboxApiKeysEmptyState />;
}

export function InboxApiKeyCards() {
  const { status, keys } = useSyncExternalStore(
    inboxApiKeysStore.subscribe,
    inboxApiKeysStore.getState
  );

  if (status !== "fulfilled" || keys.length === 0) return null;

  return (
    <Flex
      sx={{
        flexDirection: "column",
        mt: "-5px",
        gap: "spacing3"
      }}
    >
      {keys.map((key) => (
        <ApiKeyItem
          key={key.key}
          apiKey={key}
          onRevoke={() => inboxApiKeysStore.refresh()}
        />
      ))}
    </Flex>
  );
}

type ApiKeyItemProps = {
  apiKey: InboxApiKey;
  onRevoke: () => void;
};

const VIEW_KEY_TIMEOUT = 15;

function ApiKeyItem({ apiKey, onRevoke }: ApiKeyItemProps) {
  const { copied, copy } = useCopyToClipboard(1000);
  const [viewing, setViewing] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(VIEW_KEY_TIMEOUT);

  async function viewKey() {
    const result = await confirmAccountPassword(
      strings.authenticateToViewApiKey()
    );
    if (!result) return;

    setViewing(true);
  }

  async function copyToClipboard() {
    if (!viewing) return;
    if (!(await copy(apiKey.key)))
      showToast("error", strings.failedToCopyToClipboard());
  }

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
    <SettingsCard>
      <Flex sx={{ flexDirection: "column", gap: "spacing3" }}>
        <Text
          sx={{
            fontSize: "sm",
            fontWeight: 500,
            lineHeight: 1,
            color: "heading"
          }}
        >
          {apiKey.name}
        </Text>

        <Flex sx={{ flexDirection: "column", gap: "spacing2" }}>
          {[
            apiKey.lastUsedAt
              ? `${strings.lastUsedOn()} ${getFormattedDate(apiKey.lastUsedAt)}`
              : strings.neverUsed(),
            `${strings.createdOn()} ${getFormattedDate(apiKey.dateCreated)}`,
            apiKey.expiryDate === -1
              ? strings.neverExpires()
              : `${
                  isApiKeyExpired ? "Expired on" : strings.expiresOn()
                } ${getFormattedDate(apiKey.expiryDate)}`
          ].map((line, index, lines) => (
            <Text
              key={line}
              sx={{
                fontSize: "xs",
                lineHeight: 1,
                color:
                  isApiKeyExpired && index === lines.length - 1
                    ? "paragraph-error"
                    : "paragraph"
              }}
            >
              {line}
            </Text>
          ))}
        </Flex>
      </Flex>

      <Flex
        sx={{
          alignItems: "center",
          gap: "spacing4",
          mt: isApiKeyExpired ? 0 : "12px",
          mb: isApiKeyExpired ? 0 : "11px"
        }}
      >
        <Flex
          sx={{
            flex: 1,
            minWidth: 0,
            alignItems: "center",
            justifyContent: "space-between",
            gap: "spacing4",
            px: "spacing4",
            py: "14px",
            bg: "background-secondary",
            border: "1px solid",
            borderColor: viewing || isApiKeyExpired ? "accent" : "transparent",
            borderRadius: "radius2",
            opacity: isApiKeyExpired ? 0.5 : 1
          }}
        >
          <Text
            sx={{
              flex: 1,
              minWidth: 0,
              fontSize: "sm",
              lineHeight: 1,
              color: "paragraph",
              userSelect: "text",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap"
            }}
          >
            {viewing
              ? apiKey.key
              : `${apiKey.key.slice(0, 10)}${"*".repeat(
                  apiKey.key.length - 10
                )}`}
          </Text>
          <Flex
            {...buttonProps(
              viewing || isApiKeyExpired ? undefined : () => viewKey()
            )}
            sx={{
              width: 22,
              height: 22,
              my: "-3.5px",
              flexShrink: 0,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "radius1",
              cursor: viewing || isApiKeyExpired ? undefined : "pointer",
              ":hover": viewing || isApiKeyExpired ? undefined : { bg: "hover" }
            }}
          >
            {viewing ? (
              <PasswordInvisible size={15} />
            ) : (
              <PasswordVisible size={15} />
            )}
          </Flex>
        </Flex>

        <Flex sx={{ alignItems: "center", gap: "spacing3", flexShrink: 0 }}>
          {viewing && (
            <>
              <Text sx={{ fontSize: "xs", lineHeight: 1, color: "paragraph" }}>
                {secondsLeft}s
              </Text>
              <Button
                variant="secondary"
                onClick={() => copyToClipboard()}
                sx={{
                  width: 25,
                  height: 25,
                  p: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "radius1"
                }}
              >
                {copied ? <CheckIcon size={13} /> : <Copy size={13} />}
              </Button>
            </>
          )}
          <Button
            variant="primary"
            disabled={isRevoking}
            onClick={async () => {
              const ok = await ConfirmDialog.show({
                title: strings.revokeInboxApiKey(apiKey.name),
                subtitle: strings.revokeApiKeyConfirmation(apiKey.name),
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
            sx={{
              width: 25,
              height: 25,
              p: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bg: "hover",
              borderRadius: "radius1"
            }}
          >
            <TrashSimple size={13} color="icon-error" />
          </Button>
        </Flex>
      </Flex>
    </SettingsCard>
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
  const [selectedExpiry, setSelectedExpiry] = useState(
    getExpiryOptions()[2].value
  );

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
      <Flex
        sx={{
          flexDirection: "column",
          gap: "spacing4",
          mt: "spacing6",
          mb: "spacing7"
        }}
      >
        <Field
          inputRef={inputRef}
          autoFocus
          label={strings.keyName()}
          placeholder={strings.exampleKeyName()}
          sx={{
            input: { fontSize: "xs", px: "spacing4", py: "spacing6" }
          }}
          onKeyUp={async (e) => {
            if (e.key === "Enter") {
              await onSubmit();
            }
          }}
          required
        />
        <Flex sx={{ flexDirection: "column", gap: "spacing4" }}>
          <Text
            sx={{
              fontSize: "xs",
              lineHeight: 1.2,
              color: "paragraph-secondary"
            }}
          >
            {strings.expiresIn()}
          </Text>
          <Select
            variant="filled"
            value={String(selectedExpiry)}
            options={getExpiryOptions().map((o) => ({
              value: String(o.value),
              title: o.label
            }))}
            onChange={(value) => setSelectedExpiry(Number(value))}
            icon={CaretDownOutline}
            menuPosition={{ align: "start", yOffset: 5 }}
          />
        </Flex>
      </Flex>
    </Dialog>
  );
});
