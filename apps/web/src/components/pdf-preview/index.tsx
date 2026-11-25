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

import { Worker, Viewer, PasswordStatus } from "@react-pdf-viewer/core";
import "@react-pdf-viewer/core/lib/styles/index.css";
import { ToolbarSlot, toolbarPlugin } from "@react-pdf-viewer/toolbar";
import { Box, Button, Flex, Input, Text } from "@theme-ui/components";
import { RenderSearchProps, searchPlugin } from "@react-pdf-viewer/search";
import "@react-pdf-viewer/search/lib/styles/index.css";
import React, { PropsWithChildren, useRef, useState } from "react";
import { ThemeUIStyleObject } from "@theme-ui/core";
import {
  ArrowDownSvgIcon,
  ArrowUp,
  CaretDownSvgIcon,
  CaretUp,
  CheckIcon,
  Close,
  CornersIn,
  CornersOut,
  Icon,
  Loading,
  MagnifyingGlass,
  MagnifyingGlassMinus,
  MagnifyingGlassPlus
} from "../icons";
import { useStore as useThemeStore } from "../../stores/theme-store";
import Field from "../field";
import { LinkPlugin } from "./links-plugin";
import Config from "../../utils/config";
import { ErrorText } from "../error-text";
import { strings } from "@notesnook/intl";
import { ScopedThemeProvider } from "../theme-provider";
import { useWindowControls } from "../../hooks/use-window-controls";
import { isMac } from "../../utils/platform";

export type PdfPreviewProps = {
  fileUrl: string | Uint8Array;
  onClose?: () => void;
  hash?: string;
};
export function PdfPreview(props: PdfPreviewProps) {
  const { fileUrl, onClose, hash } = props;

  const toolbarInstance = toolbarPlugin({
    fullScreenPlugin: {
      renderExitFullScreenButton: (props) => (
        <Flex
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 2,
            alignItems: "center",
            bg: "background",
            px: "spacing4",
            py: "spacing3"
          }}
        >
          <ToolbarButton
            icon={CornersIn}
            title={strings.exitFullScreen()}
            size={25}
            onClick={props.onClick}
          />
        </Flex>
      )
    }
  });
  const { Toolbar } = toolbarInstance;
  const searchPluginInstance = searchPlugin();
  const { Search } = searchPluginInstance;

  const theme = useThemeStore((state) => state.colorScheme);
  const { isFullscreen, hasNativeWindowControls } = useWindowControls();
  const showTrafficLights =
    IS_DESKTOP_APP && isMac() && !isFullscreen && !window.hasNativeTitlebar;

  const topBarRef = useRef<HTMLDivElement>(null);
  const searchButtonRef = useRef<HTMLDivElement>(null);
  const [searchPopoverLeft, setSearchPopoverLeft] = useState<number>();
  const isSearchOpen = searchPopoverLeft !== undefined;

  function toggleSearch() {
    if (isSearchOpen) return setSearchPopoverLeft(undefined);
    const topBar = topBarRef.current?.getBoundingClientRect();
    const searchButton = searchButtonRef.current?.getBoundingClientRect();
    if (!topBar || !searchButton) return;
    setSearchPopoverLeft(searchButton.left - topBar.left);
  }

  return (
    <Worker workerUrl="/pdf.worker.min.js">
      <ScopedThemeProvider
        ref={topBarRef}
        scope="titleBar"
        sx={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
          bg: "transparent",
          borderBottom: "1px solid",
          borderBottomColor: "border",
          // the macOS traffic lights are positioned at (10, 14) for a 45px
          // title bar (see trafficLightPosition in apps/desktop), so the bar
          // is sized and padded to make them land centered inside the
          // reserved slot of the first pill.
          pl: showTrafficLights ? "spacing2" : "spacing4",
          pr: "spacing4",
          py: showTrafficLights ? "spacing2" : "spacing3"
        }}
      >
        <Toolbar>
          {(props: ToolbarSlot) => {
            const {
              CurrentPageInput,
              CurrentScale,
              GoToNextPage,
              GoToPreviousPage,
              NumberOfPages,
              EnterFullScreen
            } = props;

            return (
              <>
                <ToolbarGroup
                  sx={{
                    ".rpv-core__textbox": {
                      width: "50px",
                      height: "21px",
                      p: "spacing2",
                      borderRadius: "radius1",
                      bg: "background",
                      border: "none",
                      outline: "none",
                      fontFamily: "body",
                      fontWeight: 500,
                      fontSize: "3xs",
                      lineHeight: 1,
                      color: "paragraph-selected",
                      textAlign: "left",
                      WebkitAppRegion: "no-drag",
                      ":focus": {
                        outline: "1px solid var(--accent)"
                      }
                    }
                  }}
                >
                  {showTrafficLights ? (
                    <>
                      <Box
                        sx={{ width: "53px", height: "13px", flexShrink: 0 }}
                      />
                      <ToolbarSeparator />
                    </>
                  ) : null}
                  <Flex ref={searchButtonRef}>
                    <ToolbarButton
                      icon={MagnifyingGlass}
                      title={strings.search()}
                      size={20}
                      filled={isSearchOpen}
                      onClick={toggleSearch}
                    />
                  </Flex>
                  <ToolbarSeparator />
                  <GoToPreviousPage>
                    {(props) => (
                      <ToolbarButton
                        icon={CaretUp}
                        disabled={props.isDisabled}
                        title={strings.goToPreviousPage()}
                        size={20}
                        onClick={props.onClick}
                      />
                    )}
                  </GoToPreviousPage>
                  <CurrentPageInput />
                  <Flex
                    sx={{
                      width: "86px",
                      p: "spacing2",
                      borderRadius: "radius2",
                      alignItems: "center",
                      justifyContent: "space-between"
                    }}
                  >
                    <NumberOfPages>
                      {(props) => (
                        <Text
                          sx={{
                            fontFamily: "body",
                            fontSize: "3xs",
                            fontWeight: 500,
                            lineHeight: 1,
                            color: "icon-secondary"
                          }}
                        >
                          / {props.numberOfPages}
                        </Text>
                      )}
                    </NumberOfPages>
                    <GoToNextPage>
                      {(props) => (
                        <ToolbarButton
                          icon={CaretDownSvgIcon}
                          disabled={props.isDisabled}
                          title={strings.goToNextPage()}
                          size={20}
                          sx={{ m: "-3.5px" }}
                          onClick={props.onClick}
                        />
                      )}
                    </GoToNextPage>
                  </Flex>
                </ToolbarGroup>

                <ToolbarGroup>
                  <props.ZoomIn>
                    {(props) => (
                      <ToolbarButton
                        icon={MagnifyingGlassPlus}
                        title={strings.zoomIn()}
                        size={25}
                        onClick={props.onClick}
                      />
                    )}
                  </props.ZoomIn>
                  <CurrentScale>
                    {(props) => (
                      <Text
                        sx={{
                          fontFamily: "body",
                          fontSize: "xs",
                          fontWeight: 400,
                          lineHeight: 1,
                          color: "paragraph"
                        }}
                      >{`${Math.round(props.scale * 100)}%`}</Text>
                    )}
                  </CurrentScale>
                  <props.ZoomOut>
                    {(props) => (
                      <ToolbarButton
                        icon={MagnifyingGlassMinus}
                        title={strings.zoomOut()}
                        size={25}
                        onClick={props.onClick}
                      />
                    )}
                  </props.ZoomOut>
                </ToolbarGroup>

                <ToolbarGroup
                  sx={{
                    mr:
                      hasNativeWindowControls && !isMac()
                        ? `calc(100vw - env(titlebar-area-width))`
                        : 0
                  }}
                >
                  <props.Download>
                    {(props) => (
                      <ToolbarButton
                        icon={ArrowDownSvgIcon}
                        title={strings.network.download()}
                        size={25}
                        onClick={props.onClick}
                      />
                    )}
                  </props.Download>
                  <EnterFullScreen>
                    {(props) => (
                      <ToolbarButton
                        icon={CornersOut}
                        title={strings.enterFullScreen()}
                        size={25}
                        onClick={props.onClick}
                      />
                    )}
                  </EnterFullScreen>

                  {onClose && (
                    <ToolbarButton
                      icon={Close}
                      title={strings.close()}
                      size={25}
                      onClick={onClose}
                    />
                  )}
                </ToolbarGroup>
              </>
            );
          }}
        </Toolbar>
        {isSearchOpen ? (
          <Search>
            {(props) => (
              <SearchPopover
                {...props}
                left={searchPopoverLeft}
                onClose={() => setSearchPopoverLeft(undefined)}
              />
            )}
          </Search>
        ) : null}
      </ScopedThemeProvider>
      <Viewer
        fileUrl={fileUrl}
        theme={theme}
        initialPage={hash ? getPDFConfig(hash).page : 1}
        defaultScale={hash ? getPDFConfig(hash).scale : 1}
        onPageChange={(e) => {
          if (hash) setPDFConfig(hash, { page: e.currentPage });
        }}
        onZoom={(e) => {
          if (hash) setPDFConfig(hash, { scale: e.scale });
        }}
        transformGetDocumentParams={(options) => {
          (options as any).isEvalSupported = false;
          return options;
        }}
        // onDocumentAskPassword={(e) => {
        //   e.verifyPassword("failed");
        // }}
        renderProtectedView={(props) => (
          <Flex
            mx={2}
            sx={{
              flex: "1",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "100%"
            }}
          >
            <Flex
              sx={{
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <Text
                data-test-id="unlock-note-title"
                variant="heading"
                sx={{ fontSize: 28, textAlign: "center" }}
              >
                {strings.pdfLocked()}
              </Text>
            </Flex>
            <Text
              variant="subheading"
              mt={1}
              mb={4}
              sx={{ textAlign: "center", color: "paragraph" }}
            >
              {strings.pdfLockedDesc()}.
            </Text>
            <Field
              id="document-password"
              autoFocus
              sx={{ width: "95%", maxWidth: 400 }}
              placeholder={strings.enterPassword()}
              type="password"
              onKeyUp={async (e: React.KeyboardEvent<HTMLInputElement>) => {
                if (e.key === "Enter") {
                  props.verifyPassword(e.currentTarget.value);
                }
              }}
            />
            {props.passwordStatus === PasswordStatus.WrongPassword && (
              <ErrorText error={strings.passwordIncorrect()} />
            )}
            <Button
              mt={3}
              variant="accent"
              data-test-id="unlock-note-submit"
              sx={{ borderRadius: 100, px: 30 }}
              onClick={async () => {}}
            >
              {strings.unlock()}
            </Button>
          </Flex>
        )}
        plugins={[toolbarInstance, searchPluginInstance, LinkPlugin()]}
      ></Viewer>
    </Worker>
  );
}
export default PdfPreview;

function ToolbarGroup(
  props: PropsWithChildren<{ sx?: ThemeUIStyleObject }>
) {
  const { sx, children } = props;
  return (
    <ScopedThemeProvider
      scope="base"
      sx={{
        display: "flex",
        alignItems: "center",
        flexShrink: 0,
        gap: "spacing3",
        p: "spacing2",
        bg: "background-secondary",
        borderRadius: "radius2",
        ...sx
      }}
    >
      {children}
    </ScopedThemeProvider>
  );
}

function ToolbarSeparator() {
  return (
    <ScopedThemeProvider
      scope="titleBar"
      sx={{ width: "1px", height: "13px", flexShrink: 0, bg: "border" }}
    />
  );
}

type ToolbarButtonProps = {
  title: string;
  disabled?: boolean;
  onClick: () => void;
  icon: Icon;
  size: 20 | 25;
  filled?: boolean;
  sx?: React.ComponentProps<typeof Button>["sx"];
};
function ToolbarButton(props: ToolbarButtonProps) {
  const { title, disabled, onClick, size, filled, sx } = props;

  return (
    <Button
      data-test-id={title}
      disabled={disabled}
      variant="primary"
      title={title}
      sx={{
        display: "flex",
        flexShrink: 0,
        alignItems: "center",
        justifyContent: "center",
        width: `${size}px`,
        height: `${size}px`,
        p: 0,
        borderRadius: "radius1",
        bg: filled ? "hover" : "transparent",
        ":hover:not(:disabled):not(:active)": {
          bg: filled ? "hover-secondary" : "hover"
        },
        ...sx
      }}
      onClick={onClick}
    >
      <props.icon size={13} color="icon" />
    </Button>
  );
}

type SearchPopoverProps = RenderSearchProps & {
  left: number;
  onClose: () => void;
};
function SearchPopover(props: SearchPopoverProps) {
  const {
    left,
    onClose,
    clearKeyword,
    changeMatchCase,
    changeWholeWords,
    currentMatch,
    jumpToNextMatch,
    jumpToPreviousMatch,
    keyword,
    matchCase,
    numberOfMatches,
    wholeWords,
    search,
    setKeyword
  } = props;
  const [isQuerying, setIsQuerying] = useState(false);
  const [searchDone, setSearchDone] = useState(false);

  function performSearch() {
    setIsQuerying(true);
    search().then(() => {
      setIsQuerying(false);
      setSearchDone(true);
    });
  }

  function close() {
    onClose();
    clearKeyword();
  }

  return (
    <ScopedThemeProvider
      scope="base"
      sx={{
        position: "absolute",
        // positioned against the bar's padding box, so skip its bottom border
        top: "calc(100% + 1px)",
        left,
        zIndex: 10,
        width: "180px",
        display: "flex",
        flexDirection: "column",
        gap: "spacing4",
        py: "spacing4",
        bg: "background",
        border: "1px solid",
        borderColor: "border-secondary",
        borderRadius: "radius2",
        boxShadow: "0px 4px 12.5px rgba(0, 0, 0, 0.05)",
        WebkitAppRegion: "no-drag"
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.preventDefault();
          e.stopPropagation();
          close();
        }
      }}
    >
      <Flex sx={{ flexDirection: "column" }}>
        <Flex
          sx={{
            alignItems: "center",
            gap: "spacing3",
            px: "spacing4",
            py: "spacing3",
            bg: "background-secondary",
            border: "1px solid",
            borderColor: "accent",
            borderRadius: "radius2"
          }}
        >
          <MagnifyingGlass size={13} color="icon" />
          <Input
            autoFocus
            placeholder={strings.search()}
            value={keyword}
            onChange={(e) => {
              setSearchDone(false);
              setKeyword(e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && keyword) {
                searchDone ? jumpToNextMatch() : performSearch();
              }
            }}
            sx={{
              flex: 1,
              minWidth: 0,
              height: "12px",
              p: 0,
              border: "none",
              outline: "none",
              bg: "transparent",
              fontFamily: "body",
              fontSize: "xxs",
              lineHeight: 1,
              color: "heading",
              ":focus": { outline: "none" },
              ":hover:not(:focus)": { outline: "none" }
            }}
          />
          <Flex
            sx={{ flexShrink: 0, height: "20px", alignItems: "center" }}
          >
            {isQuerying ? (
              <Loading size={11} color="icon-secondary" />
            ) : (
              <Text
                sx={{
                  fontFamily: "body",
                  fontSize: "3xs",
                  fontWeight: 500,
                  lineHeight: 1,
                  color: "icon-secondary"
                }}
              >
                {currentMatch}/{numberOfMatches}
              </Text>
            )}
          </Flex>
        </Flex>
        <SearchOption
          label={strings.matchCase()}
          checked={matchCase}
          onChange={(checked) => {
            setSearchDone(false);
            changeMatchCase(checked);
          }}
        />
        <SearchOption
          label={strings.matchWholeWord()}
          checked={wholeWords}
          onChange={(checked) => {
            setSearchDone(false);
            changeWholeWords(checked);
          }}
        />
      </Flex>
      <Flex
        sx={{
          alignItems: "center",
          justifyContent: "space-between",
          px: "spacing4"
        }}
      >
        <Flex sx={{ alignItems: "center", gap: "spacing3" }}>
          <ToolbarButton
            icon={ArrowUp}
            title={strings.previousMatch()}
            size={20}
            filled
            disabled={currentMatch <= 1}
            onClick={jumpToPreviousMatch}
          />
          <ToolbarButton
            icon={ArrowDownSvgIcon}
            title={strings.nextMatch()}
            size={20}
            filled
            disabled={currentMatch > numberOfMatches - 1}
            onClick={jumpToNextMatch}
          />
        </Flex>
        <ToolbarButton
          icon={Close}
          title={strings.close()}
          size={20}
          onClick={close}
        />
      </Flex>
    </ScopedThemeProvider>
  );
}

function SearchOption(props: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  const { label, checked, onChange } = props;
  return (
    <Flex
      as="label"
      sx={{
        alignItems: "center",
        gap: "spacing3",
        px: "spacing4",
        py: "spacing3",
        cursor: "pointer"
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={{ position: "absolute", opacity: 0, width: 0, height: 0 }}
      />
      <Flex
        sx={{
          width: "15px",
          height: "15px",
          flexShrink: 0,
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "radius0",
          ...(checked
            ? { bg: "accent" }
            : { border: "1px solid var(--icon-disabled)" })
        }}
      >
        {checked ? <CheckIcon size={11} color="accentForeground" /> : null}
      </Flex>
      <Text
        sx={{
          fontFamily: "body",
          fontSize: "xxs",
          lineHeight: 1,
          color: "paragraph"
        }}
      >
        {label}
      </Text>
    </Flex>
  );
}

type PDFConfig = {
  scale: number;
  page: number;
};

function getPDFConfig(hash: string): PDFConfig {
  return Config.get(`pdf:config:${hash}`, { scale: 1, page: 0 });
}
function setPDFConfig(hash: string, config: Partial<PDFConfig>) {
  Config.set(`pdf:config:${hash}`, { ...getPDFConfig(hash), ...config });
}
