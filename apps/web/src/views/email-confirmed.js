import React, { useEffect } from "react";
import { Button, Flex, Text } from "rebass";
import ThemeProvider from "../components/theme-provider";
import * as Icon from "../components/icons";
import { useQueryParams } from "../navigation";

function EmailConfirmed() {
  const [{ userId }] = useQueryParams();
  useEffect(() => {
    if (!userId) window.location.href = "/";
  }, [userId]);

  return (
    <ThemeProvider>
      <Flex
        flexDirection="column"
        height="100%"
        justifyContent="center"
        alignItems="center"
      >
        <Flex
          flexDirection="column"
          justifyContent="center"
          alignItems="center"
          p={2}
        >
          <Text variant="heading" color="primary">
            Notesnook
          </Text>

          <Text display="flex" variant="heading" fontSize={32}>
            <Icon.Success color="primary" size={32} sx={{ mr: 2 }} /> Email
            confirmed!
          </Text>
          <Text variant="body" mt={2}>
            You can safely close this window and return to Notesnook.
          </Text>
        </Flex>
      </Flex>
    </ThemeProvider>
  );
}
export default EmailConfirmed;
