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

import React, { useEffect, useState } from "react";
import { Flex, Text, Button, Link, Switch } from "@theme-ui/components";
import {
  ArrowCounterClockwise,
  Check,
  Clock,
  ClockCounterClockwise,
  Copy,
  Loading,
  Lock,
  PasswordInvisible,
  Refresh
} from "../icons";
import type { Icon } from "../icons";
import { db } from "../../common/db";
import { writeText } from "clipboard-polyfill";
import { showToast } from "../../utils/toast";
import { EVENTS } from "@notesnook/core";
import { useStore } from "../../stores/monograph-store";
import { Note } from "@notesnook/core";
import { strings } from "@notesnook/intl";
import {
  getFormattedDate,
  useIsFeatureAvailable,
  usePromise
} from "@notesnook/common";
import { BaseDialogProps, DialogManager } from "../../common/dialog-manager";
import Dialog from "../../components/dialog";
import Field from "../field";
import { UpgradeDialog } from "../../dialogs/buy-dialog/upgrade-dialog";

export const PublishDialog = DialogManager.register(function PublishDialog(
  props: BaseDialogProps<boolean> & { note: Note }
) {
  const { note, onClose } = props;
  const resolvedMonograph = usePromise(
    () => resolveMonograph(note.id),
    [note.id]
  );
  const monograph =
    resolvedMonograph.status === "rejected"
      ? undefined
      : resolvedMonograph.value;

  const [status, setStatus] = useState<{
    action: "publish" | "unpublish" | "analytics";
  }>();
  const [processingStatus, setProcessingStatus] = useState<{
    total?: number;
    current: number;
  }>();
  const [monographFields, setMonographFields] = useState<{
    title: string;
    password?: string;
    selfDestruct: boolean;
  }>({
    title: note.title,
    password: undefined,
    selfDestruct: false
  });
  const publishNote = useStore((store) => store.publish);
  const unpublishNote = useStore((store) => store.unpublish);
  const [copied, setCopied] = useState(false);
  const monographAnalytics = useIsFeatureAvailable("monographAnalytics");

  const metadata = usePromise(async () => {
    if (!monograph) return { publishUrl: "", analytics: { totalViews: 0 } };
    return await db.monographs.metadata(monograph.id);
  }, [monograph?.id]);

  useEffect(() => {
    if (!monograph) return;

    setMonographFields({
      title: monograph.title,
      password: monograph.password,
      selfDestruct: !!monograph.selfDestruct
    });
  }, [monograph]);

  useEffect(() => {
    const fileDownloadedEvent = db.eventManager.subscribe(
      EVENTS.fileDownloaded,
      ({ total, current, groupId }) => {
        if (!groupId || !groupId.includes(note.id)) return;
        if (current === total) setProcessingStatus(undefined);
        else setProcessingStatus({ total, current });
      }
    );

    return () => {
      fileDownloadedEvent.unsubscribe();
    };
  }, [note.id]);

  function refreshMonograph() {
    if (resolvedMonograph.status === "fulfilled") resolvedMonograph.refresh();
  }

  useEffect(() => {
    const monographsUpdatedEvent = db.eventManager.subscribe(
      EVENTS.monographsUpdated,
      async (ids?: string[]) => {
        if (ids && ids.length > 0 && !ids.includes(note.id)) return;

        refreshMonograph();

        // if monograph has been unpublished, reset all the fields
        if (!(await db.monographs.get(note.id))) {
          setMonographFields({
            title: note.title,
            password: undefined,
            selfDestruct: false
          });
        }
      }
    );

    return () => {
      monographsUpdatedEvent.unsubscribe();
    };
  }, [note.id]);

  async function handleUnpublish() {
    try {
      setStatus({ action: "unpublish" });
      const unpublished = await unpublishNote(note.id);
      if (unpublished === false) return;

      refreshMonograph();
      setMonographFields({
        title: note.title,
        password: undefined,
        selfDestruct: false
      });
      showToast("success", strings.actions.unpublished.note(1));
    } catch (e) {
      console.error(e);
      showToast(
        "error",
        `${strings.actionErrors.unpublished.note(1)}: ` + (e as Error).message
      );
    } finally {
      setStatus(undefined);
    }
  }

  async function handlePublish() {
    try {
      setStatus({ action: "publish" });
      const title = monographFields.title;

      if (!title || title.trim().length === 0) {
        showToast("error", "Title cannot be empty.");
        return;
      }

      await publishNote(note.id, title, {
        selfDestruct: monographFields.selfDestruct,
        password: monographFields.password
      });
      refreshMonograph();
      showToast("success", strings.actions.published.note(1));
    } catch (e) {
      console.error(e);
      showToast(
        "error",
        `${strings.actionErrors.published.note(1)}: ${(e as Error).message}`
      );
    } finally {
      setStatus(undefined);
    }
  }

  if (resolvedMonograph.status === "rejected") {
    return (
      <Dialog
        isOpen={true}
        title={strings.publishToTheWeb()}
        description={strings.monographDesc()}
        width={460}
        noScroll
        onClose={() => onClose(false)}
        negativeButton={{
          text: strings.cancel(),
          onClick: () => onClose(false)
        }}
        positiveButton={{
          text: strings.tryAgain(),
          onClick: () => resolvedMonograph.refresh()
        }}
      >
        <Text sx={{ color: "paragraph-error", m: "spacing7" }}>
          Error loading monograph, please try again
        </Text>
      </Dialog>
    );
  }

  if (resolvedMonograph.status == "pending") {
    return (
      <Dialog
        isOpen={true}
        title={strings.publishToTheWeb()}
        description={strings.monographDesc()}
        width={460}
        noScroll
        onClose={() => onClose(false)}
        negativeButton={{
          text: strings.cancel(),
          onClick: () => onClose(false)
        }}
      >
        <Loading
          sx={{
            m: "spacing7"
          }}
        />
      </Dialog>
    );
  }

  const isChanged = monograph
    ? monograph.password !== monographFields.password ||
      monograph.title !== monographFields.title ||
      monograph.selfDestruct !== monographFields.selfDestruct
    : true;
  const passwordEnabled = monographFields.password !== undefined;
  const isPublishingOrUnpublishing =
    status?.action === "publish" || status?.action === "unpublish";

  return (
    <Dialog
      isOpen={true}
      title={strings.publishToTheWeb()}
      description={strings.monographDesc()}
      width={460}
      onClose={() => onClose(false)}
      negativeButton={
        monograph?.id
          ? {
              text: strings.unpublish(),
              variant: "new_error_bordered",
              onClick: handleUnpublish,
              disabled: !!status,
              loading: status?.action === "unpublish"
            }
          : {
              text: strings.cancel(),
              onClick: () => onClose(false)
            }
      }
      positiveButton={{
        text: monograph?.id ? strings.update() : strings.publish(),
        onClick: handlePublish,
        disabled: !!status || !isChanged,
        loading: status?.action === "publish"
      }}
    >
      <Flex
        sx={{
          flexDirection: "column",
          mt: "spacing4",
          mb: "spacing7"
        }}
      >
        <Field
          type="text"
          label={strings.title()}
          placeholder={strings.enterTitle()}
          value={monographFields.title}
          onChange={(event) =>
            setMonographFields((fields) => ({
              ...fields,
              title: event.target.value
            }))
          }
          sx={{ width: "100%" }}
          styles={{
            input: {
              px: "spacing5",
              py: "spacing6",
              fontSize: "sm"
            }
          }}
        />

        {monograph?.id ? (
          <Flex
            sx={{
              alignItems: "center",
              gap: "spacing4",
              mt: "spacing7",
              mb: "spacing4",
              p: "spacing4",
              bg: "background-selected",
              borderRadius: "radius2",
              minWidth: 0
            }}
          >
            <Flex
              sx={{
                flexDirection: "column",
                gap: "spacing3",
                minWidth: 0,
                flex: 1
              }}
            >
              <Text sx={{ color: "heading", fontSize: "sm", fontWeight: 500 }}>
                Published note link
              </Text>
              <Link
                as="a"
                target="_blank"
                href={
                  metadata.status === "fulfilled"
                    ? metadata.value.publishUrl
                    : "#"
                }
                sx={{
                  fontFamily: "body",
                  display: "block",
                  minWidth: 0,
                  color: "paragraph",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  textDecoration: "none",
                  overflow: "hidden",
                  fontSize: "xs"
                }}
              >
                {metadata.status === "fulfilled"
                  ? metadata.value.publishUrl
                  : monograph.publishUrl}
              </Link>
            </Flex>
            <Button
              variant="new_accent"
              className="copyPublishLink"
              onClick={() => {
                if (metadata.status !== "fulfilled") return;

                writeText(metadata.value.publishUrl);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              disabled={!("value" in metadata) || isPublishingOrUnpublishing}
              sx={{
                flexShrink: 0,
                gap: "spacing3",
                p: "spacing3",
                borderRadius: "50px"
              }}
            >
              {copied ? (
                <Check size={13} color="accentForeground" />
              ) : (
                <Copy size={13} color="accentForeground" />
              )}
              <Text
                sx={{
                  fontSize: "xs",
                  fontWeight: 600,
                  lineHeight: 1,
                  letterSpacing: "-0.26px",
                  color: "accentForeground"
                }}
              >
                {copied ? strings.copied() : strings.copy()}
              </Text>
            </Button>
          </Flex>
        ) : null}

        {monograph?.id ? (
          <Flex sx={{ flexDirection: "column", gap: "spacing4" }}>
            {monograph.publishedAt ? (
              <MonographRow
                icon={Clock}
                title={strings.publishedAt()}
                description={getFormattedDate(
                  monograph.publishedAt,
                  "date-time"
                )}
              />
            ) : null}
            <MonographRow
              icon={PasswordInvisible}
              title={strings.views()}
              description="Views on your published note"
              action={
                monographAnalytics?.isAllowed ? (
                  metadata.status === "fulfilled" ? (
                    <Flex sx={{ alignItems: "center", gap: "spacing3" }}>
                      <Text sx={{ fontSize: "xs", color: "heading" }}>
                        {metadata.value.analytics.totalViews}
                      </Text>
                      <Button
                        variant="tertiary"
                        disabled={isPublishingOrUnpublishing}
                        onClick={async () => {
                          try {
                            setStatus({ action: "analytics" });
                            metadata.refresh();
                          } finally {
                            setStatus(undefined);
                          }
                        }}
                      >
                        <ArrowCounterClockwise
                          size={13}
                          rotate={status?.action === "analytics"}
                        />
                      </Button>
                    </Flex>
                  ) : (
                    <Loading size={14} />
                  )
                ) : monographAnalytics ? (
                  <Button
                    variant="anchor"
                    onClick={() =>
                      UpgradeDialog.show({ feature: monographAnalytics })
                    }
                  >
                    {strings.upgrade()}
                  </Button>
                ) : null
              }
            />
          </Flex>
        ) : null}

        <Flex
          sx={{
            height: "1px",
            bg: "separator",
            mb: "spacing6",
            mt: monograph?.id ? "spacing6" : "spacing7"
          }}
        />

        <Flex sx={{ flexDirection: "column", gap: "spacing4" }}>
          <PasswordProtection
            enabled={passwordEnabled}
            disabled={isPublishingOrUnpublishing}
            onToggle={() => {
              setMonographFields((fields) => ({
                ...fields,
                password: passwordEnabled ? undefined : ""
              }));
            }}
            onChange={(password) =>
              setMonographFields((fields) => ({
                ...fields,
                password: password ?? ""
              }))
            }
            password={monographFields.password}
          />
          <MonographRow
            icon={ClockCounterClockwise}
            title={strings.monographSelfDestructHeading()}
            description="Delete after viewing"
            action={
              <Switch
                aria-label={strings.monographSelfDestructHeading()}
                title={strings.monographSelfDestructDesc()}
                disabled={isPublishingOrUnpublishing}
                checked={monographFields.selfDestruct}
                onChange={() =>
                  setMonographFields((fields) => ({
                    ...fields,
                    selfDestruct: !fields.selfDestruct
                  }))
                }
                sx={{
                  m: 0,
                  flexShrink: 0,
                  bg: monographFields.selfDestruct ? "accent" : "icon-disabled"
                }}
              />
            }
          />
        </Flex>

        {processingStatus ? (
          <Text variant="subBody">
            {strings.downloadingImages()} {processingStatus.current}/
            {processingStatus.total || "?"}
          </Text>
        ) : null}
      </Flex>
    </Dialog>
  );
});

function MonographRow({
  icon: IconComponent,
  title,
  description,
  action
}: {
  icon: Icon;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <Flex
      sx={{
        alignItems: "center",
        gap: "spacing4",
        minWidth: 0,
        "& label": { width: "auto", flexShrink: 0 }
      }}
    >
      <Flex
        sx={{
          alignItems: "center",
          justifyContent: "center",
          width: 32,
          height: 32,
          flexShrink: 0,
          bg: "background-secondary",
          borderRadius: "radius1"
        }}
      >
        <IconComponent size={15} />
      </Flex>
      <Flex
        sx={{ flexDirection: "column", gap: "spacing3", flex: 1, minWidth: 0 }}
      >
        <Text sx={{ fontWeight: 500, color: "heading", fontSize: "sm" }}>
          {title}
        </Text>
        <Text sx={{ color: "paragraph", fontSize: "xs" }}>{description}</Text>
      </Flex>
      {action}
    </Flex>
  );
}

function PasswordProtection({
  enabled,
  disabled,
  onToggle,
  onChange,
  password
}: {
  enabled: boolean;
  disabled: boolean;
  onToggle: () => void;
  onChange: (password: string) => void;
  password: string | undefined;
}) {
  const passwordSwitch = (
    <Switch
      aria-label={strings.monographPassHeading()}
      title={strings.monographPassDesc()}
      disabled={disabled}
      checked={enabled}
      onChange={onToggle}
      sx={{
        m: 0,
        flexShrink: 0,
        bg: enabled ? "accent" : "icon-disabled"
      }}
    />
  );

  return (
    <Flex
      sx={{
        alignItems: enabled ? "flex-start" : "center",
        gap: "spacing4",
        minWidth: 0,
        "& label": { width: "auto", flexShrink: 0 }
      }}
    >
      <Flex
        sx={{
          alignItems: "center",
          justifyContent: "center",
          width: 32,
          height: 32,
          flexShrink: 0,
          bg: "background-secondary",
          borderRadius: "radius1"
        }}
      >
        <Lock size={15} />
      </Flex>
      {enabled ? (
        <Flex sx={{ flexDirection: "column", flex: 1, minWidth: 0 }}>
          <Flex
            sx={{
              alignItems: "center",
              justifyContent: "space-between",
              minWidth: 0
            }}
          >
            <Text sx={{ fontWeight: 500, color: "heading", fontSize: "sm" }}>
              {strings.monographPassHeading()}
            </Text>
            {passwordSwitch}
          </Flex>
          <Field
            type="password"
            variant="clean"
            disabled={disabled}
            aria-label={strings.monographPassHeading()}
            placeholder="Enter your password"
            value={password ?? ""}
            onChange={(event) => onChange(event.currentTarget.value)}
            sx={{ width: "100%", mt: "spacing3" }}
            styles={{
              input: {
                px: "spacing4",
                py: "spacing6",
                fontSize: "sm"
              }
            }}
          />
        </Flex>
      ) : (
        <Flex
          sx={{
            alignItems: "center",
            justifyContent: "space-between",
            flex: 1,
            minWidth: 0
          }}
        >
          <Flex sx={{ flexDirection: "column", gap: "spacing3", minWidth: 0 }}>
            <Text sx={{ fontWeight: 500, color: "heading", fontSize: "sm" }}>
              {strings.monographPassHeading()}
            </Text>
            <Text sx={{ fontSize: "xs", color: "paragraph" }}>
              Secure your note
            </Text>
          </Flex>
          {passwordSwitch}
        </Flex>
      )}
    </Flex>
  );
}

type ResolvedMonograph = {
  id: string;
  selfDestruct: boolean;
  publishedAt?: number;
  password?: string;
  title: string;
  publishUrl?: string;
};

async function resolveMonograph(
  monographId: string
): Promise<ResolvedMonograph | undefined> {
  const monograph = await db.monographs.get(monographId);
  if (!monograph) return;
  return {
    id: monographId,
    selfDestruct: !!monograph.selfDestruct,
    publishUrl: monograph.publishUrl,
    publishedAt: monograph.datePublished,
    title: monograph.title,
    password: monograph.password
      ? await db.monographs.decryptPassword(monograph.password)
      : undefined
  };
}
