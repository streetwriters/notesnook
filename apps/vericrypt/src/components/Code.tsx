import { Text, Link } from "@theme-ui/components";

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
    >
      {props.href ? (
        <Link href={props.href} color="primary">
          {props.text}
        </Link>
      ) : (
        props.text
      )}
    </Text>
  );
}
