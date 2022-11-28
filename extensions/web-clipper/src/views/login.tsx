import { Button, Flex, Image, Text } from "@theme-ui/components";
import { useEffect, useState } from "react";
import Logo from "../../assets/logo.svg";
import { useAppStore } from "../stores/app-store";

export function Login() {
  const [error, setError] = useState<string>();
  const isLoggingIn = useAppStore((s) => s.isLoggingIn);
  const login = useAppStore((s) => s.login);

  useEffect(() => {
    (async () => {
      await login().catch((e) => {
        console.error(e);
        setError(e.message);
      });
    })();
  }, [login]);

  return (
    <Flex
      sx={{
        flexDirection: "column",
        m: 2,
        my: 50,
        width: 300,
        alignItems: "center",
        justifyContent: "center"
      }}
    >
      <Image src={Logo} width={64} />
      <Text variant="heading" sx={{ textAlign: "center", mt: 2 }}>
        Notesnook Web Clipper
      </Text>
      {isLoggingIn ? (
        <Text variant="body" sx={{ mt: 4 }}>
          Connecting with Notesnook...
        </Text>
      ) : (
        <Button
          sx={{ px: 4, mt: 4, borderRadius: 100 }}
          onClick={async () =>
            await login(true).catch((e) => {
              setError(e.message);
            })
          }
        >
          Connect with Notesnook
        </Button>
      )}
      {error && (
        <Text variant="error" sx={{ mt: 2 }}>
          {error}
        </Text>
      )}
    </Flex>
  );
}
