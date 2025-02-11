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

import "./polyfill";
import { Global, css } from "@emotion/react";
import {
  ScopedThemeProvider,
  themeToCSS,
  useThemeEngineStore
} from "@notesnook/theme";
import React, { useMemo } from "react";
import { Freeze } from "react-freeze";
import "./App.css";
import Tiptap from "./components/editor";
import { TabContext, useTabStore } from "./hooks/useTabStore";
import { EmotionEditorTheme } from "./theme-factory";
import { getTheme } from "./utils";
import { ReadonlyEditorProvider } from "./components/readonly-editor";

const currentTheme = getTheme();
if (currentTheme) {
  useThemeEngineStore.getState().setTheme(currentTheme);
}

class ExceptionHandler extends React.Component<{
  children: React.ReactNode;
  component: string;
}> {
  state: {
    error: Error | null;
    hasError: boolean;
  } = {
    hasError: false,
    error: null
  };
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error };
  }

  componentDidCatch(_error: Error) {
    // A custom error logging function
    post("editorError", {
      message: "Editor crashed: " + _error.message,
      stack: _error.stack
    });
  }

  render() {
    return this.state.hasError ? (
      <div
        style={{
          color: "red",
          fontSize: 18,
          width: "100%",
          display: "flex",
          padding: "50px 25px",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          gap: 10
        }}
      >
        <h3
          style={{
            marginBottom: 0
          }}
        >
          An error occurred.
        </h3>

        <button
          style={{
            borderRadius: 5,
            boxSizing: "border-box",
            border: "none",
            backgroundColor: "red",
            width: 300,
            fontSize: "0.9em",
            height: 45,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            columnGap: 5,
            userSelect: "none"
          }}
          onClick={() => {
            if (!this.state.error) return;
            post("editorError", {
              message: "Editor crashed: " + this.state.error.message,
              stack: this.state.error.stack
            });
          }}
        >
          <p
            style={{
              userSelect: "none",
              color: "white"
            }}
          >
            Report error
          </p>
        </button>

        <button
          style={{
            borderRadius: 5,
            boxSizing: "border-box",
            border: "none",
            backgroundColor: "red",
            width: 300,
            fontSize: "0.9em",
            height: 45,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            columnGap: 5,
            userSelect: "none"
          }}
          onClick={() => {
            window.location.reload();
          }}
        >
          <p
            style={{
              userSelect: "none",
              color: "white"
            }}
          >
            Reload editor
          </p>
        </button>
      </div>
    ) : (
      this.props.children
    );
  }
}

function App(): JSX.Element {
  const tabs = useTabStore((state) => state.tabs);
  const currentTab = useTabStore((state) => state.currentTab);

  return (
    <ScopedThemeProvider value="base">
      <EmotionEditorTheme>
        <GlobalStyles />

        {globalThis["readonlyEditor"] ? (
          <ReadonlyEditorProvider />
        ) : (
          tabs.map((tab) => (
            <TabContext.Provider key={tab.id} value={tab}>
              <Freeze freeze={currentTab !== tab.id}>
                <Tiptap />
              </Freeze>
            </TabContext.Provider>
          ))
        )}
      </EmotionEditorTheme>
    </ScopedThemeProvider>
  );
}

export const withErrorBoundry = (Element: React.ElementType, name: string) => {
  return function ErrorBoundary() {
    return (
      <ExceptionHandler component={name}>
        <Element />
      </ExceptionHandler>
    );
  };
};

export default withErrorBoundry(App, "Editor");

function GlobalStyles() {
  const theme = useThemeEngineStore((store) => store.theme);
  const cssTheme = useMemo(() => themeToCSS(theme), [theme]);
  return (
    <>
      <Global
        styles={css`
          ${cssTheme}
        `}
      />
    </>
  );
}
