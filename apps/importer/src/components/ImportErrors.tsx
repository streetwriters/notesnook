import { Button, Flex, Text } from "@theme-ui/components";
import { Accordion } from "./Accordion";
import { TransformError } from "@notesnook/importer/dist/src/utils/transformerror";

type ImportErrorsProps = {
  errors: TransformError[];
};

export function ImportErrors(props: ImportErrorsProps) {
  return (
    <Accordion
      title={`${props.errors.length} errors occured`}
      sx={{ bg: "errorBg", borderRadius: "default", mt: 2 }}
      color="#E53935"
    >
      <Flex sx={{ flexDirection: "column", px: 2, pb: 2 }}>
        {props.errors.map((error, index) => (
          <Text
            variant="body"
            sx={{ color: "error", my: 1, fontFamily: "monospace" }}
          >
            {index + 1}. {error.message}{" "}
            {error.file ? `(${error.file.name})` : ""}
            <br />
          </Text>
        ))}
        <Button
          sx={{ bg: "error", color: "static", alignSelf: "start", mt: 2 }}
          onClick={() =>
            window.open(
              "https://github.com/streetwriters/notesnook/issues/new",
              "_blank"
            )
          }
        >
          Send us a bug report
        </Button>
      </Flex>
    </Accordion>
  );
}
