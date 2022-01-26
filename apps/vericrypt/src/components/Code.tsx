import { Text } from "@theme-ui/components";

type CodeProps = { text: string };
export function Code(props: CodeProps) {
  return (
    <Text
      as="code"
      sx={{
        bg: "bgSecondary",
        px: 1,
        borderRadius: 5,
        border: "1px solid var(--theme-ui-colors-border)",
      }}
    >
      {props.text}
    </Text>
  );
}
