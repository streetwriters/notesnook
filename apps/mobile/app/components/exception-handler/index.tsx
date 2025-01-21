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

import React from "react";
import RNBootSplash from "react-native-bootsplash";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { Dialog } from "../dialog";
import { Issue } from "../sheets/github/issue";

const error = (stack: string, component: string) => `

_______________________________
Stacktrace: In ${component}::${stack}`;

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
  }

  componentDidMount() {
    RNBootSplash.hide();
  }

  render() {
    return this.state.hasError ? (
      <SafeAreaProvider>
        <SafeAreaView
          style={{
            flex: 1,
            paddingTop: 10
          }}
        >
          <Issue
            defaultBody={error(
              this.state.error?.stack || "",
              this.props.component
            )}
            defaultTitle={this.state.error?.message}
            issueTitle="An exception occurred"
          />
          <Dialog />
        </SafeAreaView>
      </SafeAreaProvider>
    ) : (
      this.props.children
    );
  }
}

export const withErrorBoundry = (Element: React.ElementType, name: string) => {
  return function ErrorBoundary(props: any) {
    return (
      <ExceptionHandler component={name}>
        <Element {...props} />
      </ExceptionHandler>
    );
  };
};
