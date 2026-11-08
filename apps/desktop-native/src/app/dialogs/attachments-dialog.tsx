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

import { useEffect, useRef, useState, startTransition } from "react";
import {
  Button,
  Checkbox,
  Dialog,
  Flex,
  Input,
  Progress,
  Text,
  ThemeScope,
  useWindowSize,
  VirtualList
} from "@ui";
import { store, useStore } from "../stores/attachment-store";
import { formatBytes, usePromise, useResolvedItem } from "@notesnook/common";
import {
  ChevronDown,
  ChevronUp,
  ClearCache,
  Close,
  DoubleCheckmark,
  Download,
  FileAudio,
  FileDocument,
  FileGeneral,
  FileImage,
  FileVideo,
  Trash,
  Unlink,
  Uploading,
  type Icon
} from "../components/icons";
import { NavigationItem } from "../components/navigation-menu/navigation-item";
import { db } from "../common/db";
import type {
  Attachment as AttachmentType,
  VirtualizedGrouping
} from "@notesnook/core";
import { Attachment } from "../components/attachment";
import { Multiselect } from "../common/multi-select";
import { BaseDialogProps, DialogManager } from "../common/dialog-manager";
import { ConfirmDialog } from "./confirm";
import { showToast } from "../utils/toast";
import { strings } from "@notesnook/intl";

type ToolbarAction = {
  title: string;
  icon: Icon;
  onClick: ({ selected }: { selected: string[] }) => void;
};

const TOOLBAR_ACTIONS: ToolbarAction[] = [
  {
    title: strings.network.download(),
    icon: Download,
    onClick: async ({ selected }) => {
      await store.get().download(selected);
    }
  },
  {
    title: strings.fileCheck(),
    icon: DoubleCheckmark,
    onClick: async ({ selected }) => await store.recheck(selected)
  },
  {
    title: strings.delete(),
    icon: Trash,
    onClick: ({ selected }) => Multiselect.deleteAttachments(selected)
  }
];

const COLUMNS = [
  { id: "filename" as const, title: strings.name(), flex: 65 },
  { id: "size" as const, title: strings.size(), flex: 15 },
  { id: "dateUploaded" as const, title: strings.dateUploaded(), flex: 20 }
];

type SortOptions = {
  id: "filename" | "size" | "dateUploaded";
  direction: "asc" | "desc";
};

type Route =
  | "all"
  | "images"
  | "documents"
  | "videos"
  | "audio"
  | "uploads"
  | "orphaned";

type AttachmentsDialogProps = BaseDialogProps<false>;

export const AttachmentsDialog = DialogManager.register(
  function AttachmentsDialog({ onClose }: AttachmentsDialogProps) {
    const nonce = useStore((store) => store.nonce);
    const [attachments, setAttachments] =
      useState<VirtualizedGrouping<AttachmentType>>();
    const [counts, setCounts] = useState<Record<Route, number>>({
      all: 0,
      documents: 0,
      images: 0,
      orphaned: 0,
      uploads: 0,
      videos: 0,
      audio: 0
    });
    const [selected, setSelected] = useState<string[]>([]);
    const [sortBy, setSortBy] = useState<SortOptions>({
      id: "filename",
      direction: "asc"
    });
    const { width: windowWidth } = useWindowSize();
    const currentRoute = useRef<Route>("all");
    const download = useStore((store) => store.download);

    useEffect(() => {
      filterAttachments(currentRoute.current)
        .sorted({
          sortBy: sortBy.id,
          sortDirection: sortBy.direction
        })
        .then((value) => startTransition(() => setAttachments(value)));
    }, [sortBy, nonce]);

    useEffect(() => {
      getCounts().then((counts) => startTransition(() => setCounts(counts)));
    }, [nonce]);

    return (
      <Dialog
        isOpen={true}
        width="70%"
        onClose={() => onClose(false)}
        noScroll
        sx={{ bg: "transparent" }}
      >
        <Flex
          sx={{
            flexDirection: "row",
            height: windowWidth * 0.8,
            overflow: "hidden"
          }}
        >
          <Sidebar
            onDownloadAll={async () =>
              download(
                await db.attachments.all.ids({
                  sortBy: "dateCreated",
                  sortDirection: "desc"
                })
              )
            }
            filter={async (query) => {
              setAttachments(await db.lookup.attachments(query).sorted());
            }}
            counts={counts}
            onRouteChange={async (route) => {
              currentRoute.current = route;
              setSelected([]);
              setAttachments(
                await filterAttachments(currentRoute.current).sorted({
                  sortBy: sortBy.id,
                  sortDirection: sortBy.direction
                })
              );
            }}
          />
          <Flex
            sx={{
              flex: 1,
              bg: "background",
              flexDirection: "column",
              pl: 4,
              pt: 2,
              overflow: "hidden"
            }}
          >
            <Flex sx={{ flexDirection: "row", gap: 1 }}>
              {TOOLBAR_ACTIONS.map((tool) => (
                <Button
                  variant="secondary"
                  key={tool.title}
                  title={tool.title}
                  onPress={() => {
                    try {
                      tool.onClick({ selected });
                    } catch (e) {
                      showToast("error", (e as Error).message);
                    }
                  }}
                  disabled={!selected.length}
                  sx={{ bg: "transparent", p: 1 }}
                >
                  <tool.icon size={18} />
                </Button>
              ))}
            </Flex>
            {attachments ? (
              <Flex sx={{ flex: 1, flexDirection: "column" }}>
                <Flex
                  sx={{
                    flexDirection: "row",
                    height: 40,
                    alignItems: "center",
                    borderBottom: "1px solid",
                    borderBottomColor: "separator",
                    bg: "background"
                  }}
                >
                  <Flex sx={{ width: 24, alignItems: "center" }}>
                    <Checkbox
                      sx={{ width: 18, height: 18 }}
                      checked={selected.length === attachments.length}
                      onChange={async (checked) => {
                        setSelected(
                          checked
                            ? await filterAttachments(
                                currentRoute.current
                              ).ids()
                            : []
                        );
                      }}
                    />
                  </Flex>
                  {COLUMNS.map((column) => (
                    <Flex
                      key={column.id}
                      onPress={() =>
                        setSortBy((sortBy) => ({
                          direction:
                            sortBy.id === column.id &&
                            sortBy.direction === "asc"
                              ? "desc"
                              : "asc",
                          id: column.id
                        }))
                      }
                      sx={{
                        flex: column.flex,
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                        cursor: "pointer",
                        px: 1,
                        ":hover": { bg: "hover" }
                      }}
                    >
                      <Text variant="body" sx={{ fontWeight: "normal" }}>
                        {column.title}
                      </Text>
                      {sortBy.id === column.id ? (
                        sortBy.direction === "asc" ? (
                          <ChevronUp size={16} />
                        ) : (
                          <ChevronDown size={16} />
                        )
                      ) : null}
                    </Flex>
                  ))}
                </Flex>
                <VirtualList
                  count={attachments.placeholders.length}
                  estimatedItemSize={30}
                  itemKey={(index) => attachments.key(index)}
                  extraData={[selected, attachments]}
                  sx={{ flex: 1 }}
                  renderItem={(index) => (
                    <AttachmentRow
                      index={index}
                      attachments={attachments}
                      isSelected={(id) => selected.indexOf(id) > -1}
                      select={(id) =>
                        setSelected((s) => {
                          const copy = s.slice();
                          const index = copy.indexOf(id);
                          if (index > -1) copy.splice(index, 1);
                          else copy.push(id);
                          return copy;
                        })
                      }
                    />
                  )}
                />
              </Flex>
            ) : (
              <Text variant="body">{strings.loading() + "..."}</Text>
            )}
          </Flex>
        </Flex>
      </Dialog>
    );
  }
);

function getFileIcon(type: string) {
  if (type.startsWith("image/")) return FileImage;
  if (type.startsWith("video/")) return FileVideo;
  if (type.startsWith("audio/")) return FileAudio;
  if (type.startsWith("application/") || type.startsWith("text/"))
    return FileDocument;
  return FileGeneral;
}

function AttachmentRow(props: {
  index: number;
  attachments: VirtualizedGrouping<AttachmentType>;
  isSelected: (id: string) => boolean;
  select: (id: string) => void;
}) {
  const item = useResolvedItem({
    index: props.index,
    items: props.attachments,
    type: "attachment"
  });
  if (!item) return null;
  return (
    <Attachment
      key={item.item.id}
      item={item.item}
      isSelected={props.isSelected(item.item.id)}
      onSelected={() => props.select(item.item.id)}
    />
  );
}

const routes: { id: Route; icon: Icon; title: string }[] = [
  { id: "all", icon: FileGeneral, title: strings.mediaTypes.all() },
  { id: "images", icon: FileImage, title: strings.mediaTypes.image() },
  { id: "documents", icon: FileDocument, title: strings.mediaTypes.document() },
  { id: "videos", icon: FileVideo, title: strings.mediaTypes.video() },
  { id: "audio", icon: FileAudio, title: strings.mediaTypes.audio() },
  { id: "uploads", icon: Uploading, title: strings.uploads() },
  { id: "orphaned", icon: Unlink, title: strings.orphaned() }
];

type SidebarProps = {
  onDownloadAll: () => void;
  onRouteChange: (route: Route) => void;
  filter: (query: string) => void;
  counts: Record<Route, number>;
};

function Sidebar(props: SidebarProps) {
  const { onRouteChange, filter, counts, onDownloadAll } = props;
  const [route, setRoute] = useState("all");
  const downloadStatus = useStore((store) => store.status);
  const cancelDownload = useStore((store) => store.cancel);
  const result = usePromise(() => db.attachments.totalSize());

  return (
    <ThemeScope scope="navigationMenu">
      <Flex
        sx={{
          flexShrink: 0,
          flexDirection: "column",
          justifyContent: "space-between",
          width: 240,
          bg: "background"
        }}
      >
        <Flex sx={{ flexDirection: "column", gap: "small", mx: 2, mt: 2 }}>
          <Input
            testID="search"
            placeholder={strings.search()}
            sx={{ mb: 2, bg: "background", py: "7px" }}
            onChangeText={(text) => {
              setRoute(text ? "none" : "all");
              if (text) filter(text);
            }}
          />
          {routes.map((item) => (
            <NavigationItem
              key={item.id}
              icon={item.icon}
              title={item.title}
              onPress={() => {
                onRouteChange(item.id);
                setRoute(item.id);
              }}
              selected={route === item.id}
            >
              <Text variant="subBody">{counts[item.id]}</Text>
            </NavigationItem>
          ))}
        </Flex>
        <Flex
          sx={{
            flexDirection: "row",
            pl: 2,
            m: 2,
            mt: 1,
            justifyContent: "space-between"
          }}
        >
          <Flex sx={{ flexDirection: "column" }}>
            <Text variant="body">{strings.files(counts.all)}</Text>
            {result.status === "fulfilled" && (
              <Text variant="subBody">{formatBytes(result.value || 0)}</Text>
            )}
          </Flex>
          <Flex sx={{ flexDirection: "row" }}>
            <Button
              variant="secondary"
              sx={{
                bg: "transparent",
                borderRadius: 100,
                width: 38,
                height: 38
              }}
              disabled={!!downloadStatus}
              title={strings.clearCache()}
              onPress={async () => {
                if (
                  await ConfirmDialog.show({
                    title: strings.clearCacheConfirm(),
                    subtitle: strings.clearCacheConfirmDesc(),
                    negativeButtonText: strings.no(),
                    positiveButtonText: strings.yes()
                  })
                ) {
                  await db.fs().clear();
                  showToast("success", strings.cacheCleared());
                }
              }}
            >
              <ClearCache />
            </Button>
            <Button
              variant="secondary"
              sx={{
                bg: "transparent",
                borderRadius: 100,
                width: 38,
                height: 38
              }}
              title={strings.downloadAllAttachments()}
              onPress={async () => {
                if (downloadStatus) {
                  await cancelDownload();
                } else {
                  onDownloadAll();
                }
              }}
            >
              {downloadStatus ? <Close size={18} /> : <Download size={18} />}
            </Button>
            {downloadStatus ? (
              <Progress
                value={(downloadStatus.current / downloadStatus.total) * 100}
                max={100}
                sx={{ width: 38 }}
              />
            ) : null}
          </Flex>
        </Flex>
      </Flex>
    </ThemeScope>
  );
}

async function getCounts(): Promise<Record<Route, number>> {
  return {
    all: await db.attachments.all.count(),
    documents: await db.attachments.documents.count(),
    images: await db.attachments.images.count(),
    videos: await db.attachments.videos.count(),
    audio: await db.attachments.audios.count(),
    uploads: await db.attachments.pending.count(),
    orphaned: await db.attachments.orphaned.count()
  };
}

function filterAttachments(route: Route) {
  return route === "all"
    ? db.attachments.all
    : route === "images"
    ? db.attachments.images
    : route === "videos"
    ? db.attachments.videos
    : route === "documents"
    ? db.attachments.documents
    : route === "orphaned"
    ? db.attachments.orphaned
    : route === "audio"
    ? db.attachments.audios
    : db.attachments.pending;
}
