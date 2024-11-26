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
import "@notesnook/editor/styles/styles.css";
import { Monograph } from "./types";
import {
  Box,
  Button,
  Flex,
  Image,
  Input,
  Link,
  Text
} from "@theme-ui/components";
import { ClientOnly } from "remix-utils/client-only";
import { Editor } from "./editor.client";
import { formatDate } from "@notesnook/core";
import { slugify } from "../../utils/slugify";
import { useCallback, useEffect, useRef, useState } from "react";
import { NNCrypto } from "../../utils/nncrypto.client";
import { hashNavigate } from "../../utils/use-hash-location";
import { Icon } from "@notesnook/ui";
import {
  mdiAlertCircleOutline,
  mdiArrowUp,
  mdiClose,
  mdiListBoxOutline,
  mdiLockOutline
} from "@mdi/js";
import { Footer } from "../footer";
import ReportDialog from "./report-modal";

type TableOfContent = {
  title: string;
  id: string;
  level: number;
  node: HTMLElement;
};

const headings = ["h1", "h2", "h3", "h4", "h5", "h6"];

const levelsMap: Record<string, number> = {
  H1: 0,
  H2: 1,
  H3: 2,
  H4: 3,
  H5: 4,
  H6: 5
};

const selector = headings.map((h) => `.ProseMirror ${h}`).join(",");

function generateTableOfContents() {
  const toc: TableOfContent[] = [];
  const headings = document.querySelectorAll<HTMLHeadingElement>(selector);

  let level = -1;
  let currentHeading = 0;

  for (const heading of headings) {
    const isCalloutHeading = heading.closest(".callout");
    if (isCalloutHeading) {
      continue;
    }

    const text = heading.textContent || "<empty>";
    const nodeName = heading.nodeName;
    const headingLevel = levelsMap[nodeName];

    let id = "heading-" + slugify(text);
    const count = toc.filter((n) => n.id === id).length;
    if (count > 0) id = `${id}-${count}`;
    heading.setAttribute("id", id);

    level =
      currentHeading < headingLevel
        ? level + 1
        : currentHeading > headingLevel
        ? headingLevel
        : level;
    currentHeading = headingLevel;

    toc.push({
      title: text,
      id,
      level,
      node: heading
    });
  }
  return toc;
}

export const MonographPage = ({
  monograph,
  encodedKey
}: {
  monograph: Monograph;
  encodedKey?: string;
}) => {
  const [reportDialogVisible, setReportDialogVisible] = useState(false);
  const [tableOfContents, setTableOfContents] = useState<TableOfContent[]>([]);
  const [content, setContent] = useState(monograph.content);
  const [showTableOfContents, setShowTableOfContents] = useState(false);
  const editorContainer = useRef<HTMLDivElement>(null);

  if (!content && monograph.encryptedContent)
    return (
      <ClientOnly fallback={<div />}>
        {() => (
          <MonographLockscreen
            monograph={monograph}
            onUnlock={(content) => setContent(content)}
            encodedKey={encodedKey}
          />
        )}
      </ClientOnly>
    );

  return (
    <Flex
      sx={{ flexDirection: "column", fontFamily: "body", bg: "background" }}
    >
      <Box
        sx={{
          bg: "background-secondary",
          py: 4,
          top: 0,
          zIndex: 999,
          position: "sticky"
        }}
      >
        <Button
          sx={{ position: "absolute", top: 20, right: 20, p: 0 }}
          onClick={() => setShowTableOfContents((s) => !s)}
        >
          <Icon
            path={mdiListBoxOutline}
            size={24}
            color={showTableOfContents ? "var(--accent)" : "var(--icon)"}
          />
        </Button>
        <Box
          sx={{
            px: "10%",
            textAlign: "center"
          }}
        >
          <ResponsiveTitle title={monograph.title} />
        </Box>
      </Box>
      <Box
        sx={{
          bg: "background-secondary",
          borderBottom: "1px solid var(--border)",
          px: [10, 10, "15%"],
          pb: 20,
          pt: 100
        }}
      >
        <Text as="h1" variant="heading" sx={{ fontSize: 32, fontWeight: 800 }}>
          {monograph.title}
        </Text>
        <Flex sx={{ gap: 2 }}>
          <Text
            variant="subtitle"
            sx={{
              color: "paragraph-secondary"
            }}
          >
            {formatDate(monograph.datePublished, {
              type: "date-time",
              dateFormat: "YYYY-MM-DD",
              timeFormat: "24-hour"
            })}
          </Text>
          {monograph.encryptedContent ? (
            <Flex sx={{ gap: "2px" }}>
              <Icon path={mdiLockOutline} size={14} color="var(--accent)" />
              <Text
                variant="subtitle"
                sx={{
                  color: "accent"
                }}
              >
                End-to-end encrypted
              </Text>
            </Flex>
          ) : (
            <Button
              title="Report"
              onClick={() => {
                setReportDialogVisible(true);
              }}
              variant="anchor"
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                borderRadius: "default",
                textDecoration: "none"
              }}
            >
              <Icon
                path={mdiAlertCircleOutline}
                color="var(--paragraph-secondary)"
                size={16}
              />
              <Text variant="error" sx={{ color: "paragraph-secondary" }}>
                Report
              </Text>
            </Button>
          )}
          <Image
            sx={{ display: "none" }}
            src={`https://api.notesnook.com/monographs/${monograph.id}/view`}
          />
        </Flex>
      </Box>
      <Flex
        sx={{ mt: 10, justifyContent: "space-between", minHeight: "100vh" }}
      >
        <Box
          ref={editorContainer}
          sx={{
            ml: [10, 10, "15%"],
            mr: [10, 20],
            pr: [0, 0, "max(50px, calc(20% - 300px))"],
            pb: 50,
            flex: 1,
            borderRight: [
              "none",
              "none",
              showTableOfContents ? "1px solid var(--border)" : "none"
            ]
          }}
        >
          <ScrollToTopButton />
          <ClientOnly
            fallback={
              <Box
                className="tiptap ProseMirror theme-scope-editor"
                dangerouslySetInnerHTML={{
                  __html: content?.data || "<p></p>"
                }}
                sx={{ color: "paragraph", cursor: "text" }}
              />
            }
          >
            {() => (
              <Editor
                content={content?.data || "<p></p>"}
                onLoad={() => {
                  const toc = generateTableOfContents();
                  setTableOfContents(toc);
                }}
              />
            )}
          </ClientOnly>
        </Box>

        <Flex
          sx={{
            display: ["none", "none", "flex"],
            flexDirection: "column",
            flexShrink: 0,
            mt: 16,
            pr: 20,
            pb: 50,
            width: 300,
            alignSelf: "start",
            gap: 2,
            position: "sticky",
            top: 80
          }}
        >
          {showTableOfContents ? (
            <>
              <Text
                variant="subtitle"
                sx={{
                  color: "heading-secondary",
                  mb: 2
                }}
              >
                CONTENTS
              </Text>
              <TableOfContents
                container={editorContainer}
                contents={tableOfContents}
              />
            </>
          ) : null}
        </Flex>
        {showTableOfContents ? (
          <Flex
            sx={{
              display: ["flex", "flex", "none"],
              flexDirection: "column",
              position: "fixed",
              zIndex: 999,
              bottom: 0,
              right: 0,
              borderTopLeftRadius: 15,
              borderTopRightRadius: 15,
              boxShadow: "0px 0px 15px 5px rgba(0,0,0,0.1)",
              bg: "background-secondary",
              px: 4,
              gap: 2,
              height: "60vh",
              width: "100%",
              overflowY: "auto",
              border: "1px solid var(--theme-ui-colors-border)"
            }}
          >
            <Flex
              sx={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                mx: 0,
                // px: "16px",
                mt: 4
              }}
              onClick={() => {
                setShowTableOfContents(false);
              }}
            >
              <Text
                variant="subtitle"
                sx={{
                  color: "heading-secondary",
                  mb: 2
                }}
              >
                CONTENTS
              </Text>
              <Button>
                <Icon path={mdiClose} size={24} color="var(--icon)" />
              </Button>
            </Flex>
            <TableOfContents
              container={editorContainer}
              contents={tableOfContents}
              onNavigate={() => setShowTableOfContents(false)}
            />
          </Flex>
        ) : null}
      </Flex>
      <Footer subtitle="Published via Notesnook" />
      {reportDialogVisible ? (
        <ReportDialog
          monograph={monograph}
          setVisible={(visible) => {
            setReportDialogVisible(visible);
          }}
        />
      ) : null}
    </Flex>
  );
};

function MonographLockscreen({
  monograph,
  encodedKey,
  onUnlock
}: {
  monograph: Monograph;
  encodedKey?: string;
  onUnlock: (content: Monograph["content"]) => void;
}) {
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState<boolean>();
  const password = useRef<string>();

  const unlock = useCallback(async () => {
    if (!password.current) return;
    setError(undefined);
    setLoading(true);
    try {
      const result = await unlockMonograph(monograph, password.current).catch(
        (e) => {
          console.error(e);
          setError(
            `An error occurred while unlocking the monograph: ${e.message}`
          );
        }
      );
      if (result === false) {
        setError("Incorrect password.");
        return;
      }
      if (!result) return;
      onUnlock(result);
      hashNavigate(`key=${encode(password.current)}`, {
        replace: true,
        notify: false
      });
    } finally {
      setLoading(false);
    }
  }, [monograph, onUnlock]);

  useEffect(() => {
    if (!encodedKey) return;
    password.current = decode(encodedKey);
    unlock();
  }, [encodedKey, unlock]);

  if (encodedKey && !error) return null;

  return (
    <Flex
      sx={{
        flexDirection: "column",
        gap: 1,
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        bg: "background"
      }}
    >
      <Text
        sx={{
          fontFamily: "monospace",
          textAlign: "center",
          fontSize: 18
        }}
      >
        <span style={{ color: "var(--accent)" }}>Mono</span>graph
      </Text>
      <Text
        as="h1"
        variant="heading"
        sx={{ fontSize: 32, fontWeight: 800, mt: 20 }}
      >
        {monograph.title}
      </Text>
      {loading ? (
        <>
          <Text variant="subBody" sx={{ mt: 2 }}>
            Unlocking...
          </Text>
        </>
      ) : (
        <>
          <Input
            sx={{
              backgroundColor: "background-secondary",
              height: "35px",
              fontSize: "body",
              width: ["90%", 300],
              mt: 2
            }}
            autoFocus={true}
            autofillBackgroundColor="background-secondary"
            onChange={(event) => (password.current = event.target.value)}
            onKeyUp={(e) => (e.key === "Enter" ? unlock() : null)}
            type="password"
            placeholder="Enter password to continue"
          />
          <Button
            variant="accent"
            title="Unlock"
            sx={{ borderRadius: 100, px: 50, mt: 1 }}
            onClick={() => unlock()}
          >
            Unlock
          </Button>
          {error ? (
            <Text variant="error" sx={{ mt: 1 }}>
              {error}
            </Text>
          ) : null}
        </>
      )}
    </Flex>
  );
}

function ScrollToTopButton() {
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  useEffect(() => {
    function onScroll() {
      const scrollTop = window.scrollY;
      setShowScrollToTop(scrollTop > 120);
    }
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  if (!showScrollToTop) return null;
  return (
    <Box
      onClick={() => {
        window.scrollTo({
          top: 0,
          behavior: "smooth"
        });
      }}
      sx={{
        position: "fixed",
        bottom: 20,
        right: 10,
        zIndex: 1,
        bg: "background-secondary",
        borderRadius: 100,
        width: [50, 60, 60],
        height: [50, 60, 60],
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        boxShadow: "0px 0px 15px 5px rgba(0,0,0,0.1)"
      }}
    >
      <Icon path={mdiArrowUp} size={24} color="var(--accent)" />
    </Box>
  );
}

function ResponsiveTitle({ title }: { title: string }) {
  const [showTitle, setShowTitle] = useState(false);
  useEffect(() => {
    function onScroll() {
      const scrollTop = window.scrollY;
      setShowTitle(scrollTop > 120);
    }
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <>
      <Link
        as="a"
        variant="text.body"
        href="/"
        sx={{
          fontSize: 18,
          fontFamily: "monospace",
          textDecoration: "none",
          display: "block",
          whiteSpace: "nowrap",
          overflow: "hidden"
        }}
      >
        {showTitle ? (
          title
        ) : (
          <>
            <span style={{ color: "var(--accent)" }}>Mono</span>graph
          </>
        )}
      </Link>
    </>
  );
}

function TableOfContents({
  contents,
  container,
  onNavigate,
  showActive
}: {
  contents: TableOfContent[];
  container: React.RefObject<HTMLDivElement>;
  onNavigate?: (id: string) => void;
  showActive?: boolean;
}) {
  const [activeHeadings, setActiveHeadings] = useState<string[]>();
  useEffect(() => {
    if (!showActive) return;
    function onScroll() {
      const scrollTop = window.scrollY;
      const height = window.innerHeight || 0;
      const viewportHeight = scrollTop + height - 30;
      const documentOffset = container.current?.offsetTop || 0;
      const active = contents.filter((t, i, array) => {
        const next = array.at(i + 1);
        const headingOffset =
          documentOffset + t.node.offsetTop + t.node.clientHeight;
        const lessThanNext = next
          ? scrollTop <=
            next.node.offsetTop + documentOffset + next.node.clientHeight
          : true;
        const isInViewport =
          headingOffset > scrollTop && headingOffset < viewportHeight;
        const isActive = scrollTop >= headingOffset && lessThanNext;
        return isInViewport || isActive;
      });

      setActiveHeadings(active.map((a) => a.id));
    }
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, [contents, showActive]);

  return (
    <>
      {contents.length === 0 ? (
        <>
          <Text variant="subBody">
            This monograph has no table of contents.
          </Text>
        </>
      ) : null}
      {contents.map((item) => (
        <Button
          variant="anchor"
          key={item.id}
          sx={{
            textAlign: "left",
            p: 0,
            m: 0,
            pl: item.level * 10,
            textDecoration: "none",
            flexShrink: 0
          }}
          onClick={() => {
            const documentOffset = container.current?.offsetTop || 0;
            const headingOffset =
              documentOffset + item.node.offsetTop + item.node.clientHeight;
            window.scrollTo({
              top: headingOffset - 100,
              behavior: "smooth"
            });
            onNavigate?.(item.id);
          }}
        >
          <Text
            variant="subtitle"
            sx={{
              color:
                showActive && activeHeadings?.includes(item.id)
                  ? "accent"
                  : "paragraph-secondary",
              fontWeight: 600
            }}
          >
            {item.title}
          </Text>
        </Button>
      ))}
    </>
  );
}

function encode(input: string) {
  return toBase64Url(Buffer.from(input).toString("base64"));
}
function decode(input: string) {
  return Buffer.from(fromBase64Url(input), "base64").toString("utf-8");
}

function toBase64Url(base64: string) {
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+/g, "");
}

function fromBase64Url(base64url: string) {
  return (
    base64url.replace(/-/g, "+").replace(/_/g, "/") +
    "===".slice(0, (4 - (base64url.length % 4)) % 4)
  );
}

async function unlockMonograph(
  monograph: Monograph,
  password: string
): Promise<Monograph["content"] | false> {
  if (password === "") return false;
  const { encryptedContent } = monograph;
  if (!encryptedContent) return false;
  try {
    const decrypted = await NNCrypto.decrypt(
      { password, salt: encryptedContent.salt },
      {
        ...encryptedContent,
        format: "base64"
      },
      "text"
    );
    return JSON.parse(decrypted) as Monograph["content"];
  } catch (e) {
    const error = e as Error;
    if (
      error.message === "ciphertext cannot be decrypted using that key" ||
      error.message === "Invalid input."
    ) {
      return false;
    }
    throw e;
  }
}
