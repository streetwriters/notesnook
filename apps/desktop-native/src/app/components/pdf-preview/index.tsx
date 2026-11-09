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

import { strings } from "@notesnook/intl";
import { files, shell } from "@platform";
import {
  Button,
  Flex,
  Input,
  PdfViewer,
  Text,
  type PdfViewerHandle,
  type PdfViewerState
} from "@ui";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Close,
  Download,
  Search,
  ZoomIn,
  ZoomOut,
  type Icon
} from "../icons";
import { ErrorText } from "../error-text";
import { saveAttachment } from "../../common/attachments";
import { writeToClipboard } from "../../utils/clipboard";
import Config from "../../utils/config";
import { showToast } from "../../utils/toast";

export type PdfPreviewProps = {
  fileUrl: string | Uint8Array;
  onClose?: () => void;
  hash?: string;
};

type PdfConfig = { scale: number; page: number };

function getPdfConfig(hash: string): PdfConfig {
  return Config.get(`pdf:config:${hash}`, { scale: 1, page: 0 });
}

function setPdfConfig(hash: string, config: Partial<PdfConfig>) {
  Config.set(`pdf:config:${hash}`, { ...getPdfConfig(hash), ...config });
}

function base64ToBytes(base64: string) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function toBytes(fileUrl: string | Uint8Array) {
  if (typeof fileUrl !== "string") return fileUrl;
  const prefix = "base64,";
  const index = fileUrl.indexOf(prefix);
  if (fileUrl.startsWith("data:") && index > -1)
    return base64ToBytes(fileUrl.slice(index + prefix.length));
  return undefined;
}

async function saveBytes(bytes: Uint8Array) {
  const file = await files.create("document.pdf");
  await file.write(bytes);
  await file.close();
}

export function PdfPreview(props: PdfPreviewProps) {
  const { fileUrl, onClose, hash } = props;
  const controller = useRef<PdfViewerHandle>(null);
  const [state, setState] = useState<PdfViewerState>();
  const [searchOpen, setSearchOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [pageText, setPageText] = useState("");
  const restored = useRef(false);

  const source = useMemo(() => {
    if (typeof fileUrl === "string" && !fileUrl.startsWith("data:")) {
      return { path: fileUrl.replace(/^file:\/\//, "") };
    }
    const bytes = toBytes(fileUrl);
    return bytes ? { bytes } : undefined;
  }, [fileUrl]);

  useEffect(() => {
    if (state?.status !== "ready" || restored.current || !hash) return;
    restored.current = true;
    const saved = getPdfConfig(hash);
    if (saved.scale && saved.scale !== 1)
      controller.current?.setZoom(saved.scale);
    if (saved.page > 1) controller.current?.goToPage(saved.page);
  }, [state?.status, hash]);

  useEffect(() => {
    if (state) setPageText(String(state.page));
  }, [state?.page]);

  useEffect(() => {
    if (!hash || !state || state.status !== "ready" || !restored.current)
      return;
    setPdfConfig(hash, { page: state.page, scale: state.zoom });
  }, [hash, state?.page, state?.zoom, state?.status]);

  async function download() {
    try {
      if (hash) return await saveAttachment(hash);
      const bytes = toBytes(fileUrl) ?? (await controller.current?.download());
      if (bytes) return await saveBytes(bytes);
      if (typeof fileUrl === "string") shell.openUrl(fileUrl);
    } catch (e) {
      showToast("error", (e as Error).message);
    }
  }

  async function copySelection() {
    const text = await controller.current?.getSelectedText();
    if (text) await writeToClipboard({ "text/plain": text });
  }

  const ready = state?.status === "ready";
  const search = state?.search;

  if (!source)
    return (
      <Flex
        testID="pdf-preview"
        sx={{ flex: 1, alignItems: "center", justifyContent: "center" }}
      >
        <Text variant="body">{strings.attachmentPreviewFailed()}</Text>
      </Flex>
    );

  return (
    <Flex testID="pdf-preview" sx={{ flex: 1, flexDirection: "column" }}>
      <Flex sx={{ p: 1, pt: 0, justifyContent: "space-between" }}>
        <ToolbarGroup>
          <ToolbarButton
            testID="pdf-search"
            icon={Search}
            title={strings.search()}
            onPress={() => {
              setSearchOpen((open) => !open);
              controller.current?.clearSearch();
            }}
          />
          <ToolbarButton
            testID="pdf-previous-page"
            icon={ChevronUp}
            disabled={!ready || state.page <= 1}
            title={strings.goToPreviousPage()}
            onPress={() => controller.current?.goToPage((state?.page ?? 1) - 1)}
          />
          <Input
            testID="pdf-page-input"
            value={pageText}
            onChangeText={setPageText}
            onSubmit={(text) => {
              const page = parseInt(text, 10);
              if (page >= 1) controller.current?.goToPage(page);
            }}
            sx={{ width: 45, mr: 1, px: 1, py: "2px" }}
          />
          <Text variant="body" sx={{ mr: 1 }}>
            / {state?.pageCount ?? 0}
          </Text>
          <ToolbarButton
            testID="pdf-next-page"
            icon={ChevronDown}
            disabled={!ready || state.page >= state.pageCount}
            title={strings.goToNextPage()}
            onPress={() => controller.current?.goToPage((state?.page ?? 1) + 1)}
          />
        </ToolbarGroup>
        <ToolbarGroup>
          <ToolbarButton
            testID="pdf-zoom-out"
            icon={ZoomOut}
            title={strings.zoomOut()}
            onPress={() => controller.current?.zoomOut()}
          />
          <Text testID="pdf-zoom" variant="body" sx={{ mx: 1 }}>
            {`${Math.round((state?.zoom ?? 1) * 100)}%`}
          </Text>
          <ToolbarButton
            testID="pdf-zoom-in"
            icon={ZoomIn}
            title={strings.zoomIn()}
            onPress={() => controller.current?.zoomIn()}
          />
        </ToolbarGroup>
        <ToolbarGroup>
          <ToolbarButton
            testID="pdf-download"
            icon={Download}
            title={strings.network.download()}
            onPress={download}
          />
          {onClose ? (
            <ToolbarButton
              testID="pdf-close"
              icon={Close}
              title={strings.close()}
              onPress={onClose}
            />
          ) : null}
        </ToolbarGroup>
      </Flex>
      {searchOpen ? (
        <Flex sx={{ px: 1, pb: 1, gap: 1, alignItems: "center" }}>
          <Input
            testID="pdf-search-input"
            autoFocus
            placeholder={strings.search()}
            onSubmit={(text) => controller.current?.search(text)}
            sx={{ width: 240 }}
          />
          <Text variant="body">
            {search && search.hits > 0
              ? `${search.active + 1} / ${search.hits}`
              : search?.status === "complete"
              ? "0"
              : ""}
          </Text>
          <ToolbarButton
            icon={ChevronUp}
            title={strings.goToPreviousPage()}
            onPress={() => controller.current?.previousHit()}
          />
          <ToolbarButton
            icon={ChevronDown}
            title={strings.goToNextPage()}
            onPress={() => controller.current?.nextHit()}
          />
        </Flex>
      ) : null}
      {state?.status === "locked" ? (
        <Flex
          sx={{
            flex: 1,
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            mx: 2
          }}
        >
          <Text variant="heading" sx={{ fontSize: 28, textAlign: "center" }}>
            {strings.pdfLocked()}
          </Text>
          <Text
            variant="subtitle"
            sx={{ mt: 1, mb: 4, textAlign: "center", color: "paragraph" }}
          >
            {strings.pdfLockedDesc()}.
          </Text>
          <Input
            testID="document-password"
            autoFocus
            type="password"
            value={password}
            onChangeText={setPassword}
            placeholder={strings.enterPassword()}
            onSubmit={(text) => controller.current?.unlock(text)}
            sx={{ width: "95%", maxWidth: 400 }}
          />
          {state.passwordIncorrect ? (
            <ErrorText error={strings.passwordIncorrect()} />
          ) : null}
          <Button
            testID="unlock-note-submit"
            variant="accent"
            onPress={() => controller.current?.unlock(password)}
            sx={{ mt: 3, borderRadius: 100, px: 30 }}
          >
            <Text>{strings.unlock()}</Text>
          </Button>
        </Flex>
      ) : state?.status === "error" ? (
        <Flex sx={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ErrorText error={state.error ?? strings.attachmentPreviewFailed()} />
        </Flex>
      ) : null}
      <Flex
        onKeyDown={(event) => {
          if (event.key === "c" && (event.metaKey || event.ctrlKey))
            copySelection();
        }}
        sx={{
          flex: state?.status === "locked" || state?.status === "error" ? 0 : 1
        }}
      >
        <PdfViewer
          ref={controller}
          source={source}
          onStateChange={setState}
          sx={{ flex: 1 }}
        />
      </Flex>
    </Flex>
  );
}

export default PdfPreview;

function ToolbarGroup(props: { children: React.ReactNode }) {
  return (
    <Flex
      sx={{
        bg: "background-secondary",
        borderRadius: "default",
        overflow: "hidden",
        alignItems: "center"
      }}
    >
      {props.children}
    </Flex>
  );
}

function ToolbarButton(props: {
  testID?: string;
  title: string;
  icon: Icon;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <Button
      testID={props.testID}
      variant="secondary"
      disabled={props.disabled}
      onPress={props.onPress}
      sx={{
        bg: "transparent",
        borderRadius: 0,
        flexShrink: 0,
        alignItems: "center"
      }}
    >
      <props.icon size={18} color="icon" />
    </Button>
  );
}
