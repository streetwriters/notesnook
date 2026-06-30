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
import { Flex, Text } from "@theme-ui/components";
import { MonographPage } from "./monographpost";
import { Header } from "./header";
import { Footer } from "./footer";
import { Monograph } from "./monographpost/types";

type MonographViewProps = {
  monograph: Monograph | null;
  pixel: string | null;
  encodedKey: string | undefined;
};

export function MonographView({
  monograph,
  pixel,
  encodedKey
}: MonographViewProps) {
  return (
    <>
      {monograph ? (
        <MonographPage
          monograph={monograph}
          encodedKey={encodedKey}
          pixel={pixel ?? undefined}
        />
      ) : (
        <>
          <Header />
          <Flex
            sx={{
              justifyContent: "center",
              alignItems: "center",
              flexDirection: "column",
              flex: 1,
              height: "100vh",
              bg: "background"
            }}
          >
            <Text variant="heading" sx={{ fontSize: 42, mt: 20 }}>
              404
            </Text>
            <Text variant="body">This monograph does not exist.</Text>
          </Flex>
          <Footer />
        </>
      )}
    </>
  );
}
