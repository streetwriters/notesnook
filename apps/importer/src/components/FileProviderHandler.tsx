import { Flex, Input, Text } from "@theme-ui/components";
import { useCallback, useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import { StepContainer } from "./StepContainer";
import { Accordion } from "./Accordion";
import { IFileProvider, transform } from "@notesnook/importer";
import { xxhash64 } from "hash-wasm";
import {
  ProviderResult,
  ProviderSettings,
} from "@notesnook/importer/dist/src/providers/provider";
import { IFile } from "@notesnook/importer/dist/src/utils/file";

type FileProviderHandlerProps = {
  provider: IFileProvider;
  onTransformFinished: (result: ProviderResult) => void;
};

type Progress = {
  total: number;
  done: number;
};

const settings: ProviderSettings = {
  clientType: "browser",
  hasher: { type: "xxh64", hash: (data) => xxhash64(data) },
};

export function FileProviderHandler(props: FileProviderHandlerProps) {
  const { provider, onTransformFinished } = props;
  const [files, setFiles] = useState<File[]>([]);
  const [progress, setProgress] = useState<Progress>({ total: 0, done: 0 });

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
    setFiles([]);
  }, [provider]);

  useEffect(() => {
    (async () => {
      if (!provider || !files.length) return;

      setProgress({ total: 0, done: 0 });
      let result: ProviderResult = { notes: [], errors: [] };
      for (let file of files) {
        const providerFile: IFile = {
          name: file.name,
          data: await file.arrayBuffer(),
          modifiedAt: file.lastModified,
        };
        const transformResult = await transform(
          provider,
          [providerFile],
          settings
        );
        result.notes.push(...transformResult.notes);
        result.errors.push(...transformResult.errors);
        setProgress((p) => ({ total: files.length, done: p.done + 1 }));
      }
      setProgress({ total: 0, done: 0 });
      onTransformFinished(result);
    })();
  }, [provider, files, onTransformFinished]);

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
                key={file.name}
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
      {progress.total > 0 ? (
        <Text variant="body">
          Processing files ({progress.done}/{progress.total})
        </Text>
      ) : null}
    </StepContainer>
  );
}
