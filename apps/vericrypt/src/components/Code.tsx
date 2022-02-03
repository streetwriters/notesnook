import { Text } from "@theme-ui/components";

type CodeProps = { text: string; href?: string };
export function Code(props: CodeProps) {
  return (
    <Text
      as="code"
      sx={{
        bg: "bgSecondary",
        px: 1,
        borderRadius: 5,
        fontFamily: "monospace",
        border: "1px solid var(--theme-ui-colors-border)",
        cursor: props.href ? "pointer" : "unset",
      }}
      onClick={() => {
        if (props.href) window.open(props.href, "_target");
      }}
    >
      {props.text}
    </Text>
  );
}
