import { Flex } from "@theme-ui/components";
import { ThemeProvider } from "@theme-ui/theme-provider";
import "./App.css";
import { ThemeFactory } from "./theme";
import { useState } from "react";
import { StepSeperator } from "./components/StepSeperator";
import { ProviderSelector } from "./components/ProviderSelector";
import { FileProviderHandler } from "./components/FileProviderHandler";
import { FileProviderImportResult } from "./components/FileProviderImportResult";
import { Hero } from "./components/Hero";
import { Footer } from "./components/Footer";
import { IProvider } from "@notesnook/importer";
import { NetworkProviderHandler } from "./components/NetworkProviderHandler";

function App() {
  const [selectedProvider, setSelectedProvider] = useState<IProvider>();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

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
          <ProviderSelector onProviderChanged={setSelectedProvider} />

          {selectedProvider ? (
            selectedProvider.type === "file" ? (
              <>
                <StepSeperator />
                <FileProviderHandler
                  provider={selectedProvider}
                  onFilesChanged={setSelectedFiles}
                />
                {selectedFiles.length > 0 && selectedProvider && (
                  <>
                    <StepSeperator />
                    <FileProviderImportResult
                      files={selectedFiles}
                      provider={selectedProvider}
                    />
                  </>
                )}
              </>
            ) : (
              <>
                <StepSeperator />
                <NetworkProviderHandler provider={selectedProvider} />
              </>
            )
          ) : null}
        </Flex>
        <Footer />
      </Flex>
    </ThemeProvider>
  );
}

export default App;
