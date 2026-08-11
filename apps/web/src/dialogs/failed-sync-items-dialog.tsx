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
import { getFormattedDate, usePromise } from "@notesnook/common";
import { FailedSyncItem } from "@notesnook/core";
import { SerializedKey } from "@notesnook/crypto";
import { Box, Button, Flex, Text } from "@theme-ui/components";
import { db } from "../common/db";
import { BaseDialogProps, DialogManager } from "../common/dialog-manager";
import Dialog from "../components/dialog";
import { FlexScrollContainer } from "../components/scroll-container";
import { strings } from "@notesnook/intl";
import { showToast } from "../utils/toast";
import { ConfirmDialog } from "./confirm";
import { showPasswordDialog } from "./password-dialog";

type FailedSyncItemsDialogProps = BaseDialogProps<boolean>;

const COLUMNS = [
  { title: strings.dateSynced(), width: "150px" },
  { title: strings.dataTypesCamelCase.item(), width: "110px" },
  { title: strings.itemId(), width: "140px" },
  // { title: strings.keyVersion(), width: "90px" },
  { title: strings.error(), width: "1fr" }
];

function TypeBadge({ type }: { type: string }) {
  return (
    <Text
      sx={{
        bg: "background-secondary",
        color: "paragraph",
        borderRadius: "default",
        px: "6px",
        py: "2px",
        fontSize: "0.65em",
        fontWeight: 600,
        textTransform: "uppercase",
        whiteSpace: "nowrap"
      }}
    >
      {type}
    </Text>
  );
}

async function resolveKey(input: {
  password?: string;
  key?: string;
}): Promise<SerializedKey> {
  const user = await db.user.getUser();
  if (!user?.salt) throw new Error("User salt not found. Please relogin.");

  if (input.key) {
    return { key: input.key, salt: user.salt };
  }

  if (!input.password) throw new Error("Password or encryption key required.");

  try {
    return await db.storage().generateCryptoKey(input.password, user.salt);
  } catch {
    return await db
      .storage()
      .generateCryptoKeyFallback(input.password, user.salt);
  }
}

async function retryWithKey(
  ids: string[],
  key: SerializedKey
): Promise<boolean> {
  const result = await db.syncer.sync.retryFailedItems(ids, key);
  if (result.succeeded.length > 0 && result.failed.length === 0) {
    showToast("success", strings.decryptionSucceeded(result.succeeded.length));
    return true;
  }
  if (result.succeeded.length > 0 && result.failed.length > 0) {
    showToast(
      "error",
      strings.decryptionPartialSuccess(
        result.succeeded.length,
        result.failed.length
      )
    );
    // Still close the password dialog so the table can refresh.
    return true;
  }
  const firstError = result.failed[0]?.error;
  throw new Error(
    firstError
      ? `${strings.decryptionFailed()}: ${firstError}`
      : strings.decryptionFailed()
  );
}

export const FailedSyncItemsDialog = DialogManager.register(
  function FailedSyncItemsDialog(props: FailedSyncItemsDialogProps) {
    const result = usePromise(() => db.failedSyncItems.all.items());
    const [busyIds, setBusyIds] = useState<string[]>([]);

    function refresh() {
      if (result.status !== "pending") result.refresh();
    }

    async function deleteAll() {
      const ok = await ConfirmDialog.show({
        title: strings.deleteAll(),
        subtitle: strings.deleteAllFailedSyncItemsDesc(),
        positiveButtonText: strings.yes(),
        negativeButtonText: strings.no()
      });
      if (!ok) return;

      await db.failedSyncItems.clear();
      showToast("success", strings.allItemsDeleted());
      refresh();
    }

    async function retryWithCurrentKeys(ids: string[]) {
      setBusyIds((prev) => [...prev, ...ids]);
      try {
        const keys = await db.user.getDataEncryptionKeys();
        if (!keys?.length) {
          showToast("error", strings.decryptionFailed());
          return;
        }

        let succeeded = 0;
        let remaining = [...ids];
        for (const keyInfo of keys) {
          if (remaining.length === 0) break;
          const result = await db.syncer.sync.retryFailedItems(
            remaining,
            keyInfo.key
          );
          succeeded += result.succeeded.length;
          remaining = result.failed.map((f) => f.id);
        }

        if (succeeded > 0 && remaining.length === 0) {
          showToast("success", strings.decryptionSucceeded(succeeded));
        } else if (succeeded > 0) {
          showToast(
            "error",
            strings.decryptionPartialSuccess(succeeded, remaining.length)
          );
        } else {
          showToast("error", strings.decryptionFailed());
        }
        refresh();
      } finally {
        setBusyIds((prev) => prev.filter((id) => !ids.includes(id)));
      }
    }

    async function retryWithCustomKey(ids: string[]) {
      const ok = await showPasswordDialog({
        title: strings.retryWithCustomKey(),
        inputs: {
          key: {
            label: strings.encryptionKey(),
            type: "password",
            required: true
          }
        },
        async validate({ key }) {
          if (!key) return false;
          setBusyIds((prev) => [...prev, ...ids]);
          try {
            const resolved = await resolveKey({ key });
            return await retryWithKey(ids, resolved);
          } finally {
            setBusyIds((prev) => prev.filter((id) => !ids.includes(id)));
          }
        }
      });
      if (ok) refresh();
    }

    const items: FailedSyncItem[] =
      result.status === "fulfilled" ? result.value : [];
    const allIds = items.map((item) => item.id);
    const hasItems = items.length > 0;

    return (
      <Dialog
        isOpen={true}
        title={strings.failedSyncItems()}
        description={strings.failedSyncItemsDesc()}
        titleAction={
          hasItems ? (
            <Flex sx={{ gap: 1 }}>
              <Button
                variant="secondary"
                onClick={() => retryWithCurrentKeys(allIds)}
                disabled={busyIds.length > 0}
              >
                {strings.retryWithCurrentKeys()}
              </Button>
              <Button
                variant="secondary"
                onClick={() => retryWithCustomKey(allIds)}
                disabled={busyIds.length > 0}
              >
                {strings.retryWithCustomKey()}
              </Button>
              <Button variant="errorSecondary" onClick={deleteAll}>
                {strings.deleteAll()}
              </Button>
            </Flex>
          ) : undefined
        }
        onClose={() => props.onClose(false)}
        negativeButton={{
          text: strings.close(),
          onClick: () => props.onClose(false)
        }}
        noScroll
        width="900px"
      >
        {result.status === "pending" ? (
          <Text sx={{ p: 3 }} variant="body">
            {strings.loading()}
          </Text>
        ) : result.status === "rejected" ? (
          <Text sx={{ p: 3 }} variant="body">
            {strings.failed()}
          </Text>
        ) : !hasItems ? (
          <Text sx={{ p: 3 }} variant="body">
            {strings.noFailedSyncItems()}
          </Text>
        ) : (
          <FlexScrollContainer style={{ maxHeight: "70vh" }}>
            <Box sx={{ p: 2 }}>
              <Box
                as="table"
                sx={{
                  width: "100%",
                  borderCollapse: "collapse",
                  tableLayout: "fixed",
                  "th, td": {
                    px: 2,
                    py: 1,
                    textAlign: "left",
                    verticalAlign: "top",
                    borderBottom: "1px solid var(--separator)"
                  }
                }}
              >
                <Box as="thead">
                  <Box as="tr">
                    {COLUMNS.map((col) => (
                      <Box
                        key={col.title || "actions"}
                        as="th"
                        sx={{ width: col.width, whiteSpace: "nowrap" }}
                      >
                        <Text variant="subtitle">{col.title}</Text>
                      </Box>
                    ))}
                  </Box>
                </Box>
                <Box as="tbody">
                  {items.map((item) => {
                    const isBusy = busyIds.includes(item.id);
                    const errors = item.errors ?? [];
                    return (
                      <Box as="tr" key={item.id}>
                        <Box as="td">
                          <Text variant="body" sx={{ whiteSpace: "nowrap" }}>
                            {getFormattedDate(item.dateSynced)}
                          </Text>
                        </Box>
                        <Box as="td">
                          <TypeBadge type={item.itemType} />
                        </Box>
                        <Box as="td">
                          <Text
                            variant="body"
                            className="selectable"
                            sx={{
                              fontFamily: "monospace",
                              fontSize: "0.8em",
                              wordBreak: "break-all"
                            }}
                            title={item.itemId}
                          >
                            {item.itemId}
                          </Text>
                        </Box>
                        <Box as="td">
                          {errors.length > 0 ? (
                            <Box
                              as="pre"
                              className="selectable"
                              sx={{
                                color: "paragraph",
                                m: 0,
                                fontSize: "0.72em",
                                whiteSpace: "pre-wrap",
                                wordBreak: "break-all"
                              }}
                            >
                              {errors.join("\n")}
                            </Box>
                          ) : (
                            <Text
                              variant="body"
                              sx={{ color: "paragraph-secondary" }}
                            >
                              —
                            </Text>
                          )}
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              </Box>
            </Box>
          </FlexScrollContainer>
        )}
      </Dialog>
    );
  }
);
