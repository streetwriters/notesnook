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

import { useEffect, useRef, useState } from "react";
import { Flex, Text, Button, Link, Switch, Input } from "@theme-ui/components";
import { Loading, Refresh } from "../icons";
import { db } from "../../common/db";
import { writeText } from "clipboard-polyfill";
import { showToast } from "../../utils/toast";
import { EV, EVENTS, hosts, MonographAnalytics } from "@notesnook/core";
import { useStore } from "../../stores/monograph-store";
import { Note } from "@notesnook/core";
import { strings } from "@notesnook/intl";
import {
  getFormattedDate,
  useIsFeatureAvailable,
  usePromise
} from "@notesnook/common";
import { createRoot, Root } from "react-dom/client";
import { PopupPresenter } from "@notesnook/ui";
import { BaseDialogProps, DialogManager } from "../../common/dialog-manager";
import Dialog from "../../components/dialog";
import { UpgradeDialog } from "../../dialogs/buy-dialog/upgrade-dialog";

type PublishViewProps = {
  note: Note;
  monograph?: ResolvedMonograph;
  onClose: (result: boolean) => void;
};
function PublishView(props: PublishViewProps) {
  const { note, onClose } = props;
  const [selfDestruct, setSelfDestruct] = useState(
    props.monograph?.selfDestruct
  );
  const [status, setStatus] = useState<{
    action: "publish" | "unpublish" | "analytics";
  }>();
  const [processingStatus, setProcessingStatus] = useState<{
    total?: number;
    current: number;
  }>();
  const passwordInput = useRef<HTMLInputElement>(null);
  const publishNote = useStore((store) => store.publish);
  const unpublishNote = useStore((store) => store.unpublish);
  const [monograph, setMonograph] = useState(props.monograph);
  const monographAnalytics = useIsFeatureAvailable("monographAnalytics");
  const analytics = usePromise(async () => {
    if (!monographAnalytics?.isAllowed || !monograph) return { totalViews: 0 };
    return await db.monographs.analytics(monograph?.id);
  }, [monograph?.id, monographAnalytics]);

  useEffect(() => {
    const fileDownloadedEvent = EV.subscribe(
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

  return (
    <>
      {monograph?.id ? (
        <Flex
          sx={{
            border: "1px solid var(--border)",
            borderRadius: "default",
            alignItems: "center",
            justifyContent: "space-between"
          }}
        >
          <Link
            variant="text.body"
            as="a"
            target="_blank"
            href={`${hosts.MONOGRAPH_HOST}/${monograph?.id}`}
            sx={{
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              textDecoration: "none",
              overflow: "hidden",
              px: 1
            }}
          >
            {`${hosts.MONOGRAPH_HOST}/${monograph?.id}`}
          </Link>
          <Button
            variant="secondary"
            className="copyPublishLink"
            sx={{ flexShrink: 0, m: 0 }}
            onClick={() => {
              writeText(`${hosts.MONOGRAPH_HOST}/${monograph?.id}`);
            }}
          >
            {strings.copy()}
          </Button>
        </Flex>
      ) : null}
      <Flex
        sx={{
          flexDirection: "column",
          border: "1px solid var(--border)",
          borderRadius: "default"
        }}
      >
        {monograph?.publishedAt ? (
          <Flex
            sx={{
              alignItems: "center",
              justifyContent: "space-between",
              px: 1,
              height: 30
            }}
          >
            <Text variant="body">{strings.publishedAt()}</Text>
            <Text variant="body" sx={{ color: "paragraph-secondary" }}>
              {getFormattedDate(monograph?.publishedAt, "date-time")}
            </Text>
          </Flex>
        ) : null}
        {monograph?.id ? (
          <Flex
            sx={{
              alignItems: "center",
              justifyContent: "space-between",
              px: 1,
              height: 30
            }}
          >
            <Text variant="body">{strings.views()}</Text>
            {monographAnalytics?.isAllowed ? (
              analytics.status === "fulfilled" ? (
                <Flex sx={{ alignItems: "center", gap: 1 }}>
                  <Text
                    variant="body"
                    sx={{
                      color: "paragraph-secondary"
                    }}
                  >
                    {analytics.value.totalViews}
                  </Text>
                  <Button
                    variant="tertiary"
                    onClick={async () => {
                      try {
                        setStatus({ action: "analytics" });
                        analytics.refresh();
                      } finally {
                        setStatus(undefined);
                      }
                    }}
                  >
                    <Refresh
                      size={14}
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
            ) : null}
          </Flex>
        ) : null}
        <Flex
          sx={{
            alignItems: "center",
            justifyContent: "space-between",
            cursor: "pointer",
            px: 1,
            height: 30,

            "& label": { width: "auto", flexShrink: 0 }
          }}
          onClick={() => setSelfDestruct((s) => !s)}
          title={strings.monographSelfDestructDesc()}
        >
          <Text variant="body">{strings.monographSelfDestructHeading()}</Text>
          <Switch
            sx={{
              m: 0,
              bg: selfDestruct ? "accent" : "icon-secondary",
              flexShrink: 0,
              scale: 0.75
            }}
            checked={selfDestruct}
            onClick={(e) => e.stopPropagation()}
          />
        </Flex>

        <Flex
          sx={{
            alignItems: "center",
            justifyContent: "space-between",
            px: 1,
            height: 30,

            "& label": { width: "auto", flexShrink: 0 }
          }}
          title={strings.monographPassDesc()}
        >
          <Text variant="body">{strings.monographPassHeading()}</Text>
          <Input
            ref={passwordInput}
            type="password"
            variant="clean"
            placeholder={strings.noPassword()}
            defaultValue={monograph?.password}
            sx={{ textAlign: "right", p: 0 }}
          />
        </Flex>
      </Flex>

      <Flex
        sx={{
          flexDirection: "column",
          border: "1px solid var(--border)",
          borderRadius: "default",
          overflow: "hidden"
        }}
      >
        {monograph?.id && (
          <Button
            variant="errorSecondary"
            onClick={async () => {
              try {
                setStatus({ action: "unpublish" });
                await unpublishNote(note.id);
                onClose(true);
                showToast("success", strings.actions.unpublished.note(1));
              } catch (e) {
                console.error(e);
                showToast(
                  "error",
                  `${strings.actionErrors.unpublished.note(1)}: ` +
                    (e as Error).message
                );
              } finally {
                setStatus(undefined);
              }
            }}
            sx={{ textAlign: "left", borderRadius: "none" }}
            disabled={!!status}
          >
            {status?.action === "unpublish" ? (
              <Loading size={16} />
            ) : (
              strings.unpublish()
            )}
          </Button>
        )}
        <Button
          variant={monograph?.id ? "secondary" : "accentSecondary"}
          onClick={async () => {
            try {
              setStatus({ action: "publish" });
              const password = passwordInput.current?.value;

              await publishNote(note.id, {
                selfDestruct,
                password
              });
              setMonograph(await resolveMonograph(note.id));
              showToast("success", strings.actions.published.note(1));
            } catch (e) {
              console.error(e);
              showToast(
                "error",
                `${strings.actionErrors.published.note(1)}: ${
                  (e as Error).message
                }`
              );
            } finally {
              setStatus(undefined);
            }
          }}
          sx={{ textAlign: "left", borderRadius: "none" }}
          disabled={!!status}
        >
          {status?.action === "publish" ? (
            <Loading size={16} />
          ) : monograph?.id ? (
            strings.update()
          ) : (
            strings.publish()
          )}
        </Button>
      </Flex>
      {processingStatus ? (
        <Text variant="subBody">
          {strings.downloadingImages()} {processingStatus.current}/
          {processingStatus.total || "?"}
        </Text>
      ) : null}
    </>
  );
}

export default PublishView;

let root: Root | null = null;

function close() {
  root?.unmount();
  root = null;
}

export async function showPublishView(note: Note, target?: HTMLElement) {
  const rootElement = document.getElementById("dialogContainer");
  if (!rootElement) return;

  if (root) return close();

  const monograph = await resolveMonograph(note.id);

  root = createRoot(rootElement);
  root.render(
    <PopupPresenter
      isOpen
      onClose={() => close()}
      position={{
        target,
        location: "below",
        isTargetAbsolute: true,
        yOffset: 10,
        xOffset: -10
      }}
      sx={{
        boxShadow: "0px 0px 15px 0px #00000011"
      }}
      scope="dialog"
    >
      <Flex
        p={2}
        sx={{
          flexDirection: "column",
          gap: 1,
          bg: "background",
          width: ["100%", 350, 350],
          border: "1px solid",
          borderColor: "border",
          borderRadius: "dialog",
          overflow: "hidden"
        }}
      >
        <Text variant="subtitle">{strings.publishToTheWeb()}</Text>
        <Text variant="subBody">{strings.monographDesc()}</Text>
        <PublishView
          note={note}
          monograph={monograph}
          onClose={() => close()}
        />
      </Flex>
    </PopupPresenter>
  );
}

export const PublishDialog = DialogManager.register(function PublishDialog(
  props: BaseDialogProps<boolean> & { note: Note }
) {
  const monograph = usePromise(
    () => resolveMonograph(props.note.id),
    [props.note.id]
  );

  if (monograph.status !== "fulfilled") return null;
  return (
    <Dialog
      isOpen={true}
      title={strings.publishToTheWeb()}
      description={strings.monographDesc()}
      width={400}
      onClose={() => props.onClose(false)}
    >
      <Flex
        sx={{
          flexDirection: "column",
          gap: 1,
          mb: 3
        }}
      >
        <PublishView
          note={props.note}
          monograph={monograph.value}
          onClose={props.onClose}
        />
      </Flex>
    </Dialog>
  );
});

type ResolvedMonograph = {
  id: string;
  selfDestruct: boolean;
  publishedAt?: number;
  password?: string;
};

async function resolveMonograph(
  monographId: string
): Promise<ResolvedMonograph | undefined> {
  const monograph = await db.monographs.get(monographId);
  if (!monograph) return;
  return {
    id: monographId,
    selfDestruct: !!monograph.selfDestruct,
    publishedAt: monograph.datePublished,
    password: monograph.password
      ? await db.monographs.decryptPassword(monograph.password)
      : undefined
  };
}
