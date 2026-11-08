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

import { useCallback, useEffect, useState, type ReactNode } from "react";
import {
  getFormattedDate,
  useIsFeatureAvailable,
  usePromise
} from "@notesnook/common";
import { EVENTS, type Note } from "@notesnook/core";
import { strings } from "@notesnook/intl";
import { shell } from "@platform";
import { Button, Dialog, Flex, Switch, Text } from "@ui";
import {
  ArrowCounterClockwise,
  Check,
  Clock,
  ClockCounterClockwise,
  Copy,
  Loading,
  Lock,
  PasswordInvisible,
  type Icon
} from "../icons";
import Field from "../field";
import { db } from "../../common/db";
import { showToast } from "../../utils/toast";
import { useStore } from "../../stores/monograph-store";
import {
  type BaseDialogProps,
  DialogManager
} from "../../common/dialog-manager";
import { UpgradeDialog } from "../../dialogs/buy-dialog/upgrade-dialog";
import { showUnpublishConfirmation } from "../../dialogs/confirm";
import { useCopyToClipboard } from "../../hooks/use-copy-to-clipboard";

export const PublishDialog = DialogManager.register(function PublishDialog(
  props: BaseDialogProps<boolean> & { note: Note }
) {
  const { note, onClose } = props;
  const {
    status: monographStatus,
    monograph,
    refresh: refreshMonograph
  } = useResolvedMonograph(note.id);

  const [isUnpublishing, setIsUnpublishing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const processingStatus = useImageDownloadProgress(note.id);
  const [values, setValues] = useState<PublishFormValues>(
    defaultFormValues(note)
  );
  const [errors, setErrors] = useState<{ title?: string; password?: string }>(
    {}
  );
  const initialValues = monograph
    ? formValuesFrom(monograph)
    : defaultFormValues(note);
  const initialKey = JSON.stringify(initialValues);
  useEffect(() => {
    setValues(initialValues);
    setErrors({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialKey]);
  const isDirty = JSON.stringify(values) !== initialKey;
  const publishNote = useStore((store) => store.publish);
  const unpublishNote = useStore((store) => store.unpublish);
  const isPasswordEnabled = values.passwordEnabled;
  const isSelfDestructEnabled = values.selfDestruct;
  const metadata = usePromise(async () => {
    if (!monograph) return;
    return await db.monographs.metadata(monograph.id);
  }, [monograph?.id]);
  const metadataValue = "value" in metadata ? metadata.value : undefined;
  const publishUrl = metadataValue?.publishUrl ?? monograph?.publishUrl;

  useEffect(() => {
    const monographsUpdatedEvent = db.eventManager.subscribe(
      EVENTS.monographsUpdated,
      (ids?: string[]) => {
        if (ids && ids.length > 0 && !ids.includes(note.id)) return;
        refreshMonograph();
      }
    );

    return () => {
      monographsUpdatedEvent.unsubscribe();
    };
  }, [note.id, refreshMonograph]);

  async function handleUnpublish() {
    if (!(await showUnpublishConfirmation())) return;

    try {
      setIsUnpublishing(true);
      await unpublishNote(note.id);
      refreshMonograph();
      showToast("success", strings.actions.unpublished.note(1));
    } catch (e) {
      console.error(e);
      showToast(
        "error",
        `${strings.actionErrors.unpublished.note(1)}: ` + (e as Error).message
      );
    } finally {
      setIsUnpublishing(false);
    }
  }

  async function handlePublish() {
    const nextErrors: { title?: string; password?: string } = {};
    if (!values.title.trim()) nextErrors.title = strings.titleIsRequired();
    if (values.passwordEnabled && !values.password.trim())
      nextErrors.password = strings.passwordRequired();
    setErrors(nextErrors);
    if (nextErrors.title || nextErrors.password) return;

    try {
      setIsSubmitting(true);
      await publishNote(note.id, values.title, {
        selfDestruct: values.selfDestruct,
        password: values.passwordEnabled ? values.password : undefined
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
      setIsSubmitting(false);
    }
  }

  const loadFailed = monographStatus === "rejected";
  const isInitialLoad =
    (monographStatus === "pending" && !monograph) ||
    (metadata.status === "pending" && !("value" in metadata));
  const isLoading = isInitialLoad || isSubmitting || isUnpublishing;

  return (
    <Dialog
      isOpen={true}
      title={
        monograph ? strings.editPublishedMonograph() : strings.publishToTheWeb()
      }
      description={strings.monographDesc()}
      width={460}
      noScroll={loadFailed}
      onClose={() => onClose(false)}
      negativeButton={{
        text: strings.cancel(),
        onClick: () => onClose(false)
      }}
      positiveButton={
        loadFailed
          ? { text: strings.tryAgain(), onClick: refreshMonograph }
          : {
              text: monograph ? strings.update() : strings.publish(),
              onClick: handlePublish,
              disabled: isLoading || (!!monograph && !isDirty),
              loading: isSubmitting
            }
      }
    >
      {loadFailed ? (
        <Text sx={{ color: "paragraph-error", m: "spacing7" }}>
          {strings.failedToLoadMonograph()}
        </Text>
      ) : (
        <Flex
          testID="publishForm"
          sx={{ flexDirection: "column", mt: "spacing4", mb: "spacing7" }}
        >
          <Field
            type="text"
            label={strings.title()}
            placeholder={strings.enterTitle()}
            disabled={isLoading}
            error={errors.title}
            value={values.title}
            onChangeText={(title) => setValues((v) => ({ ...v, title }))}
            onSubmit={handlePublish}
            sx={{ width: "100%" }}
            styles={{
              input: { px: "spacing5", py: "spacing6", fontSize: "sm" }
            }}
          />

          {monograph ? (
            <>
              <PublishedLinkCard
                url={publishUrl}
                disabled={isLoading}
                isUnpublishing={isUnpublishing}
                onUnpublish={handleUnpublish}
              />
              <MonographStats
                publishedAt={monograph.publishedAt}
                views={metadataValue?.analytics.totalViews}
                isRefreshing={metadata.status === "pending"}
                disabled={isLoading}
                onRefresh={() =>
                  metadata.status !== "pending" && metadata.refresh()
                }
              />
            </>
          ) : null}

          <Flex
            sx={{
              height: 1,
              bg: "separator",
              mb: "spacing6",
              mt: monograph ? "spacing6" : "spacing7"
            }}
          />

          <Flex sx={{ flexDirection: "column", gap: "spacing4" }}>
            <PasswordProtection
              enabled={isPasswordEnabled}
              disabled={isLoading}
              onToggle={(passwordEnabled) =>
                setValues((v) => ({ ...v, passwordEnabled }))
              }
              password={values.password}
              onPasswordChange={(password) =>
                setValues((v) => ({ ...v, password }))
              }
              error={errors.password}
            />
            <MonographRow
              icon={ClockCounterClockwise}
              title={strings.monographSelfDestructHeading()}
              description={strings.deleteAfterViewing()}
              action={
                <ToggleSwitch
                  isOn={isSelfDestructEnabled}
                  title={strings.monographSelfDestructDesc()}
                  disabled={isLoading}
                  onChange={(selfDestruct) =>
                    setValues((v) => ({ ...v, selfDestruct }))
                  }
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
      )}
    </Dialog>
  );
});

function PublishedLinkCard({
  url,
  disabled,
  isUnpublishing,
  onUnpublish
}: {
  url?: string;
  disabled: boolean;
  isUnpublishing: boolean;
  onUnpublish: () => void;
}) {
  const { copied, copy } = useCopyToClipboard();

  return (
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
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "spacing4",
          minWidth: 0
        }}
      >
        <Text sx={{ color: "heading", fontSize: "sm", fontWeight: 600 }}>
          {strings.publishedNoteLink()}
        </Text>
        <Button
          variant="new_error_bordered"
          onPress={onUnpublish}
          disabled={disabled}
          sx={{
            flexShrink: 0,
            p: "spacing4",
            borderRadius: "radius2",
            fontSize: "xs",
            lineHeight: 1
          }}
        >
          {isUnpublishing ? (
            <Loading size={13} color="icon" />
          ) : (
            <Text sx={{ fontSize: "xs" }}>{strings.unpublish()}</Text>
          )}
        </Button>
      </Flex>
      <Flex
        sx={{
          flexDirection: "row",
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
        <Text
          numberOfLines={1}
          onPress={() => url && shell.openUrl(url)}
          sx={{
            fontFamily: "body",
            minWidth: 0,
            color: "accent",
            fontSize: "xs",
            cursor: "pointer"
          }}
        >
          {url}
        </Text>
        <Button
          testID="copyPublishLink"
          variant="new_secondary"
          title={copied ? strings.copied() : strings.copy()}
          onPress={() => url && copy(url)}
          disabled={!url || disabled}
          sx={{
            flexShrink: 0,
            width: 20,
            height: 20,
            p: 0,
            borderRadius: "radius1",
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
  );
}

function MonographStats({
  publishedAt,
  views,
  isRefreshing,
  disabled,
  onRefresh
}: {
  publishedAt?: number;
  views?: number;
  isRefreshing: boolean;
  disabled: boolean;
  onRefresh: () => void;
}) {
  const monographAnalytics = useIsFeatureAvailable("monographAnalytics");

  return (
    <Flex sx={{ flexDirection: "column", gap: "spacing4" }}>
      {publishedAt ? (
        <MonographRow
          icon={Clock}
          title={strings.publishedAt()}
          description={getFormattedDate(publishedAt, "date-time")}
        />
      ) : null}
      <MonographRow
        icon={PasswordInvisible}
        title={strings.views()}
        description={strings.viewsOnPublishedNote()}
        action={
          monographAnalytics?.isAllowed ? (
            <Flex
              sx={{
                flexDirection: "row",
                alignItems: "center",
                gap: "spacing3"
              }}
            >
              {views !== undefined ? (
                <Text sx={{ fontSize: "xs", color: "heading" }}>{views}</Text>
              ) : null}
              <Button
                variant="tertiary"
                disabled={disabled}
                onPress={onRefresh}
              >
                <ArrowCounterClockwise
                  size={13}
                  color="icon"
                  rotate={isRefreshing ? 180 : undefined}
                />
              </Button>
            </Flex>
          ) : monographAnalytics ? (
            <Button
              variant="anchor"
              onPress={() =>
                UpgradeDialog.show({ feature: monographAnalytics })
              }
              sx={{ fontWeight: 500, fontSize: "xs" }}
            >
              <Text sx={{ fontWeight: 500, fontSize: "xs", color: "accent" }}>
                {strings.upgrade()}
              </Text>
            </Button>
          ) : null
        }
      />
    </Flex>
  );
}

function MonographRow({
  icon: IconComponent,
  title,
  description,
  action,
  children
}: {
  icon: Icon;
  title: string;
  description?: string;
  action?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <Flex
      sx={{
        flexDirection: "row",
        alignItems: children ? "flex-start" : "center",
        gap: "spacing4",
        minWidth: 0
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
        <IconComponent size={15} color="icon" />
      </Flex>
      <Flex sx={{ flexDirection: "column", flex: 1, minWidth: 0 }}>
        <Flex
          sx={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "spacing4",
            minWidth: 0
          }}
        >
          <Flex sx={{ flexDirection: "column", gap: "spacing3", minWidth: 0 }}>
            <Text sx={{ fontWeight: 500, color: "heading", fontSize: "sm" }}>
              {title}
            </Text>
            {description ? (
              <Text sx={{ color: "paragraph", fontSize: "xs" }}>
                {description}
              </Text>
            ) : null}
          </Flex>
          {action}
        </Flex>
        {children}
      </Flex>
    </Flex>
  );
}

function ToggleSwitch({
  isOn,
  title,
  disabled,
  onChange
}: {
  isOn: boolean;
  title?: string;
  disabled?: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <Switch
      title={title}
      checked={isOn}
      disabled={disabled}
      onChange={onChange}
      sx={{ m: 0, flexShrink: 0, bg: isOn ? "accent" : "icon-disabled" }}
    />
  );
}

function PasswordProtection({
  enabled,
  disabled,
  onToggle,
  password,
  onPasswordChange,
  error
}: {
  enabled: boolean;
  disabled: boolean;
  onToggle: (enabled: boolean) => void;
  password: string;
  onPasswordChange: (password: string) => void;
  error?: string;
}) {
  return (
    <MonographRow
      icon={Lock}
      title={strings.monographPassHeading()}
      description={enabled ? undefined : strings.secureYourNote()}
      action={
        <ToggleSwitch
          isOn={enabled}
          title={strings.monographPassDesc()}
          disabled={disabled}
          onChange={onToggle}
        />
      }
    >
      {enabled ? (
        <Field
          type="password"
          variant="clean"
          disabled={disabled}
          placeholder={strings.enterYourPassword()}
          error={error}
          value={password}
          onChangeText={onPasswordChange}
          sx={{ width: "100%", mt: "spacing4" }}
          styles={{
            input: { px: "spacing4", py: "spacing6", fontSize: "sm" }
          }}
        />
      ) : null}
    </MonographRow>
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

type PublishFormValues = {
  title: string;
  passwordEnabled: boolean;
  password: string;
  selfDestruct: boolean;
};

function defaultFormValues(note: Note): PublishFormValues {
  return {
    title: note.title,
    passwordEnabled: false,
    password: "",
    selfDestruct: false
  };
}

function formValuesFrom(monograph: ResolvedMonograph): PublishFormValues {
  return {
    title: monograph.title,
    passwordEnabled: monograph.password !== undefined,
    password: monograph.password ?? "",
    selfDestruct: monograph.selfDestruct
  };
}

function useImageDownloadProgress(noteId: string) {
  const [progress, setProgress] = useState<{
    total?: number;
    current: number;
  }>();

  useEffect(() => {
    const fileDownloadedEvent = db.eventManager.subscribe(
      EVENTS.fileDownloaded,
      ({ total, current, groupId }) => {
        if (!groupId || !groupId.includes(noteId)) return;
        if (current === total) setProgress(undefined);
        else setProgress({ total, current });
      }
    );

    return () => {
      fileDownloadedEvent.unsubscribe();
    };
  }, [noteId]);

  return progress;
}

function useResolvedMonograph(monographId: string) {
  const result = usePromise(() => resolveMonograph(monographId), [monographId]);
  const refresh = useCallback(() => {
    if ("refresh" in result) result.refresh();
  }, [result]);

  return {
    status: result.status,
    monograph: result.status === "rejected" ? undefined : result.value,
    refresh
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
