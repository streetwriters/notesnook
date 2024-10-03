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

import { useEffect, useState, memo, useRef, startTransition } from "react";
import {
  Box,
  Button,
  Checkbox,
  Donut,
  Flex,
  Input,
  Label,
  Text
} from "@theme-ui/components";
import { store, useStore } from "../stores/attachment-store";
import { formatBytes, usePromise, useResolvedItem } from "@notesnook/common";
import Dialog from "../components/dialog";
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
  Icon,
  Trash,
  Unlink,
  Uploading
} from "../components/icons";
import NavigationItem from "../components/navigation-menu/navigation-item";
import { db } from "../common/db";
import { Attachment } from "../components/attachment";
import { ScopedThemeProvider } from "../components/theme-provider";
import {
  Attachment as AttachmentType,
  VirtualizedGrouping
} from "@notesnook/core";
import { Multiselect } from "../common/multi-select";
import {
  VirtualizedTable,
  VirtualizedTableRowProps
} from "../components/virtualized-table";
import { FlexScrollContainer } from "../components/scroll-container";
import { BaseDialogProps, DialogManager } from "../common/dialog-manager";
import { ConfirmDialog } from "./confirm";
import { showToast } from "../utils/toast";
import { Loader } from "../components/loader";
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
  { id: "filename" as const, title: strings.name(), width: "65%" },
  { id: "status" as const, width: "24px" },
  { id: "size" as const, title: strings.size(), width: "15%" },
  { id: "dateUploaded" as const, title: strings.dateUploaded(), width: "20%" }
];

type SortOptions = {
  id: "filename" | "size" | "dateUploaded";
  direction: "asc" | "desc";
};
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
        width={"70%"}
        onClose={() => onClose(false)}
        noScroll
        sx={{ bg: "transparent" }}
      >
        <Flex
          sx={{
            height: "80vw",
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
            variant="columnFill"
            sx={{
              bg: "background",
              flexDirection: "column",
              pl: 4,
              pt: 2,
              overflow: "hidden"
            }}
          >
            <FlexScrollContainer>
              <Flex sx={{ justifyContent: "space-between" }}>
                <Flex sx={{ gap: 1 }}>
                  {TOOLBAR_ACTIONS.map((tool) => (
                    <Button
                      variant="secondary"
                      key={tool.title}
                      title={tool.title}
                      onClick={() => {
                        try {
                          tool.onClick({
                            selected
                          });
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
                {/* <Button
              variant="tool"
              sx={{ p: 1, display: "flex" }}
              onClick={async () => {
                if (!(await insertAttachment())) return;
                refresh();
              }}
            >
              <Plus size={18} />
              <Text variant="body" sx={{ ml: 1 }}>
                Upload
              </Text>
            </Button> */}
              </Flex>
              {attachments ? (
                <VirtualizedTable
                  style={{
                    tableLayout: "fixed",
                    width: "100%",
                    borderCollapse: "collapse"
                  }}
                  header={
                    <Box
                      as="tr"
                      sx={{
                        height: 40,
                        th: { borderBottom: "1px solid var(--separator)" },
                        bg: "background"
                      }}
                    >
                      <Text
                        as="th"
                        variant="body"
                        sx={{
                          width: 24,
                          textAlign: "left",
                          fontWeight: "normal",
                          mb: 2
                        }}
                      >
                        <Label>
                          <Checkbox
                            sx={{
                              width: 18,
                              height: 18,
                              color:
                                selected.length === attachments.length
                                  ? "accent"
                                  : "icon"
                            }}
                            onChange={async (e) => {
                              setSelected(
                                e.currentTarget.checked
                                  ? await filterAttachments(
                                      currentRoute.current
                                    ).ids()
                                  : []
                              );
                            }}
                            checked={selected.length === attachments.length}
                          />
                        </Label>
                      </Text>
                      {COLUMNS.map((column) =>
                        !column.title ? (
                          <th key={column.id} />
                        ) : (
                          <Box
                            as="th"
                            key={column.id}
                            sx={{
                              width: column.width,
                              cursor: "pointer",
                              px: 1,
                              mb: 2,
                              ":hover": { bg: "hover" }
                            }}
                            onClick={() => {
                              setSortBy((sortBy) => ({
                                direction:
                                  sortBy.id === column.id &&
                                  sortBy.direction === "asc"
                                    ? "desc"
                                    : "asc",
                                id: column.id
                              }));
                            }}
                          >
                            <Flex
                              sx={{
                                alignItems: "center",
                                justifyContent: "space-between"
                              }}
                            >
                              <Text
                                variant="body"
                                sx={{ textAlign: "left", fontWeight: "normal" }}
                              >
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
                          </Box>
                        )
                      )}
                    </Box>
                  }
                  mode="fixed"
                  estimatedSize={30}
                  getItemKey={(index) => attachments.key(index)}
                  items={attachments.placeholders}
                  context={{
                    isSelected: (id: string) => selected.indexOf(id) > -1,
                    select: (id: string) => {
                      setSelected((s) => {
                        const copy = s.slice();
                        const index = copy.indexOf(id);
                        if (index > -1) copy.splice(index, 1);
                        else copy.push(id);
                        return copy;
                      });
                    },
                    attachments
                  }}
                  renderRow={AttachmentRow}
                />
              ) : (
                <Loader title={strings.loading() + "..."} />
              )}
            </FlexScrollContainer>
          </Flex>
        </Flex>
      </Dialog>
    );
  }
);

function AttachmentRow(
  props: VirtualizedTableRowProps<
    boolean,
    {
      isSelected: (id: string) => boolean;
      select: (id: string) => void;
      attachments: VirtualizedGrouping<AttachmentType>;
    }
  >
) {
  const item = useResolvedItem({
    index: props.index,
    items: props.context!.attachments,
    type: "attachment"
  });
  if (!item) return null;
  return (
    <Attachment
      key={item.item.id}
      rowRef={props.rowRef}
      style={props.style}
      item={item?.item}
      isSelected={props.context?.isSelected(item.item.id)}
      onSelected={() => props.context?.select(item.item.id)}
    />
  );
}

type Route =
  | "all"
  | "images"
  | "documents"
  | "videos"
  | "audio"
  | "uploads"
  | "orphaned";

const routes: { id: Route; icon: Icon; title: string }[] = [
  {
    id: "all",
    icon: FileGeneral,
    title: strings.mediaTypes.all()
  },
  {
    id: "images",
    icon: FileImage,
    title: strings.mediaTypes.image()
  },
  {
    id: "documents",
    icon: FileDocument,
    title: strings.mediaTypes.document()
  },
  {
    id: "videos",
    icon: FileVideo,
    title: strings.mediaTypes.video()
  },
  {
    id: "audio",
    icon: FileAudio,
    title: strings.mediaTypes.audio()
  },
  {
    id: "uploads",
    icon: Uploading,
    title: strings.uploads()
  },
  {
    id: "orphaned",
    icon: Unlink,
    title: strings.orphaned()
  }
];

type SidebarProps = {
  onDownloadAll: () => void;
  onRouteChange: (route: Route) => void;
  filter: (query: string) => void;
  counts: Record<Route, number>;
};
const Sidebar = memo(
  function Sidebar(props: SidebarProps) {
    const { onRouteChange, filter, counts, onDownloadAll } = props;
    const [route, setRoute] = useState("all");
    const downloadStatus = useStore((store) => store.status);
    const cancelDownload = useStore((store) => store.cancel);
    const result = usePromise(() => db.attachments.totalSize());

    return (
      <ScopedThemeProvider scope="navigationMenu" injectCssVars={false}>
        <Flex
          className="theme-scope-navigationMenu"
          sx={{
            flexShrink: 0,
            flexDirection: "column",
            justifyContent: "space-between",
            width: 240,
            backgroundColor: "background"
          }}
        >
          <Flex sx={{ flexDirection: "column" }}>
            <Input
              id="search"
              name="search"
              placeholder={strings.search()}
              sx={{ m: 2, mb: 0, width: "auto", bg: "background", py: "7px" }}
              onChange={(e) => {
                setRoute(e.target.value ? "none" : "all");
                if (e.target.value) filter(e.target.value);
              }}
            />
            {routes.map((item) => (
              <NavigationItem
                key={item.id}
                icon={item.icon}
                title={item.title}
                count={counts[item.id]}
                onClick={() => {
                  onRouteChange(item.id);
                  setRoute(item.id);
                }}
                selected={route === item.id}
              />
            ))}
          </Flex>
          <Flex sx={{ flexDirection: "column" }}>
            <Flex sx={{ pl: 2, m: 2, mt: 1, justifyContent: "space-between" }}>
              <Flex sx={{ flexDirection: "column" }}>
                <Text variant="body">{strings.files(counts.all)}</Text>
                {result.status === "fulfilled" && (
                  <Text variant="subBody">
                    {formatBytes(result.value || 0)}
                  </Text>
                )}
              </Flex>
              <Flex>
                <Button
                  variant="secondary"
                  sx={{
                    bg: "transparent",
                    borderRadius: 100,
                    position: "relative",
                    width: 38,
                    height: 38
                  }}
                  disabled={!!downloadStatus}
                  title={strings.clearCache()}
                  onClick={async () => {
                    if (
                      await ConfirmDialog.show({
                        title: strings.clearCacheConfirm(),
                        message: strings.clearCacheConfirmDesc(),
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
                    position: "relative",
                    width: 38,
                    height: 38
                  }}
                  title={strings.downloadAllAttachments()}
                  onClick={async () => {
                    if (downloadStatus) {
                      await cancelDownload();
                    } else {
                      onDownloadAll();
                    }
                  }}
                >
                  {downloadStatus ? (
                    <Close size={18} />
                  ) : (
                    <Download size={18} />
                  )}
                  {downloadStatus ? (
                    <Donut
                      value={
                        (downloadStatus.current / downloadStatus.total) * 100
                      }
                      max={100}
                      size={38}
                      sx={{
                        position: "absolute",
                        top: 0,
                        left: 0
                      }}
                    />
                  ) : null}
                </Button>
              </Flex>
            </Flex>
          </Flex>
        </Flex>
      </ScopedThemeProvider>
    );
  },
  (prev, next) =>
    prev.counts.all === next.counts.all &&
    prev.counts.documents === next.counts.documents &&
    prev.counts.images === next.counts.images &&
    prev.counts.videos === next.counts.videos &&
    prev.counts.uploads === next.counts.uploads &&
    prev.counts.orphaned === next.counts.orphaned
);

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
