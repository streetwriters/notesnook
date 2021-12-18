import { Flex } from "@theme-ui/components";
import { ThemeProvider } from "@theme-ui/theme-provider";
import "./App.css";
import { ThemeFactory } from "./theme";
import { useState } from "react";
import { Providers } from "@notesnook/importer/dist/src/providers/providerfactory";
import { StepSeperator } from "./components/StepSeperator";
import { ProviderSelector } from "./components/ProviderSelector";
import { FileSelector } from "./components/FileSelector";
import { ImportResult } from "./components/ImportResult";
import { Hero } from "./components/Hero";
import { Footer } from "./components/Footer";

function App() {
  const [selectedProvider, setSelectedProvider] = useState<
    Providers | undefined
  >();
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

          {selectedProvider && (
            <>
              <StepSeperator />
              <FileSelector
                provider={selectedProvider}
                onFilesChanged={setSelectedFiles}
              />
            </>
          )}
          {selectedFiles.length > 0 && selectedProvider && (
            <>
              <StepSeperator />
              <ImportResult files={selectedFiles} provider={selectedProvider} />
            </>
          )}
        </Flex>
        <Footer />
      </Flex>
    </ThemeProvider>
  );
}

export default App;
