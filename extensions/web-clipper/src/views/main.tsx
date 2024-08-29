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
import { Box, Button, Flex, Input, Text } from "@theme-ui/components";
import { useEffect, useRef, useState } from "react";
import { browser } from "webextension-polyfill-ts";
import { Icons } from "../components/icons";
import { Icon } from "../components/icons/icon";
import { NotePicker } from "../components/note-picker";
import { NotebookPicker } from "../components/notebook-picker";
import { TagPicker } from "../components/tag-picker";
import {
  ItemReference,
  SelectedReference,
  ClipArea,
  ClipMode,
  ClipData
} from "../common/bridge";
import { usePersistentState } from "../hooks/use-persistent-state";
import { deleteClip, getClip } from "../utils/storage";
import { useAppStore } from "../stores/app-store";
import { connectApi } from "../api";
import { FlexScrollContainer } from "../components/scroll-container";
import { DEFAULT_SETTINGS, SETTINGS_KEY } from "./settings";
import type { Config } from "@notesnook/clipper/dist/types";

const ERROR_MAP: Record<string, string> = {
  "Could not establish connection. Receiving end does not exist.":
    "Please refresh this web page and try again. If the error persists, it means you don't have the required permission."
};
const clipAreas: { name: string; id: ClipArea; icon: string }[] = [
  {
    name: "Full page",
    id: "full-page",
    icon: Icons.fullPage
  },
  {
    name: "Article",
    id: "article",
    icon: Icons.article
  },
  {
    name: "Visible area",
    id: "visible",
    icon: Icons.visible
  },
  {
    name: "Selected nodes",
    id: "selection",
    icon: Icons.selection
  }
];

const clipModes: { name: string; id: ClipMode; icon: string; pro?: boolean }[] =
  [
    {
      name: "Simplified",
      id: "simplified",
      icon: Icons.simplified
    },
    {
      name: "Screenshot",
      id: "screenshot",
      icon: Icons.screenshot,
      pro: true
    },
    {
      name: "Complete with styles",
      id: "complete",
      icon: Icons.complete,
      pro: true
    }
  ];

export function Main() {
  const [error, setError] = useState<string>();
  // const [colorMode, setColorMode] = useColorMode();

  const isPremium = useAppStore((s) => s.user?.pro);
  const navigate = useAppStore((s) => s.navigate);

  const [settings] = usePersistentState<Config>(SETTINGS_KEY, DEFAULT_SETTINGS);
  const [title, setTitle] = useState<string>();
  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const [url, setUrl] = useState<string>();
  const [clipNonce, setClipNonce] = useState(0);
  const [clipMode, setClipMode] = usePersistentState<ClipMode>(
    "clipMode",
    "simplified"
  );
  const [clipArea, setClipArea] = usePersistentState<ClipArea>(
    "clipArea",
    "article"
  );
  const [isClipping, setIsClipping] = useState(false);
  const [note, setNote] = usePersistentState<ItemReference>("note");
  const [refs, setRefs] = usePersistentState<SelectedReference[]>("refs", []);
  const [clipData, setClipData] = useState<ClipData>();
  const pageTitle = useRef<string>();

  useEffect(() => {
    (async () => {
      const [tab] = await browser.tabs.query({
        active: true,
        currentWindow: true,
        windowType: "normal"
      });

      setTitle(tab?.title ? tab.title : "Untitled");
      setUrl(tab?.url);
      pageTitle.current = tab.title;
    })();
  }, []);

  useEffect(() => {
    (async () => {
      if (!clipArea || !clipMode) return;
      if (
        !isPremium &&
        (clipMode === "complete" || clipMode === "screenshot")
      ) {
        setClipMode("simplified");
        return;
      }

      try {
        setIsClipping(true);
        setClipData(
          await clip(clipArea, clipMode, {
            ...DEFAULT_SETTINGS,
            ...settings,
            images: isPremium,
            inlineImages: isPremium
          })
        );
      } catch (e) {
        console.error(e);
        if (e instanceof Error) setError(e.message);
      } finally {
        setIsClipping(false);
      }
    })();
  }, [isPremium, clipArea, clipMode, clipNonce]);

  useEffect(() => {
    (async () => {
      if (!settings || !settings.corsProxy) return;
      setHasPermission(
        await browser.permissions.contains({
          origins: [`${settings.corsProxy}/*`]
        })
      );
    })();
  }, [settings]);

  if (!hasPermission && !!settings?.corsProxy) {
    return (
      <FlexScrollContainer style={{ maxHeight: 560 }}>
        <Flex
          sx={{
            flexDirection: "column",
            p: 2,
            width: 320,
            backgroundColor: "background"
          }}
        >
          <Text
            variant="subtitle"
            sx={{ mt: 2, mb: 1, color: "icon", fontSize: "body" }}
          >
            Permission required
          </Text>
          <Text
            variant="body"
            sx={{ mt: 2, mb: 1, color: "icon", fontSize: "body" }}
          >
            Permission is required to use the CORS proxy: {settings.corsProxy}
          </Text>
          <Button
            variant="accent"
            onClick={async () => {
              if (!settings.corsProxy) return;
              setHasPermission(
                await browser.permissions.request({
                  origins: [`${settings.corsProxy}/*`]
                })
              );
            }}
          >
            Grant permission
          </Button>
        </Flex>
      </FlexScrollContainer>
    );
  }

  return (
    <FlexScrollContainer style={{ maxHeight: 560 }}>
      <Flex
        sx={{
          flexDirection: "column",
          p: 2,
          width: 320,
          backgroundColor: "background"
        }}
      >
        <Input
          sx={{
            p: "small",
            fontStyle: "italic"
          }}
          onChange={(e) => setTitle(e.target.value)}
          value={title || ""}
          placeholder="Untitled"
        />

        <Text
          variant="subtitle"
          sx={{ mt: 2, mb: 1, color: "icon", fontSize: "body" }}
        >
          Clipping area
        </Text>

        {clipAreas.map((item) => (
          <Button
            key={item.id}
            variant="icon"
            onClick={() => {
              setClipArea(item.id);
              setClipNonce((s) => ++s);
            }}
            disabled={isClipping}
            sx={{
              display: "flex",
              borderRadius: "default",
              textAlign: "left",
              justifyContent: "space-between",
              alignItems: "center",
              px: 1
            }}
          >
            <Flex>
              <Icon path={item.icon} color="icon" size={16} />
              <Text variant="body" sx={{ ml: 1 }}>
                {item.name}
              </Text>
            </Flex>

            {clipArea === item.id && (
              <Icon
                path={isClipping ? Icons.loading : Icons.check}
                size={16}
                rotate={isClipping}
              />
            )}
          </Button>
        ))}

        <Text
          variant="subtitle"
          sx={{ mt: 1, mb: 2, color: "icon", fontSize: "body" }}
        >
          Clipping mode
        </Text>

        {clipModes.map((item) => (
          <Button
            key={item.id}
            variant="icon"
            onClick={() => {
              setClipMode(item.id);
              setClipNonce((s) => ++s);
            }}
            disabled={isClipping || (item.pro && !isPremium)}
            sx={{
              display: "flex",
              borderRadius: "default",
              textAlign: "left",
              justifyContent: "space-between",
              alignItems: "center",
              px: 1
            }}
          >
            <Flex>
              <Icon path={item.icon} color="icon" size={16} />
              <Text variant="body" sx={{ ml: 1 }}>
                {item.name}
              </Text>
            </Flex>

            {clipMode === item.id && (
              <Icon
                path={isClipping ? Icons.loading : Icons.check}
                size={16}
                rotate={isClipping}
              />
            )}
          </Button>
        ))}

        {clipData && clipData.data && !isClipping && (
          <Text
            variant="body"
            sx={{
              mt: 1,
              bg: "shade",
              color: "accent",
              p: 1,
              border: "1px solid var(--accent)",
              borderRadius: "default",
              cursor: "pointer",
              ":hover": {
                filter: "brightness(80%)"
              }
            }}
            onClick={async () => {
              const winUrl = URL.createObjectURL(
                new Blob(["\ufeff", clipData.data], { type: "text/html" })
              );
              await browser.windows.create({
                url: winUrl
              });
            }}
          >
            Clip done. Click here to preview.
          </Text>
        )}

        {error && (
          <Text
            variant="body"
            sx={{
              mt: 1,
              bg: "var(--background-error)",
              color: "var(--paragraph-error)",
              p: 1,
              border: "1px solid var(--border-error)",
              borderRadius: "default",
              cursor: "pointer",
              ":hover": {
                filter: "brightness(80%)"
              }
            }}
            onClick={async () => {
              setClipNonce((s) => ++s);
            }}
          >
            {ERROR_MAP[error] || error}
            <br />
            Click here to retry.
          </Text>
        )}

        <Text
          variant="subtitle"
          sx={{ mt: 1, mb: 2, color: "icon", fontSize: "body" }}
        >
          Organization
        </Text>

        {refs?.length ? null : (
          <NotePicker
            selectedNote={note}
            onSelected={(note) => setNote(note)}
          />
        )}
        {note ? null : (
          <>
            {refs?.length ? null : (
              <Text variant="subBody" sx={{ my: 1, textAlign: "center" }}>
                — or —
              </Text>
            )}
            <NotebookPicker
              selectedItems={refs?.filter((r) => r.type === "notebook") || []}
              onSelected={(items) => setRefs(items)}
            />
            <Box sx={{ mt: 1 }} />
            <TagPicker
              selectedTags={refs?.filter((r) => r.type === "tag") || []}
              onSelected={(tags) => setRefs(tags)}
            />
          </>
        )}
        <Button
          variant="accent"
          sx={{ mt: 1 }}
          disabled={!clipData}
          onClick={async () => {
            if (!clipData || !title || !clipArea || !clipMode || !url) return;

            const notesnook = await connectApi(false);
            if (!notesnook) {
              setError("You are not connected to Notesnook.");
              return;
            }
            await notesnook.saveClip({
              url,
              title,
              area: clipArea,
              mode: clipMode,
              note,
              refs,
              pageTitle: pageTitle.current,
              ...clipData
            });

            setClipData(undefined);

            await browser.notifications?.create({
              title: "Clip saved!",
              message: "Open the Notesnook app to view the result.",
              type: "basic",
              iconUrl: browser.runtime.getURL("256x256.png"),
              isClickable: false
            });

            window.close();
          }}
        >
          Save clip
        </Button>

        <Flex
          sx={{
            mt: 2,
            pt: 1,
            borderTop: "1px solid var(--border)",
            justifyContent: "flex-end"
          }}
        >
          <Button
            variant="icon"
            sx={{ p: 1 }}
            onClick={() => {
              navigate("/settings");
            }}
          >
            <Icon path={Icons.settings} size={16} />
          </Button>
        </Flex>
      </Flex>
    </FlexScrollContainer>
  );
}

export async function clip(
  area: ClipArea,
  mode: ClipMode,
  settings: Config = DEFAULT_SETTINGS
): Promise<ClipData | undefined> {
  const clipData = await getClip();
  if (area === "selection" && typeof clipData === "string") {
    await deleteClip();
    return { data: clipData };
  }

  const [tab] = await browser.tabs.query({
    active: true,
    currentWindow: true,
    windowType: "normal"
  });
  if (!tab || !tab.id) return;

  if (browser.scripting) {
    await browser.scripting.executeScript({
      files: ["contentScript.bundle.js"],
      target: { tabId: tab.id }
    });
  } else {
    await browser.tabs.executeScript(tab.id, {
      file: "contentScript.bundle.js"
    });
  }

  if (area === "visible" && mode === "screenshot") {
    if (!tab.height || !tab.width) return;

    const result = await browser.tabs.captureVisibleTab(undefined, {
      format: "jpeg",
      quality: 100
    });

    return {
      data: `<img src="${result}" width="${tab.width}px" height="${tab.height}px"/>`
    };
  }

  return await browser.tabs.sendMessage(tab.id, {
    type: "clip",
    mode,
    area,
    settings
  });
}
