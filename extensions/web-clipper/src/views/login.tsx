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
import { useStore as useUserStore } from "@notesnook/web/src/stores/user-store";
import Field from "@notesnook/web/src/components/field";
import { HeadlessAuth } from "@notesnook/web/src/views/auth";
import { useAppStore } from "../stores/app-store";

export function Login() {
  const [error, setError] = useState<string>();
  const isLoggingIn = useUserStore((store) => store.isLoggingIn);
  const navigate = useAppStore((s) => s.navigate);

  return (
    <Flex
      sx={{
        flexDirection: "column",
        m: 2,
        my: 50,
        width: 300
      }}
    >
      <Image src={Logo} width={50} sx={{ alignSelf: "center", mb: 4 }} />
      <HeadlessAuth
        route="login:email"
        isolated
        openURL={(url, context) => {
          if (context?.authenticated) {
            navigate("/");
          }
        }}
      />
      {/* {isLoggingIn ? (
        <Text variant="body" sx={{ mt: 4 }}>
          Logging you in...
        </Text>
      ) : (
        <>
          <Field />
        </>
      )}
      {error && (
        <Text variant="error" sx={{ mt: 2 }}>
          {error}
        </Text>
      )} */}
    </Flex>
  );
}
