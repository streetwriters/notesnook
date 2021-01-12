import React, { useEffect, useMemo, useRef, Suspense } from "react";
import { Box, Flex } from "rebass";
import Properties from "../properties";
import {
  useStore,
  SESSION_STATES,
  store as editorstore,
} from "../../stores/editor-store";
import { useStore as useAppStore } from "../../stores/app-store";
import { useStore as useUserStore } from "../../stores/user-store";
import Animated from "../animated";
import Header from "./header";
import useMobile from "../../utils/use-mobile";
import useTablet from "../../utils/use-tablet";
import { SUBSCRIPTION_STATUS } from "../../common";
import Toolbar from "./toolbar";
import ObservableArray from "../../utils/observablearray";
import Banner from "../banner";
import EditorLoading from "./loading";

const ReactQuill = React.lazy(() => import("./react-quill"));

function Editor(props) {
  const sessionState = useStore((store) => store.session.state);
  const sessionId = useStore((store) => store.session.id);
  const contentType = useStore((store) => store.session.content?.type);
  const setSession = useStore((store) => store.setSession);
  const saveSession = useStore((store) => store.saveSession);
  const toggleProperties = useStore((store) => store.toggleProperties);
  const updateWordCount = useStore((store) => store.updateWordCount);
  const init = useStore((store) => store.init);
  const isFocusMode = useAppStore((store) => store.isFocusMode);
  const isMobile = useMobile();
  const isTablet = useTablet();
  const isTrial = useUserStore(
    (store) => store.user?.subscription?.status === SUBSCRIPTION_STATUS.TRIAL
  );
  const isLoggedin = useUserStore((store) => store.isLoggedIn);
  const editorMargins = useMemo(() => {
    if (isMobile || isTablet) return "0%";
    else return "10px";
  }, [isTablet, isMobile]);

  const quillRef = useRef();

  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    if (contentType !== "delta" || !quillRef || !quillRef.current) return;

    if (sessionState === SESSION_STATES.new) {
      editorstore.set((state) => (state.session.state = SESSION_STATES.stale));
      const {
        content: { data },
      } = editorstore.get().session;

      const { quill } = quillRef.current;
      const pages = opsToPages(data);
      quillRef.current.init(pages, data);

      const editorScroll = document.querySelector(".editorScroll");
      while (
        editorScroll.scrollHeight <= editorScroll.clientHeight &&
        quillRef.current.currentPage < pages.length
      ) {
        const page = pages[++quillRef.current.currentPage];
        if (!page) break;
        quill.updateContents(getNextPage(page, quillRef.current.quill), "init");
      }

      quill.history.stack = {
        undo: new ObservableArray("undo"),
        redo: new ObservableArray("redo"),
      };

      const record = quill.history.record.bind(quill.history);
      quill.history.record = function (changeDelta, oldDelta) {
        record(changeDelta, oldDelta);
        quill.history.stack.redo = new ObservableArray("redo");
      };

      function onScroll(e) {
        const scrollBottom = e.target.scrollTop + e.target.clientHeight + 10;
        const maxScrollHeight = e.target.scrollHeight - 80;
        if (scrollBottom > maxScrollHeight) {
          const page = pages[++quillRef.current.currentPage];
          if (!page) {
            editorScroll.removeEventListener("scroll", onScroll);
            return;
          }
          quill.updateContents(
            getNextPage(page, quillRef.current.quill),
            "init"
          );
        }
      }
      editorScroll.addEventListener("scroll", onScroll);
      return () => {
        editorScroll.removeEventListener("scroll", onScroll);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quillRef, contentType, sessionId]);

  return (
    <Flex
      flexDirection="column"
      sx={{
        position: "relative",
        alignSelf: "stretch",
        overflow: "hidden",
      }}
      flex="1 1 auto"
    >
      {isMobile && <Banner />}
      <Toolbar quill={quillRef.current?.quill} />
      <Flex
        variant="columnFill"
        className="editorScroll"
        flexDirection="column"
        overflow="hidden"
        overflowY="auto"
      >
        <Animated.Flex
          variant="columnFill"
          className="editor"
          sx={{
            mx: [0, 0, editorMargins],
            alignSelf: ["stretch", "stretch", "center"],
          }}
          animate={{
            marginRight: isFocusMode && !isTablet ? "25%" : editorMargins,
            marginLeft: isFocusMode && !isTablet ? "25%" : editorMargins,
          }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          maxWidth={isFocusMode ? "auto" : "900px"}
          mt={[0, 0, 25]}
        >
          <Header />
          <Box
            id="toolbarContainer"
            bg="background"
            sx={{
              borderBottom: "1px solid",
              borderBottomColor: "border",
              position: "sticky",
              top: 0,
              zIndex: 2,
              height: 45,
              overflow: "hidden",
              transition: "max-height 500ms linear",
              ":hover": {
                overflow: "visible",
              },
            }}
          />
          {contentType === "delta" && (
            <Suspense fallback={<EditorLoading />}>
              <ReactQuill
                id="quill"
                ref={quillRef}
                refresh={sessionState === SESSION_STATES.new}
                isSimple={!isLoggedin || (isLoggedin && !isTrial)}
                isFocusMode={isFocusMode}
                onFocus={() => {
                  toggleProperties(false);
                }}
                placeholder="Type anything here"
                container=".editor"
                scrollContainer=".editorScroll"
                onSave={() => {
                  saveSession();
                }}
                changeInterval={500}
                onWordCountChanged={updateWordCount}
                onQuillInitialized={() => {
                  const toolbar = document.querySelector(".ql-toolbar.ql-snow");
                  const toolbarContainer = document.querySelector(
                    "#toolbarContainer"
                  );
                  if (toolbar && toolbarContainer) {
                    toolbar.style.opacity = 1;
                    toolbarContainer.appendChild(toolbar);
                  }
                }}
                onChange={() => {
                  const { quill } = quillRef.current;
                  const delta = quill.getContents().ops;
                  setSession((state) => {
                    state.session.content = {
                      type: "delta",
                      data: appendPages(
                        delta,
                        quillRef.current.pages,
                        quillRef.current.currentPage
                      ),
                    };
                  });
                }}
              />
            </Suspense>
          )}
        </Animated.Flex>
      </Flex>
      <Properties />
    </Flex>
  );
}
export default Editor;

function opsToPages(delta, pageSize = 20) {
  const totalPages = delta.length / pageSize;
  const pages = [];
  for (var i = 0; i < totalPages; ++i) {
    const start = i * pageSize;
    const end = start + pageSize;
    pages.push(delta.slice(start, end));
  }
  return pages;
}

function getNextPage(page, quill) {
  const length = quill.getLength();
  page.splice(0, 0, { retain: length - 1 });
  return page;
}

function appendPages(delta, pages, currentPage) {
  if (pages.length === currentPage + 1) return delta;
  for (var i = currentPage; i < pages.length; ++i) {
    delta.push(...pages[i]);
  }
  return delta;
}
