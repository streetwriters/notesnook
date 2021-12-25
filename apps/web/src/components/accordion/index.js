import { Flex, Text } from "rebass";
import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp } from "../icons";

export default function Accordion({
  title,
  children,
  sx,
  color,
  isClosed = true,
  testId,
  ...restProps
}) {
  const [isContentHidden, setIsContentHidden] = useState();

  useEffect(() => {
    setIsContentHidden(isClosed);
  }, [isClosed]);

  return (
    <Flex sx={{ flexDirection: "column", ...sx }} {...restProps}>
      <Flex
        sx={{
          justifyContent: "space-between",
          alignItems: "center",
          cursor: "pointer",
          bg: "bgSecondary",
          p: 1,
          borderRadius: "default",
        }}
        onClick={() => {
          setIsContentHidden((state) => !state);
        }}
        data-test-id={testId}
      >
        <Text variant="subtitle" sx={{ color }}>
          {title}
        </Text>
        {isContentHidden ? (
          <ChevronDown size={16} color={color} />
        ) : (
          <ChevronUp size={16} color={color} />
        )}
      </Flex>
      {!isContentHidden && children}
    </Flex>
  );
}
