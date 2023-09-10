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

import { memo } from "react";
import Skeleton from "react-loading-skeleton";
import { Box, Flex, Text } from "@theme-ui/components";
import "react-loading-skeleton/dist/skeleton.css";
import Config from "../../utils/config";
import { TextScramble } from "../text-scramble";
import useHashLocation from "../../hooks/use-hash-location";
import makeMatcher from "wouter/matcher";
import { Lock } from "../icons";

const matcher = makeMatcher();
const EDITOR_MARGINS = Config.get("editor:margins", true);
export const EditorLoader = memo(function EditorLoader() {
  const [{ location }] = useHashLocation();
  const [isNoteLoading] = matcher("/notes/:noteId/edit", location);
  const [isNoteLocked] = matcher("/notes/:noteId/unlock", location);

  if (isNoteLocked) {
    return (
      <Flex
        sx={{
          flexDirection: "column",
          flex: 1,
          alignItems: "center",
          justifyContent: "center"
        }}
      >
        <Lock size={100} sx={{ opacity: 0.2 }} />
      </Flex>
    );
  }

  return (
    <Flex
      sx={{
        flexDirection: "column",
        p: 2,
        py: 1
      }}
    >
      <Flex sx={{ alignItems: "end", justifyContent: "end", opacity: 0 }}>
        <Skeleton enableAnimation={false} width={76} height={33} />
      </Flex>
      <Flex
        sx={{
          alignSelf: ["stretch", "stretch", "center"],
          maxWidth: EDITOR_MARGINS ? "min(100%, 850px)" : "auto",
          px: 6,
          width: "100%",
          flexDirection: "column"
        }}
      >
        <Skeleton
          enableAnimation={false}
          height={32}
          style={{ marginTop: 5, opacity: 0 }}
        />
        <Box sx={{ mt: 1 }}>
          <Text
            sx={{
              p: 0,
              fontFamily: "heading",
              fontSize: ["1.625em", "1.625em", "2.625em"],
              fontWeight: "heading",
              width: "100%",
              color: "placeholder",
              opacity: 0.8
            }}
          >
            {isNoteLoading ? (
              <TextScramble text="Loading" nextLetterSpeed={50} />
            ) : (
              "Note title"
            )}
          </Text>
          <Skeleton
            enableAnimation={false}
            height={22}
            style={{ marginTop: 16 }}
            count={2}
          />
          <Skeleton
            enableAnimation={false}
            height={22}
            width={25}
            style={{ marginTop: 16 }}
          />
        </Box>
      </Flex>
    </Flex>
  );
});
