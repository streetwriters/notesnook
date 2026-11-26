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

import { useEffect, useState, useRef, startTransition } from "react";
import { Box, Button, Flex, Text } from "@theme-ui/components";
import { store, useStore } from "../stores/attachment-store";
import { useStore as useUserStore } from "../stores/user-store";
import {
  formatBytes,
  resolveItems,
  usePromise,
  useResolvedItem
} from "@notesnook/common";
import Dialog from "../components/dialog";
import {
  ArrowDownSvgIcon,
  ArrowUp,
  CalendarBlank,
  CaretDownOutline,
  Checks,
  ChevronDown,
  ChevronUp,
  Close,
  FileDoc,
  Icon,
  MusicNotes,
  OrderAlphabeticalAscending,
  OrderAlphabeticalDescending,
  PaintBrushHousehold,
  Picture,
  Play,
  SearchIcon,
  Trash,
  Upload,
  Warning
} from "../components/icons";
import NavigationItem from "../components/navigation-menu/navigation-item";
import { db } from "../common/db";
import { Attachment } from "../components/attachment";
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
import Field from "../components/field";
import { Checkbox } from "../components/checkbox";
import { Menu } from "../hooks/use-menu";
import { MenuItem } from "@notesnook/ui";

type ToolbarAction = {
  title: string;
  icon: Icon;
  isDestructive?: boolean;
  onClick: ({ selected }: { selected: string[] }) => void;
};

const TOOLBAR_ACTIONS: ToolbarAction[] = [
  {
    title: strings.network.download(),
    icon: ArrowDownSvgIcon,
    onClick: async ({ selected }) => {
      await store.get().download(selected);
    }
  },
  {
    title: strings.fileCheck(),
    icon: Checks,
    onClick: async ({ selected }) => await store.recheck(selected)
  },
  {
    title: strings.delete(),
    icon: Trash,
    isDestructive: true,
    onClick: ({ selected }) => Multiselect.deleteAttachments(selected)
  }
];

const COLUMNS = [
  { id: "filename" as const, title: strings.name() },
  { id: "size" as const, title: strings.size(), width: "30.4%" },
  { id: "dateUploaded" as const, title: strings.dateUploaded(), width: "30.4%" }
];

const TABLE_STYLE: React.CSSProperties = {
  tableLayout: "fixed",
  width: "100%",
  borderCollapse: "collapse"
};

const SEARCH_DEBOUNCE_MS = 200;

type SortOptions = {
  id: "filename" | "size" | "dateUploaded";
  direction: "asc" | "desc";
};

const SORT_GROUPS: {
  title: string;
  items: (SortOptions & { title: string; icon: Icon })[];
}[] = [
  {
    title: strings.name(),
    items: [
      {
        id: "filename",
        direction: "asc",
        title: strings.aToZ(),
        icon: OrderAlphabeticalAscending
      },
      {
        id: "filename",
        direction: "desc",
        title: strings.zToA(),
        icon: OrderAlphabeticalDescending
      }
    ]
  },
  {
    title: strings.size(),
    items: [
      {
        id: "size",
        direction: "desc",
        title: "Largest first",
        icon: ArrowDownSvgIcon
      },
      {
        id: "size",
        direction: "asc",
        title: "Smallest first",
        icon: ArrowUp
      }
    ]
  },
  {
    title: strings.dateUploaded(),
    items: [
      {
        id: "dateUploaded",
        direction: "asc",
        title: strings.oldestFirst(),
        icon: CalendarBlank
      },
      {
        id: "dateUploaded",
        direction: "desc",
        title: strings.newestFirst(),
        icon: CalendarBlank
      }
    ]
  }
];

function getSortMenuItems(
  sortBy: SortOptions,
  onSort: (sortBy: SortOptions) => void
): MenuItem[] {
  return SORT_GROUPS.flatMap((group) => [
    {
      type: "popup",
      key: `heading-${group.title}`,
      component: () => (
        <Text
          sx={{
            px: "spacing4",
            py: "spacing1",
            fontSize: "xxs",
            fontWeight: 500,
            color: "accent"
          }}
        >
          {group.title}
        </Text>
      )
    },
    { type: "separator", key: `separator-${group.title}` },
    ...group.items.map(
      (item): MenuItem => ({
        type: "button",
        key: `${item.id}-${item.direction}`,
        title: item.title,
        iconComponent: item.icon,
        isChecked: sortBy.id === item.id && sortBy.direction === item.direction,
        onClick: () => onSort({ id: item.id, direction: item.direction })
      })
    )
  ]);
}

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
    const [route, setRoute] = useState<Route>("all");
    const [search, setSearch] = useState("");
    const [query, setQuery] = useState("");
    const sortButtonRef = useRef<HTMLButtonElement>(null);
    const download = useStore((store) => store.download);

    useEffect(() => {
      const value = search.trim();
      if (!value) {
        setQuery("");
        return;
      }
      const timeout = setTimeout(() => setQuery(value), SEARCH_DEBOUNCE_MS);
      return () => clearTimeout(timeout);
    }, [search]);

    useEffect(() => {
      let isStale = false;
      const sortOptions = {
        sortBy: sortBy.id,
        sortDirection: sortBy.direction
      };
      (async () => {
        const grouping = query
          ? await db.lookup.attachments(query).sorted(sortOptions)
          : await filterAttachments(route).sorted(sortOptions);
        if (grouping.length > 0) await grouping.item(0, resolveItems);
        if (isStale) return;
        startTransition(() => setAttachments(grouping));
      })();
      return () => {
        isStale = true;
      };
    }, [query, route, sortBy, nonce]);

    useEffect(() => {
      getCounts().then((counts) => startTransition(() => setCounts(counts)));
    }, [nonce]);

    const isAllSelected =
      !!attachments &&
      attachments.length > 0 &&
      selected.length === attachments.length;

    const header = attachments ? (
      <Box
        as="tr"
        sx={{
          height: 29,
          bg: "background-secondary",
          th: { p: 0, fontWeight: "normal", textAlign: "left" },
          "th:first-of-type": {
            pl: "spacing3",
            borderTopLeftRadius: "3px",
            borderBottomLeftRadius: "3px"
          },
          "th:last-of-type": {
            pr: "spacing3",
            borderTopRightRadius: "3px",
            borderBottomRightRadius: "3px"
          }
        }}
      >
        <Box as="th" sx={{ width: 32 }}>
          <Flex sx={{ alignItems: "center" }}>
            <Checkbox
              checked={isAllSelected}
              aria-label={strings.selectAll()}
              size={15}
              checkboxUncheckedIconColor="icon-disabled"
              onToggle={async () => {
                setSelected(!isAllSelected ? await attachments.ids() : []);
              }}
            />
          </Flex>
        </Box>
        {COLUMNS.map((column) => (
          <Box
            as="th"
            key={column.id}
            sx={{
              width: column.width,
              cursor: "pointer",
              ":hover": { bg: "hover" }
            }}
            onClick={() => {
              setSortBy((sortBy) => ({
                direction:
                  sortBy.id === column.id && sortBy.direction === "asc"
                    ? "desc"
                    : "asc",
                id: column.id
              }));
            }}
          >
            <Flex
              sx={{
                alignItems: "center",
                justifyContent: "space-between",
                gap: "spacing2",
                pr: "spacing3",
                ml: column.id === "filename" ? "-3px" : 0
              }}
            >
              <Text
                variant="body"
                sx={{
                  fontSize: "xs",
                  color: "paragraph",
                  fontWeight: 400,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis"
                }}
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
        ))}
      </Box>
    ) : null;

    return (
      <Dialog
        isOpen={true}
        width={"min(1102px, 90vw)"}
        height={"min(80vh, 760px)"}
        onClose={() => onClose(false)}
        noScroll
        sx={{
          boxShadow: "0px 5px 10px rgba(39, 39, 39, 0.17)",
          "& > div:first-of-type": { display: "none" }
        }}
      >
        <Flex
          sx={{
            height: "min(80vh, 760px)",
            overflow: "hidden",
            p: "spacing6",
            gap: "spacing4"
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
            search={search}
            onSearchChange={(value) => {
              setSearch(value);
              setSelected([]);
            }}
            route={search.trim() ? undefined : route}
            counts={counts}
            onRouteChange={(route) => {
              setRoute(route);
              setSearch("");
              setSelected([]);
            }}
          />
          <Flex
            sx={{
              flex: 1,
              minWidth: 0,
              flexDirection: "column",
              gap: "spacing6",
              overflow: "hidden"
            }}
          >
            <Flex
              sx={{
                justifyContent: "space-between",
                alignItems: "center",
                gap: "spacing4",
                flexShrink: 0
              }}
            >
              <Flex sx={{ gap: "spacing4" }}>
                {TOOLBAR_ACTIONS.map((tool) => (
                  <Button
                    variant="new_bordered"
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
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: "spacing3",
                      p: "spacing5",
                      borderRadius: "radius2",
                      fontFamily: "body",
                      fontSize: "xs",
                      fontWeight: 600,
                      lineHeight: 1,
                      whiteSpace: "nowrap",
                      color: tool.isDestructive
                        ? "paragraph-error"
                        : "buttonForeground-secondary",
                      ":disabled": { opacity: 0.4, cursor: "default" }
                    }}
                  >
                    <tool.icon
                      size={13}
                      color={
                        tool.isDestructive
                          ? "paragraph-error"
                          : "buttonForeground-secondary"
                      }
                    />
                    {tool.title}
                  </Button>
                ))}
              </Flex>
              <Button
                ref={sortButtonRef}
                variant="new_bordered"
                data-test-id="attachments-sort-button"
                onClick={() => {
                  Menu.openMenu(getSortMenuItems(sortBy, setSortBy), {
                    position: {
                      target: sortButtonRef.current,
                      isTargetAbsolute: true,
                      location: "below",
                      align: "end",
                      yOffset: 5
                    }
                  });
                }}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexShrink: 0,
                  width: 123,
                  height: 41,
                  px: "spacing4",
                  py: "spacing5",
                  borderRadius: "radius2",
                  fontFamily: "body",
                  fontSize: "sm",
                  fontWeight: 600,
                  lineHeight: 1,
                  color: "buttonForeground-secondary"
                }}
              >
                {strings.sortBy()}
                <CaretDownOutline
                  size={13}
                  color="buttonForeground-secondary"
                />
              </Button>
            </Flex>
            {!attachments ? (
              <Loader title={strings.loading() + "..."} />
            ) : attachments.length === 0 ? (
              <Flex sx={{ flex: 1, flexDirection: "column" }}>
                <table style={TABLE_STYLE}>
                  <thead>{header}</thead>
                </table>
                <Flex
                  sx={{
                    flex: 1,
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  <Text
                    variant="body"
                    sx={{
                      width: 208,
                      fontSize: "sm",
                      lineHeight: 1.2,
                      color: "paragraph",
                      textAlign: "center"
                    }}
                  >
                    No attachments yet. Upload a file to get started.
                  </Text>
                </Flex>
              </Flex>
            ) : (
              <FlexScrollContainer style={{ flex: 1, minHeight: 0 }}>
                <VirtualizedTable
                  style={TABLE_STYLE}
                  header={header}
                  mode="fixed"
                  estimatedSize={29}
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
              </FlexScrollContainer>
            )}
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
  if (!item?.item)
    return (
      <tr ref={props.rowRef} style={{ ...props.style, height: 29 }}>
        <td colSpan={COLUMNS.length + 1} />
      </tr>
    );
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
    icon: FileDoc,
    title: strings.mediaTypes.all()
  },
  {
    id: "images",
    icon: Picture,
    title: strings.mediaTypes.image()
  },
  {
    id: "documents",
    icon: FileDoc,
    title: strings.mediaTypes.document()
  },
  {
    id: "videos",
    icon: Play,
    title: strings.mediaTypes.video()
  },
  {
    id: "audio",
    icon: MusicNotes,
    title: strings.mediaTypes.audio()
  },
  {
    id: "uploads",
    icon: Upload,
    title: strings.uploads()
  },
  {
    id: "orphaned",
    icon: Warning,
    title: strings.orphaned()
  }
];

const sidebarActionStyle = {
  display: "flex",
  alignItems: "center",
  gap: "spacing3",
  width: "100%",
  px: "spacing3",
  py: "spacing4",
  borderRadius: "radius1",
  bg: "transparent",
  fontFamily: "body",
  fontSize: "xs",
  fontWeight: 500,
  lineHeight: 1,
  color: "buttonForeground-secondary",
  textAlign: "left"
} as const;

const PROGRESS_RADIUS = 7;
const PROGRESS_CIRCUMFERENCE = 2 * Math.PI * PROGRESS_RADIUS;
function ProgressCircle({ progress }: { progress: number }) {
  const value = Math.min(1, Math.max(0, progress || 0));
  return (
    <svg
      width={16}
      height={16}
      viewBox="0 0 16 16"
      style={{ flexShrink: 0 }}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(value * 100)}
    >
      <circle
        cx="8"
        cy="8"
        r={PROGRESS_RADIUS}
        fill="none"
        strokeWidth="2"
        stroke="var(--background-tertiary)"
      />
      <circle
        cx="8"
        cy="8"
        r={PROGRESS_RADIUS}
        fill="none"
        strokeWidth="2"
        stroke="var(--accent)"
        strokeDasharray={PROGRESS_CIRCUMFERENCE}
        strokeDashoffset={PROGRESS_CIRCUMFERENCE * (1 - value)}
        transform="rotate(-90 8 8)"
      />
    </svg>
  );
}

type SidebarProps = {
  onDownloadAll: () => void;
  route?: Route;
  onRouteChange: (route: Route) => void;
  search: string;
  onSearchChange: (search: string) => void;
  counts: Record<Route, number>;
};
function Sidebar(props: SidebarProps) {
  const {
    route,
    onRouteChange,
    search,
    onSearchChange,
    counts,
    onDownloadAll
  } = props;
  const downloadStatus = useStore((store) => store.status);
  const cancelDownload = useStore((store) => store.cancel);
  const user = useUserStore((store) => store.user);
  const result = usePromise(() => db.attachments.totalSize());

  const storagePercent =
    user?.totalStorage && user.totalStorage > 0
      ? Math.min(100, ((user.storageUsed || 0) / user.totalStorage) * 100)
      : 0;

  return (
    <Flex
      sx={{
        flexShrink: 0,
        flexDirection: "column",
        justifyContent: "space-between",
        gap: "spacing13",
        width: 220,
        pr: "spacing4",
        borderRight: "1px solid var(--border-secondary)",
        overflowY: "auto"
      }}
    >
      <Flex sx={{ flexDirection: "column", gap: "spacing4" }}>
        <Field
          id="search"
          name="search"
          type="text"
          variant="clean"
          autoFocus
          leftIcon={SearchIcon}
          placeholder={strings.search()}
          sx={{ gap: 0, m: 0, width: "100%", height: "40px" }}
          styles={{
            input: {
              m: 0,
              p: "spacing4",
              pl: "spacing10",
              fontSize: "xs",
              color: "paragraph",
              bg: "background-secondary",
              borderRadius: "radius2",
              ":focus": {
                outline: "1px solid var(--accent)",
                outlineOffset: "-1px"
              },
              "::placeholder": {
                color: "paragraph-secondary",
                textAlign: "start"
              }
            }
          }}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        <Flex sx={{ flexDirection: "column" }}>
          {routes.map((item) => (
            <NavigationItem
              key={item.id}
              icon={item.icon}
              iconSize={15}
              title={item.title}
              onClick={() => onRouteChange(item.id)}
              selected={route === item.id}
              sx={{ px: "spacing3" }}
            >
              <Text
                sx={{
                  fontSize: "3xs",
                  lineHeight: 1,
                  color: route === item.id ? "paragraph" : "paragraph-secondary"
                }}
              >
                {counts[item.id]}
              </Text>
            </NavigationItem>
          ))}
        </Flex>
      </Flex>
      <Flex sx={{ flexDirection: "column", gap: "spacing4" }}>
        <Button
          variant="secondary"
          disabled={!!downloadStatus}
          title={strings.clearCache()}
          sx={{
            ...sidebarActionStyle,
            ":hover:not(:disabled)": { bg: "hover" },
            ":disabled": {
              opacity: 0.4,
              bg: "transparent",
              cursor: "default"
            }
          }}
          onClick={async () => {
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
          <PaintBrushHousehold size={15} color="buttonForeground-secondary" />
          {strings.clearCache()}
        </Button>
        {downloadStatus ? (
          <Flex sx={{ ...sidebarActionStyle, py: 0, height: 35 }}>
            <ProgressCircle
              progress={downloadStatus.current / downloadStatus.total}
            />
            <Text
              sx={{
                flex: 1,
                minWidth: 0,
                fontSize: "xs",
                fontWeight: 500,
                lineHeight: 1,
                color: "buttonForeground-secondary"
              }}
            >
              {strings.network.downloading()}…
            </Text>
            <Button
              variant="secondary"
              title={strings.network.cancelDownload()}
              onClick={() => cancelDownload()}
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                width: 20,
                height: 20,
                p: 0,
                bg: "hover",
                borderRadius: "3px"
              }}
            >
              <Close size={15} color="buttonForeground-secondary" />
            </Button>
          </Flex>
        ) : (
          <Button
            variant="secondary"
            title={strings.downloadAllAttachments()}
            sx={{
              ...sidebarActionStyle,
              ":hover:not(:disabled)": { bg: "hover" }
            }}
            onClick={() => onDownloadAll()}
          >
            <ArrowDownSvgIcon size={15} color="buttonForeground-secondary" />
            {strings.downloadAllAttachments()}
          </Button>
        )}
        <Box sx={{ height: "1px", bg: "separator" }} />
        <Flex sx={{ flexDirection: "column", gap: "spacing3" }}>
          <Flex sx={{ alignItems: "center", justifyContent: "space-between" }}>
            <Text sx={{ fontSize: "xs", lineHeight: 1, color: "paragraph" }}>
              {strings.files(counts.all)}
            </Text>
            {result.status === "fulfilled" && (
              <Text
                sx={{
                  fontSize: "3xs",
                  lineHeight: 1,
                  color: "paragraph-secondary"
                }}
              >
                {formatBytes(result.value || 0)}
              </Text>
            )}
          </Flex>
          {user?.totalStorage ? (
            <Box
              sx={{
                height: 6,
                borderRadius: "50px",
                bg: "background-secondary",
                overflow: "hidden"
              }}
            >
              <Box
                sx={{
                  width: `${storagePercent}%`,
                  height: "100%",
                  borderRadius: "50px",
                  bg: "accent"
                }}
              />
            </Box>
          ) : null}
        </Flex>
      </Flex>
    </Flex>
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
