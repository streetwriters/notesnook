import { Flex } from "@theme-ui/components";
import { ThemeProvider } from "@theme-ui/theme-provider";
import "./App.css";
import { ThemeFactory } from "./theme";
import { useEffect, useState } from "react";
import { StepSeperator } from "./components/StepSeperator";
import { ProviderSelector } from "./components/ProviderSelector";
import { FileProviderHandler } from "./components/FileProviderHandler";
import { ImportResult } from "./components/ImportResult";
import { Hero } from "./components/Hero";
import { Footer } from "./components/Footer";
import { IProvider } from "@notesnook/importer";
import { NetworkProviderHandler } from "./components/NetworkProviderHandler";
import { ProviderResult } from "@notesnook/importer/dist/src/providers/provider";
import { trackEvent } from "./utils/analytics";

function App() {
  const [selectedProvider, setSelectedProvider] = useState<IProvider>();
  const [providerResult, setProviderResult] = useState<ProviderResult>();

  useEffect(() => {
    if (selectedProvider && providerResult) {
      (async () => {
        await trackEvent(
          { name: selectedProvider.name, type: "event" },
          selectedProvider.name
        );
      })();
    }
  }, [providerResult, selectedProvider]);

  return (
    <ThemeProvider theme={ThemeFactory.construct()}>
      <Flex sx={{ flexDirection: "column" }}>
        <Hero />
        <Flex
          sx={{
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <ProviderSelector
            onProviderChanged={(provider) => {
              setSelectedProvider(provider);
              setProviderResult(undefined);
            }}
          />

          {selectedProvider ? (
            <>
              <StepSeperator />
              {selectedProvider.type === "file" ? (
                <FileProviderHandler
                  provider={selectedProvider}
                  onTransformFinished={setProviderResult}
                />
              ) : selectedProvider.type === "network" ? (
                <NetworkProviderHandler
                  provider={selectedProvider}
                  onTransformFinished={setProviderResult}
                />
              ) : null}
            </>
          ) : null}
          {providerResult ? (
            <>
              <StepSeperator />
              <ImportResult result={providerResult} />{" "}
            </>
          ) : null}
        </Flex>
        <Footer />
      </Flex>
    </ThemeProvider>
  );
}

export default App;
