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

import { buttonProps } from "../components/settings-ui";
import { Fragment, useState } from "react";
import { getFormattedDate, usePromise } from "@notesnook/common";
import { InboxItemsHistoryErrorContext } from "@notesnook/core";
import { Box, Button, Flex, Text } from "@theme-ui/components";
import { db } from "../common/db";
import { BaseDialogProps, DialogManager } from "../common/dialog-manager";
import Dialog from "../components/dialog";
import {
  CaretDownOutline,
  CaretUp,
  CheckIcon,
  Copy,
  TrashSimple
} from "../components/icons";
import { useCopyToClipboard } from "../hooks/use-copy-to-clipboard";
import { strings } from "@notesnook/intl";
import { showToast } from "../utils/toast";
import { ConfirmDialog } from "./confirm";

type InboxHistoryDialogProps = BaseDialogProps<boolean>;

const ERROR_CHIP_STYLES: Record<string, { bg: string; color: string }> = {
  get [strings.decryptionFailed()]() {
    return { bg: "background-error", color: "paragraph-error" };
  },
  get [strings.invalidJson()]() {
    return { bg: "rgba(255, 152, 0, 0.15)", color: "#e65100" };
  },
  get [strings.validationFailed()]() {
    return { bg: "rgba(255, 193, 7, 0.15)", color: "#8a6000" };
  },
  "Decryption failed": { bg: "background-error", color: "paragraph-error" },
  "Invalid JSON": { bg: "rgba(255, 152, 0, 0.15)", color: "#e65100" },
  "Validation failed": { bg: "rgba(255, 193, 7, 0.15)", color: "#8a6000" }
};

function ErrorBadge({
  message
}: {
  message: InboxItemsHistoryErrorContext["message"] | undefined;
}) {
  if (!message) return null;

  const style = ERROR_CHIP_STYLES[message] ?? {
    bg: "background-error",
    color: "paragraph-error"
  };

  return (
    <Text
      sx={{
        bg: style.bg,
        color: style.color,
        borderRadius: "26px",
        px: "spacing3",
        py: "spacing2",
        fontSize: "3xs",
        fontWeight: 500,
        lineHeight: 1,
        whiteSpace: "nowrap"
      }}
    >
      {message}
    </Text>
  );
}

function parseErrorContext(
  raw: string | undefined
): InboxItemsHistoryErrorContext | null {
  if (!raw) return null;

  try {
    return JSON.parse(raw) as InboxItemsHistoryErrorContext;
  } catch {
    return null;
  }
}

type FailedItemProps = {
  id: string;
  dateSynced: number;
  title: string;
  message: InboxItemsHistoryErrorContext["message"] | undefined;
  sections: DetailSection[];
  copyText: string;
  expanded: boolean;
  onToggle: () => void;
  onDelete: () => void;
};

type DetailSection = {
  heading: string;
  rows?: [string, string][];
  text?: string;
};

function stringifyValue(value: unknown) {
  return typeof value === "string" || typeof value === "number"
    ? String(value)
    : JSON.stringify(value);
}

function toSection(heading: string, value: unknown): DetailSection {
  if (typeof value === "string") return { heading, text: value };
  if (value && typeof value === "object" && !Array.isArray(value))
    return {
      heading,
      rows: Object.entries(value).map(([k, v]) => [k, stringifyValue(v)])
    };
  return { heading, text: JSON.stringify(value) };
}

function getDetailSections(rest: Record<string, unknown>): DetailSection[] {
  return Object.entries(rest).map(([key, value]) => {
    if (key === "inboxItem") return toSection("Inbox item", value);
    if (key === "parsedItem") return toSection("Parsed item", value);
    if (key === "decryptedItem") return toSection("Decrypted item", value);
    return toSection(key, value);
  });
}

function DetailsBox(props: { sections: DetailSection[]; copyText: string }) {
  const { copied, copy } = useCopyToClipboard(1000);
  return (
    <Flex
      sx={{
        position: "relative",
        flexDirection: "column",
        gap: "spacing4",
        bg: "background",
        borderRadius: "radius2",
        p: "spacing4",
        ":hover .copy-details, :focus-within .copy-details": { opacity: 1 }
      }}
    >
      <Button
        className="copy-details"
        variant="icon"
        title={strings.copy()}
        onClick={() => copy(props.copyText)}
        sx={{
          position: "absolute",
          top: "spacing3",
          right: "spacing3",
          p: "2px",
          opacity: 0,
          ":focus-visible": { opacity: 1 }
        }}
      >
        {copied ? <CheckIcon size={13} /> : <Copy size={13} />}
      </Button>
      {props.sections.map((section) => (
        <Flex
          key={section.heading}
          sx={{ flexDirection: "column", gap: "spacing4" }}
        >
          <Text
            sx={{
              fontSize: "xs",
              fontWeight: 500,
              lineHeight: 1,
              color: "heading"
            }}
          >
            {section.heading}
          </Text>
          {section.rows ? (
            <Flex sx={{ flexDirection: "column", gap: "spacing1" }}>
              {section.rows.map(([key, value]) => (
                <Flex
                  key={key}
                  sx={{ gap: "spacing7", alignItems: "flex-start" }}
                >
                  <Text
                    sx={{
                      width: "25px",
                      flexShrink: 0,
                      fontSize: "xs",
                      fontWeight: 400,
                      lineHeight: 1.3,
                      color: "paragraph"
                    }}
                  >
                    {key}
                  </Text>
                  <Text
                    sx={{
                      fontSize: "xs",
                      fontWeight: 400,
                      lineHeight: 1.3,
                      color: "paragraph",
                      userSelect: "text",
                      overflowWrap: "anywhere"
                    }}
                  >
                    {value}
                  </Text>
                </Flex>
              ))}
            </Flex>
          ) : (
            <Text
              sx={{
                fontSize: "xs",
                lineHeight: 1.3,
                color: "paragraph",
                userSelect: "text",
                whiteSpace: "pre-wrap",
                overflowWrap: "anywhere"
              }}
            >
              {section.text}
            </Text>
          )}
        </Flex>
      ))}
    </Flex>
  );
}

function FailedItem(props: FailedItemProps) {
  const { title, message, sections, copyText, expanded, onToggle, onDelete } =
    props;
  const hasDetails = sections.length > 0;
  const CaretIcon = expanded ? CaretUp : CaretDownOutline;

  return (
    <Flex
      data-test-id="inbox-failed-item"
      sx={{
        flexDirection: "column",
        gap: "spacing4",
        ...(expanded
          ? {
              bg: "background-secondary",
              borderRadius: "radius2",
              px: "spacing5",
              py: "spacing6"
            }
          : {})
      }}
    >
      <Flex
        sx={{
          alignItems: "center",
          justifyContent: "space-between",
          gap: "spacing5",
          minHeight: "20px"
        }}
      >
        <Text
          sx={{
            minWidth: 0,
            fontSize: "md",
            fontWeight: 600,
            lineHeight: 1.2,
            color: "heading",
            overflowWrap: "anywhere"
          }}
        >
          {title}
        </Text>
        <Flex sx={{ alignItems: "center", gap: "spacing7", flexShrink: 0 }}>
          {hasDetails ? (
            <Flex
              {...buttonProps(onToggle)}
              aria-expanded={expanded}
              sx={{
                alignItems: "center",
                gap: "spacing3",
                cursor: "pointer",
                color: "heading"
              }}
            >
              <Text
                sx={{
                  fontSize: "xs",
                  fontWeight: 500,
                  lineHeight: 1,
                  color: "heading"
                }}
              >
                {strings.details()}
              </Text>
              <CaretIcon size={13} />
            </Flex>
          ) : null}
          <Button
            variant="primary"
            title={strings.delete()}
            onClick={onDelete}
            sx={{
              width: 20,
              height: 20,
              p: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bg: "hover",
              borderRadius: "radius0",
              color: "heading"
            }}
          >
            <TrashSimple size={13} />
          </Button>
        </Flex>
      </Flex>

      <Flex sx={{ alignItems: "center", gap: "spacing3" }}>
        <ErrorBadge message={message} />
        <Text
          sx={{
            fontSize: "xs",
            lineHeight: 1,
            color: "paragraph",
            whiteSpace: "nowrap"
          }}
        >
          {strings.dateSynced()}: {getFormattedDate(props.dateSynced)}
        </Text>
      </Flex>

      {expanded && hasDetails ? (
        <DetailsBox sections={sections} copyText={copyText} />
      ) : null}
    </Flex>
  );
}

export const InboxHistoryDialog = DialogManager.register(
  function InboxHistoryDialog(props: InboxHistoryDialogProps) {
    const result = usePromise(() => db.inboxItemsHistory.failed.items());
    const [expanded, setExpanded] = useState<string[]>([]);

    async function deleteItem(id: string) {
      await db.inboxItemsHistory.delete([id]);
      showToast("success", strings.itemDeleted());
      if (result.status !== "pending") {
        result.refresh();
      }
    }

    async function deleteAll() {
      const ok = await ConfirmDialog.show({
        title: strings.deleteAll(),
        subtitle: strings.deleteAllFailedItemsDesc(),
        positiveButtonText: strings.yes(),
        negativeButtonText: strings.no()
      });
      if (!ok) return;

      await db.inboxItemsHistory.deleteFailed();
      showToast("success", strings.allItemsDeleted());
      if (result.status !== "pending") {
        result.refresh();
      }
    }

    const isEmpty = result.status === "fulfilled" && result.value.length === 0;

    return (
      <Dialog
        isOpen={true}
        title={strings.failedInboxItems()}
        description={isEmpty ? strings.noFailedInboxItems() : undefined}
        titleAction={
          result.status === "fulfilled" &&
          result.value.length > 0 && (
            <Button
              variant="secondary"
              onClick={deleteAll}
              sx={{
                px: "spacing3",
                py: "spacing2",
                bg: "hover",
                color: "heading",
                fontSize: "sm",
                fontWeight: 500,
                lineHeight: 1,
                borderRadius: "radius2"
              }}
            >
              {strings.deleteAll()}
            </Button>
          )
        }
        onClose={() => props.onClose(false)}
        negativeButton={{
          text: strings.close(),
          onClick: () => props.onClose(false)
        }}
        width={520}
      >
        <Flex sx={{ flexDirection: "column", mt: "spacing7", mb: "spacing7" }}>
          {result.status === "pending" ? (
            <Text variant="body">{strings.loading()}</Text>
          ) : result.status === "rejected" ? (
            <Text variant="body">{strings.failed()}</Text>
          ) : result.value.length === 0 ? null : (
            result.value.map((item, index) => {
              const ctx = parseErrorContext(item.errorContext);
              const { message, description, ...rest } =
                ctx ??
                ({} as Partial<InboxItemsHistoryErrorContext> &
                  Record<string, unknown>);
              const sections = getDetailSections(rest);
              const isExpanded = expanded.includes(item.id);
              const previous = result.value[index - 1];
              const isPreviousExpanded =
                !!previous && expanded.includes(previous.id);
              return (
                <Fragment key={item.id}>
                  {index > 0 ? (
                    isExpanded || isPreviousExpanded ? (
                      <Box sx={{ pt: "spacing7" }} />
                    ) : (
                      <Box
                        sx={{
                          height: "1px",
                          bg: "separator",
                          my: "spacing4"
                        }}
                      />
                    )
                  ) : null}
                  <FailedItem
                    id={item.id}
                    dateSynced={item.dateSynced}
                    title={(description as string) ?? "—"}
                    message={message}
                    sections={sections}
                    copyText={JSON.stringify(rest, null, 2)}
                    expanded={isExpanded}
                    onToggle={() =>
                      setExpanded((ids) =>
                        ids.includes(item.id)
                          ? ids.filter((id) => id !== item.id)
                          : [...ids, item.id]
                      )
                    }
                    onDelete={async () => {
                      const ok = await ConfirmDialog.show({
                        title: strings.deleteItem(),
                        subtitle: strings.areYouSure(),
                        positiveButtonText: strings.yes(),
                        negativeButtonText: strings.no()
                      });
                      if (!ok) return;

                      deleteItem(item.id);
                    }}
                  />
                </Fragment>
              );
            })
          )}
        </Flex>
      </Dialog>
    );
  }
);
