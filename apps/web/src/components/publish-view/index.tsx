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
  Warning
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
import { ErrorText } from "../error-text";

export const PublishDialog = DialogManager.register(function PublishDialog(
  props: BaseDialogProps<boolean> & { note: Note }
) {
  const { note, onClose } = props;
  const {
    status: monographStatus,
    monograph,
    refresh: refreshMonograph
  } = useResolvedMonograph(note.id);

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
  const [showTitleRequiredError, setShowTitleRequiredError] =
    useState(false);
  const [showPasswordRequiredError, setShowPasswordRequiredError] =
    useState(false);
  const monographAnalytics = useIsFeatureAvailable("monographAnalytics");
  const isPasswordEnabled = monographFields.password !== undefined;

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

  useEffect(() => {
    const monographsUpdatedEvent = db.eventManager.subscribe(
      EVENTS.monographsUpdated,
      async (ids?: string[]) => {
        if (ids && ids.length > 0 && !ids.includes(note.id)) return;

        refreshMonograph?.();

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
  }, [note.id, refreshMonograph]);

  async function handleUnpublish() {
    try {
      setStatus({ action: "unpublish" });
      const unpublished = await unpublishNote(note.id);
      if (unpublished === false) return;

      refreshMonograph?.();
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
        setShowTitleRequiredError(true);
        return;
      }
      setShowTitleRequiredError(false);

      if (isPasswordEnabled && !monographFields.password) {
        setShowPasswordRequiredError(true);
        return;
      }

      await publishNote(note.id, title, {
        selfDestruct: monographFields.selfDestruct,
        password: monographFields.password
      });
      refreshMonograph?.();
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

  if (monographStatus === "rejected") {
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
          onClick: () => refreshMonograph?.()
        }}
      >
        <Text sx={{ color: "paragraph-error", m: "spacing7" }}>
          Error loading monograph, please try again
        </Text>
      </Dialog>
    );
  }

  const isChanged = monograph
    ? monograph.password !== monographFields.password ||
      monograph.title !== monographFields.title ||
      monograph.selfDestruct !== monographFields.selfDestruct
    : true;
  const isLoading =
    monographStatus === "pending" ||
    status?.action === "publish" ||
    status?.action === "unpublish";

  return (
    <Dialog
      isOpen={true}
      title={monograph?.id ? "Edit monograph" : strings.publishToTheWeb()}
      description={strings.monographDesc()}
      width={460}
      onClose={() => onClose(false)}
      negativeButton={{
        text: strings.cancel(),
        onClick: () => onClose(false)
      }}
      positiveButton={{
        text: monograph?.id ? strings.update() : strings.publish(),
        onClick: handlePublish,
        disabled: isLoading || status?.action === "analytics" || !isChanged,
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
          required
          aria-invalid={showTitleRequiredError}
          variant={showTitleRequiredError ? "error" : undefined}
          placeholder={strings.enterTitle()}
          value={monographFields.title}
          disabled={isLoading}
          onChange={(event) => {
            const title = event.currentTarget.value;
            setShowTitleRequiredError(
              (error) => error && !title.trim()
            );
            setMonographFields((fields) => ({
              ...fields,
              title
            }));
          }}
          sx={{ width: "100%" }}
          styles={{
            input: {
              px: "spacing5",
              py: "spacing6",
              fontSize: "sm"
            }
          }}
        />
        {showTitleRequiredError ? (
          <ErrorText error={strings.titleIsRequired()} sx={{ mt: "spacing4" }} />
        ) : null}

        {monograph?.id ? (
          <Flex
            sx={{
              flexDirection: "column",
              gap: "spacing4",
              mt: "spacing7",
              mb: "spacing4",
              p: "spacing4",
              bg: "background-secondary",
              borderRadius: "radius2",
              minWidth: 0
            }}
          >
            <Flex
              sx={{
                alignItems: "center",
                justifyContent: "space-between",
                gap: "spacing4",
                minWidth: 0
              }}
            >
              <Text sx={{ color: "heading", fontSize: "sm", fontWeight: 600 }}>
                Published note link
              </Text>
              <Button
                variant="new_error_bordered"
                onClick={handleUnpublish}
                disabled={isLoading || status?.action === "analytics"}
                sx={{
                  flexShrink: 0,
                  p: "spacing4",
                  borderRadius: "radius2",
                  fontSize: "xs",
                  lineHeight: 1
                }}
              >
                {status?.action === "unpublish" ? (
                  <Loading size={13} color="currentColor" />
                ) : (
                  strings.unpublish()
                )}
              </Button>
            </Flex>
            <Flex
              sx={{
                alignItems: "center",
                justifyContent: "space-between",
                gap: "spacing4",
                minWidth: 0,
                px: "spacing4",
                py: "spacing3",
                bg: "accentForeground",
                borderRadius: "radius2"
              }}
            >
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
                  color: "accent",
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
              <Button
                variant="new_secondary"
                className="copyPublishLink"
                aria-label={copied ? strings.copied() : strings.copy()}
                onClick={() => {
                  if (metadata.status !== "fulfilled") return;

                  writeText(metadata.value.publishUrl);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                disabled={!("value" in metadata) || isLoading}
                sx={{
                  flexShrink: 0,
                  width: 20,
                  height: 20,
                  p: 0,
                  borderRadius: "radius1",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                {copied ? (
                  <Check size={13} color="accent" />
                ) : (
                  <Copy size={13} color="icon" />
                )}
              </Button>
            </Flex>
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
                        disabled={isLoading}
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
            enabled={isPasswordEnabled}
            disabled={isLoading}
            onToggle={() => {
              setShowPasswordRequiredError(false);
              setMonographFields((fields) => ({
                ...fields,
                password: isPasswordEnabled ? undefined : ""
              }));
            }}
            onChange={(password) => {
              setShowPasswordRequiredError((error) => error && !password);
              setMonographFields((fields) => ({
                ...fields,
                password: password ?? ""
              }));
            }}
            password={monographFields.password}
            showPasswordRequiredError={showPasswordRequiredError}
          />
          <MonographRow
            icon={ClockCounterClockwise}
            title={strings.monographSelfDestructHeading()}
            description="Delete after viewing"
            action={
              <Switch
                aria-label={strings.monographSelfDestructHeading()}
                title={strings.monographSelfDestructDesc()}
                disabled={isLoading}
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
  password,
  showPasswordRequiredError: passwordError
}: {
  enabled: boolean;
  disabled: boolean;
  onToggle: () => void;
  onChange: (password: string) => void;
  password: string | undefined;
  showPasswordRequiredError: boolean;
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
            variant={passwordError ? "error" : "clean"}
            required
            aria-invalid={passwordError}
            disabled={disabled}
            aria-label={strings.monographPassHeading()}
            placeholder="Enter your password"
            value={password ?? ""}
            onChange={(event) => onChange(event.currentTarget.value)}
            sx={{ width: "100%", mt: "spacing4" }}
            styles={{
              input: {
                px: "spacing4",
                py: "spacing6",
                fontSize: "sm"
              }
            }}
          />
          {passwordError ? (
            <ErrorText
              error={strings.passwordRequired()}
              sx={{ mt: "spacing4" }}
            />
          ) : null}
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

function useResolvedMonograph(monographId: string) {
  const result = usePromise(() => resolveMonograph(monographId), [monographId]);

  return {
    status: result.status,
    monograph: result.status === "rejected" ? undefined : result.value,
    refresh: result.status === "pending" ? undefined : result.refresh
  };
}

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
