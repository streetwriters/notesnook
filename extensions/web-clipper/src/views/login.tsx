/*
This file is part of the Notesnook project (https://notesnook.com/)

Copyright (C) 2023 Streetwriters (Private) Limited

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/
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
          variant="accent"
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
