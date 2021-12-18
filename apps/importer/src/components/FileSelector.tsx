import { Flex, Input, Text } from "@theme-ui/components";
import { ProviderFactory } from "@notesnook/importer";
import { useCallback, useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import { IProvider } from "@notesnook/importer/dist/src/providers/provider";
import { Providers } from "@notesnook/importer/dist/src/providers/providerfactory";
import { StepContainer } from "./StepContainer";
import { Accordion } from "./Accordion";

type FileSelectorProps = {
  provider?: Providers;
  onFilesChanged: (files: File[]) => void;
};

export function FileSelector(props: FileSelectorProps) {
  const { provider: providerName, onFilesChanged } = props;
  const [files, setFiles] = useState<File[]>([]);
  const [provider, setProvider] = useState<IProvider | undefined>();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles((files) => {
      const newFiles = [...acceptedFiles, ...files];
      return newFiles;
    });
  }, []);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: provider?.supportedExtensions?.concat(".zip"),
  });

  useEffect(() => {
    onFilesChanged(files);
  }, [files, onFilesChanged]);

  useEffect(() => {
    setFiles([]);
    setProvider(undefined);

    if (!providerName) return;
    setProvider(ProviderFactory.getProvider(providerName));
  }, [providerName]);

  return (
    <StepContainer sx={{ flexDirection: "column", alignItems: "stretch" }}>
      <Text variant="title">Select {provider?.name} files</Text>

      <Flex
        {...getRootProps()}
        sx={{
          justifyContent: "center",
          alignItems: "center",
          height: 200,
          border: "2px dashed var(--theme-ui-colors-border)",
          borderRadius: "default",
          mt: 2,
        }}
      >
        <Input {...getInputProps()} />
        <Text variant="body" sx={{ textAlign: "center" }}>
          {isDragActive
            ? "Drop the files here"
            : "Drag & drop files here, or click to select files"}
          <br />
          <Text variant="subBody">
            Only {provider?.supportedExtensions.join(", ")} files are supported.
            You can also select .zip files containing{" "}
            {provider?.supportedExtensions.join(", ")} files.
          </Text>
        </Text>
      </Flex>
      {files.length > 0 ? (
        <Accordion
          title={`${files.length} ${
            files.length > 1 ? "files" : "file"
          } selected`}
          sx={{
            border: "1px solid var(--theme-ui-colors-border)",
            mt: 2,
            borderRadius: "default",
          }}
        >
          <Flex
            sx={{ flexDirection: "column", overflowY: "auto", maxHeight: 400 }}
          >
            {files.map((file, index) => (
              <Flex
                sx={{
                  flexDirection: "column",
                  p: 2,
                  bg: index % 2 ? "transparent" : "bgSecondary",
                  cursor: "pointer",
                  ":hover": {
                    bg: "hover",
                  },
                }}
                onClick={() => {
                  setFiles((files) => {
                    const _files = files.slice();
                    _files.splice(index, 1);
                    return _files;
                  });
                }}
                title="Click to remove"
              >
                <Text variant="body">{file.name}</Text>
              </Flex>
            ))}
          </Flex>
        </Accordion>
      ) : null}
    </StepContainer>
  );
}
