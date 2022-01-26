import { Button, Flex, Text } from "@theme-ui/components";
import { Accordion } from "./Accordion";

type ErrorsListProps = {
  errors: string[];
};

export function ErrorsList(props: ErrorsListProps) {
  return (
    <Accordion
      title={`${props.errors.length} errors occured`}
      sx={{ bg: "errorBg", borderRadius: "default", mt: 2 }}
      color="#E53935"
    >
      <Flex sx={{ flexDirection: "column", px: 2, pb: 2 }}>
        <Text variant="body" sx={{ color: "error" }}>
          {props.errors.map((error, index) => (
            <>
              {error}
              <br />
            </>
          ))}
        </Text>
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
