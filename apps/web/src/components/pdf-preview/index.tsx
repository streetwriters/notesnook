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
import { Button, Flex, Text } from "@theme-ui/components";
import { searchPlugin } from "@react-pdf-viewer/search";
import {
  ChevronDown,
  ChevronUp,
  Download,
  Fullscreen,
  Icon,
  ZoomIn,
  ZoomOut,
  Close,
  Search,
  Alert
} from "../icons";
import { useStore as useThemeStore } from "../../stores/theme-store";
import Field from "../field";
import { LinkPlugin } from "./links-plugin";
import Config from "../../utils/config";

export type PdfPreviewProps = {
  fileUrl: string | Uint8Array;
  onClose?: () => void;
  hash?: string;
};
export function PdfPreview(props: PdfPreviewProps) {
  const { fileUrl, onClose, hash } = props;

  const toolbarInstance = toolbarPlugin();
  const { Toolbar } = toolbarInstance;
  const searchPluginInstance = searchPlugin();
  const { ShowSearchPopover } = searchPluginInstance;

  const theme = useThemeStore((state) => state.theme);

  return (
    <Worker workerUrl="/pdf.worker.min.js">
      <Flex sx={{ p: 1, justifyContent: "space-between" }}>
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
                <Flex
                  sx={{
                    bg: "bgSecondary",
                    borderRadius: "default",
                    overflow: "hidden",
                    alignItems: "center",

                    ".rpv-search__popover label, .rpv-search__popover span": {
                      fontFamily: "body",
                      fontSize: "body"
                    },

                    ".rpv-core__popover-body, .rpv-core__arrow": {
                      bg: "background",
                      borderColor: "border"
                    },

                    ".rpv-search__popover-label-checkbox": {
                      accentColor: "var(--primary)"
                    },

                    ".rpv-core__textbox": {
                      width: "45px",
                      mr: 1,
                      borderRadius: "default",
                      px: 1,
                      py: "2px",
                      height: "auto",
                      bg: "background",
                      border: "none",
                      outline: "1.5px solid var(--border)",
                      fontFamily: "body",
                      fontWeight: "body",
                      fontSize: "input",
                      color: "paragraph",
                      ":focus": {
                        outline: "2px solid var(--primary)"
                      },
                      ":hover:not(:focus)": {
                        outline: "1.5px solid var(--dimPrimary)"
                      }
                    }
                  }}
                >
                  <ShowSearchPopover>
                    {(props) => (
                      <ToolbarButton
                        icon={Search}
                        title="Search"
                        onClick={props.onClick}
                      />
                    )}
                  </ShowSearchPopover>
                  <GoToPreviousPage>
                    {(props) => (
                      <ToolbarButton
                        icon={ChevronUp}
                        disabled={props.isDisabled}
                        title="Go to previous page"
                        onClick={props.onClick}
                      />
                    )}
                  </GoToPreviousPage>
                  <CurrentPageInput />
                  <NumberOfPages>
                    {(props) => (
                      <Text variant="body" sx={{ mr: 1 }}>
                        / {props.numberOfPages}
                      </Text>
                    )}
                  </NumberOfPages>
                  <GoToNextPage>
                    {(props) => (
                      <ToolbarButton
                        icon={ChevronDown}
                        disabled={props.isDisabled}
                        title="Go to next page"
                        onClick={props.onClick}
                      />
                    )}
                  </GoToNextPage>
                </Flex>

                <Flex
                  sx={{
                    bg: "bgSecondary",
                    borderRadius: "default",
                    overflow: "hidden",
                    alignItems: "center"
                  }}
                >
                  <props.ZoomOut>
                    {(props) => (
                      <ToolbarButton
                        icon={ZoomOut}
                        title="Zoom out"
                        onClick={props.onClick}
                      />
                    )}
                  </props.ZoomOut>
                  <CurrentScale>
                    {(props) => (
                      <Text variant="body" sx={{ mx: 1 }}>{`${Math.round(
                        props.scale * 100
                      )}%`}</Text>
                    )}
                  </CurrentScale>
                  <props.ZoomIn>
                    {(props) => (
                      <ToolbarButton
                        icon={ZoomIn}
                        title="Zoom in"
                        onClick={props.onClick}
                      />
                    )}
                  </props.ZoomIn>
                </Flex>

                <Flex
                  sx={{
                    bg: "bgSecondary",
                    borderRadius: "default",
                    overflow: "hidden",
                    alignItems: "center"
                  }}
                >
                  <props.Download>
                    {(props) => (
                      <ToolbarButton
                        icon={Download}
                        title="Download"
                        onClick={props.onClick}
                      />
                    )}
                  </props.Download>
                  <EnterFullScreen>
                    {(props) => (
                      <ToolbarButton
                        icon={Fullscreen}
                        title="Enter fullscreen"
                        onClick={props.onClick}
                      />
                    )}
                  </EnterFullScreen>

                  {onClose && (
                    <ToolbarButton
                      icon={Close}
                      title="Close"
                      onClick={onClose}
                    />
                  )}
                </Flex>
              </>
            );
          }}
        </Toolbar>
      </Flex>
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
                Unlock document
              </Text>
            </Flex>
            <Text
              variant="subheading"
              mt={1}
              mb={4}
              sx={{ textAlign: "center", color: "fontTertiary" }}
            >
              Please enter the password to unlock this document.
            </Text>
            <Field
              id="document-password"
              autoFocus
              sx={{ width: "95%", maxWidth: 400 }}
              placeholder="Enter password"
              type="password"
              onKeyUp={async (e: React.KeyboardEvent<HTMLInputElement>) => {
                if (e.key === "Enter") {
                  props.verifyPassword(e.currentTarget.value);
                }
              }}
            />
            {props.passwordStatus === PasswordStatus.WrongPassword && (
              <Flex
                mt={2}
                sx={{
                  alignItems: "center",
                  justifyContent: "center",
                  color: "error",
                  alignSelf: "flex-center"
                }}
              >
                <Alert color="error" size={12} />
                <Text ml={1} sx={{ fontSize: "body" }}>
                  Wrong password
                </Text>
              </Flex>
            )}
            <Button
              mt={3}
              variant="primary"
              data-test-id="unlock-note-submit"
              sx={{ borderRadius: 100, px: 30 }}
              onClick={async () => {}}
            >
              Unlock
            </Button>
          </Flex>
        )}
        plugins={[toolbarInstance, searchPluginInstance, LinkPlugin()]}
      ></Viewer>
    </Worker>
  );
}
export default PdfPreview;

type ToolbarButtonProps = {
  title: string;
  disabled?: boolean;
  hideOnMobile?: boolean;
  hidden?: boolean;
  onClick: () => void;
  icon: Icon;
  iconSize?: number;
};
function ToolbarButton(props: ToolbarButtonProps) {
  const { title, disabled, hideOnMobile, hidden, onClick, iconSize } = props;

  return (
    <Button
      data-test-id={title}
      disabled={disabled}
      variant="tool"
      bg="transparent"
      title={title}
      sx={{
        borderRadius: 0,
        display: [hideOnMobile ? "none" : "flex", hidden ? "none" : "flex"],
        color: !disabled ? "text" : "disabled",
        cursor: !disabled ? "pointer" : "not-allowed",
        flexDirection: "row",
        flexShrink: 0,
        alignItems: "center"
      }}
      onClick={onClick}
    >
      <props.icon
        size={iconSize || 18}
        color={!disabled ? "text" : "disabled"}
      />
    </Button>
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
