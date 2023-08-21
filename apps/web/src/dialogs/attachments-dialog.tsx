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

import { useEffect, useState, memo, useMemo, useRef } from "react";
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
import { getTotalSize } from "../common/attachments";
import { useStore, store } from "../stores/attachment-store";
import { formatBytes } from "@notesnook/common";
import Dialog from "../components/dialog";
import { TableVirtuoso } from "react-virtuoso";
import {
  ChevronDown,
  ChevronUp,
  Close,
  DoubleCheckmark,
  Download,
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
import { pluralize } from "@notesnook/common";
import { db } from "../common/db";
import { Perform } from "../common/dialog-controller";
import { Multiselect } from "../common/multi-select";
import { CustomScrollbarsVirtualList } from "../components/list-container";
import { Attachment } from "../components/attachment";
import {
  isDocument,
  isImage,
  isVideo
} from "@notesnook/core/dist/utils/filename";
import { alpha } from "@theme-ui/color";
import { ScopedThemeProvider } from "../components/theme-provider";

type ToolbarAction = {
  title: string;
  icon: Icon;
  onClick: ({ selected }: { selected: any[] }) => void;
};

const TOOLBAR_ACTIONS: ToolbarAction[] = [
  {
    title: "Download",
    icon: Download,
    onClick: async ({ selected }) => {
      await store.get().download(selected);
    }
  },
  {
    title: "Recheck",
    icon: DoubleCheckmark,
    onClick: async ({ selected }) => {
      await store.recheck(selected.map((a) => a.metadata.hash));
    }
  },
  {
    title: "Delete",
    icon: Trash,
    onClick: ({ selected }) => Multiselect.deleteAttachments(selected)
  }
];

type AttachmentsDialogProps = { onClose: Perform };
function AttachmentsDialog({ onClose }: AttachmentsDialogProps) {
  const allAttachments = useStore((store) => store.attachments);
  const [attachments, setAttachments] = useState<any[]>(allAttachments);
  const [selected, setSelected] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState({ id: "name", direction: "asc" });
  const currentRoute = useRef<Route>("all");
  const refresh = useStore((store) => store.refresh);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    setAttachments(filterAttachments(currentRoute.current, allAttachments));
  }, [allAttachments]);

  useEffect(() => {
    setAttachments((a) => {
      const attachments = a.slice();
      if (sortBy.id === "name") {
        attachments.sort(
          sortBy.direction === "asc"
            ? (a, b) => a.metadata.filename.localeCompare(b.metadata.filename)
            : (a, b) => b.metadata.filename.localeCompare(a.metadata.filename)
        );
      } else if (sortBy.id === "size") {
        attachments.sort(
          sortBy.direction === "asc"
            ? (a, b) => a.length - b.length
            : (a, b) => b.length - a.length
        );
      } else if (sortBy.id === "dateUploaded") {
        attachments.sort(
          sortBy.direction === "asc"
            ? (a, b) => a.dateUploaded - b.dateUploaded
            : (a, b) => b.dateUploaded - a.dateUploaded
        );
      }
      return attachments;
    });
  }, [sortBy]);

  const totalSize = useMemo(
    () => getTotalSize(allAttachments),
    [allAttachments]
  );

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
          height: "80vw"
        }}
      >
        <Sidebar
          totalSize={totalSize}
          filter={(query) => {
            setAttachments(
              db.lookup?.attachments(db.attachments.all || [], query) || []
            );
          }}
          counts={getCounts(allAttachments)}
          onRouteChange={(route) => {
            currentRoute.current = route;
            setSelected([]);
            setAttachments(filterAttachments(route, allAttachments));
          }}
        />
        <Flex
          variant="columnFill"
          sx={{
            bg: "background",
            flexDirection: "column",
            px: 4,
            pt: 2,
            overflowY: "hidden",
            overflow: "hidden",
            table: { width: "100%", tableLayout: "fixed" },
            "tbody::before": {
              content: `''`,
              display: "block",
              height: 5
            }
          }}
        >
          <Flex sx={{ justifyContent: "space-between" }}>
            <Flex sx={{ gap: 1 }}>
              {TOOLBAR_ACTIONS.map((tool) => (
                <Button
                  variant="secondary"
                  key={tool.title}
                  title={tool.title}
                  onClick={() =>
                    tool.onClick({
                      selected: attachments.filter(
                        (a) => selected.indexOf(a.id) > -1
                      )
                    })
                  }
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
          <TableVirtuoso
            components={{
              Scroller: CustomScrollbarsVirtualList,
              TableRow: (props) => {
                const attachment = attachments[props["data-item-index"]];
                return (
                  <Attachment
                    {...props}
                    key={attachment.id}
                    attachment={attachment}
                    isSelected={selected.indexOf(attachment.id) > -1}
                    onSelected={() => {
                      setSelected((s) => {
                        const copy = s.slice();
                        const index = copy.indexOf(attachment.id);
                        if (index > -1) copy.splice(index, 1);
                        else copy.push(attachment.id);
                        return copy;
                      });
                    }}
                  />
                );
              }
            }}
            style={{ height: "100%" }}
            data={attachments}
            fixedItemHeight={30}
            defaultItemHeight={30}
            fixedHeaderContent={() => (
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
                      sx={{ width: 18, height: 18 }}
                      onChange={(e) => {
                        setSelected(
                          e.currentTarget.checked
                            ? attachments.map((a) => a.id)
                            : []
                        );
                      }}
                    />
                  </Label>
                </Text>
                {[
                  { id: "name", title: "Name", width: "65%" },
                  { id: "status", width: "24px" },
                  { id: "size", title: "Size", width: "15%" },
                  { id: "dateUploaded", title: "Date uploaded", width: "20%" }
                ].map((column) =>
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
            )}
            itemContent={() => <></>}
          />
        </Flex>
      </Flex>
    </Dialog>
  );
}

export default AttachmentsDialog;

type Route = "all" | "images" | "documents" | "videos" | "uploads" | "orphaned";

const routes: { id: Route; icon: Icon; title: string }[] = [
  {
    id: "all",
    icon: FileGeneral,
    title: "All files"
  },
  {
    id: "images",
    icon: FileImage,
    title: "Images"
  },
  {
    id: "documents",
    icon: FileDocument,
    title: "Documents"
  },
  {
    id: "videos",
    icon: FileVideo,
    title: "Videos"
  },
  {
    id: "uploads",
    icon: Uploading,
    title: "Uploads"
  },
  {
    id: "orphaned",
    icon: Unlink,
    title: "Orphaned"
  }
];

type SidebarProps = {
  onRouteChange: (route: Route) => void;
  filter: (query: string) => void;
  counts: Record<Route, number>;
  totalSize: number;
};
const Sidebar = memo(
  function Sidebar(props: SidebarProps) {
    const { onRouteChange, filter, counts, totalSize } = props;
    const [route, setRoute] = useState("all");
    const downloadStatus = useStore((store) => store.status);
    const cancelDownload = useStore((store) => store.cancel);
    const download = useStore((store) => store.download);

    return (
      <ScopedThemeProvider scope="navigationMenu" injectCssVars={false}>
        <Flex
          className="theme-scope-navigationMenu"
          sx={{
            flexDirection: "column",
            justifyContent: "space-between",
            width: 240,
            backgroundColor: "background"
          }}
        >
          <Flex sx={{ flexDirection: "column" }}>
            <Input
              placeholder="Search"
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
                <Text variant="body">{pluralize(counts.all, "file")}</Text>
                <Text variant="subBody">{formatBytes(totalSize)}</Text>
              </Flex>
              <Button
                variant="secondary"
                sx={{
                  bg: "transparent",
                  borderRadius: 100,
                  position: "relative",
                  width: 38,
                  height: 38
                }}
                title="Download all attachments"
                onClick={async () => {
                  if (downloadStatus) {
                    await cancelDownload();
                  } else {
                    await download(db.attachments.all);
                  }
                }}
              >
                {downloadStatus ? <Close size={18} /> : <Download size={18} />}
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
      </ScopedThemeProvider>
    );
  },
  (prev, next) =>
    prev.totalSize === next.totalSize &&
    prev.counts.all === next.counts.all &&
    prev.counts.documents === next.counts.documents &&
    prev.counts.images === next.counts.images &&
    prev.counts.videos === next.counts.videos &&
    prev.counts.uploads === next.counts.uploads &&
    prev.counts.orphaned === next.counts.orphaned
);

function getCounts(attachments: any[]): Record<Route, number> {
  const counts: Record<Route, number> = {
    all: 0,
    documents: 0,
    images: 0,
    videos: 0,
    uploads: 0,
    orphaned: 0
  };
  for (const attachment of attachments) {
    counts.all++;

    if (isDocument(attachment.metadata.type)) counts.documents++;
    else if (isImage(attachment.metadata.type)) counts.images++;
    else if (isVideo(attachment.metadata.type)) counts.videos++;

    if (!attachment.dateUploaded) counts.uploads++;
    if (!attachment.noteIds.length) counts.orphaned++;
  }
  return counts;
}

function filterAttachments(route: Route, attachments: any[]): any[] {
  return route === "all"
    ? attachments
    : route === "images"
    ? attachments.filter((a) => a.metadata.type.startsWith("image/"))
    : route === "videos"
    ? attachments.filter((a) => a.metadata.type.startsWith("video/"))
    : route === "documents"
    ? attachments.filter((a) => isDocument(a.metadata.type))
    : route === "orphaned"
    ? attachments.filter((a) => !a.noteIds.length)
    : attachments.filter((a) => !a.dateUploaded);
}
