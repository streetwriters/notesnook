import React from "react";
import RNBootSplash from "react-native-bootsplash";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { Dialog } from "../dialog";
import { Issue } from "../sheets/github/issue";

const error = (
  stack: string,
  component: string
) => `Please let us know what happened. What steps we can take to reproduce the issue here.

_______________________________
Stacktrace: In ${component}::${stack}`;

class ExceptionHandler extends React.Component<{
  children: React.ReactNode;
  component: string;
}> {
  state: {
    error: {
      title: string;
      stack: string;
    } | null;
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
            defaultTitle={this.state.error?.title || "Unknown Error"}
            issueTitle="An exception occured"
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
  return function ErrorBoundary() {
    return (
      <ExceptionHandler component={name}>
        <Element />
      </ExceptionHandler>
    );
  };
};
