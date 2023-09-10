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
import { Button, Link, Text } from "@theme-ui/components";
import { StepContainer } from "./step-container";
import { Code } from "./code";
import { getPackageUrl } from "../utils/links";

export function LoginToNotesnook() {
  return (
    <StepContainer
      onSubmit={(e) => {
        e.preventDefault();
        document.getElementById("step_2")?.scrollIntoView({
          behavior: "smooth",
          block: "center"
        });
        return false;
      }}
      onSubmitCapture={() => false}
      as="form"
      sx={{ flexDirection: "column" }}
    >
      <Text variant="title">Welcome to Vericrypt</Text>
      <Text as="p" variant="body" sx={{ mt: 1 }}>
        <del>
          Trust is a huge problem in closed source end-to-end encrypted
          applications. How can you be sure that the app is actually encrypting
          your data?
        </del>
      </Text>
      <Text as="p" variant="body" sx={{ mt: 1 }}>
        The only way to earn a user&apos;s trust is by allowing them to see how
        the underlying encryption actually works. To do this,{" "}
        <Link
          target="_blank"
          href="https://blog.notesnook.com/notesnook-is-going-open-source"
          sx={{ color: "primary", fontWeight: "bold" }}
        >
          we have completely open sourced Notesnook.
        </Link>
      </Text>
      <Text as="p" variant="body" sx={{ mt: 1 }}>
        Yes, that&apos;s right. Notesnook is now 100% open source under the
        GPLv3 license. That includes the app, the encryption library, the
        backend server, and everything else.
      </Text>
      <Text as="p" variant="body" sx={{ mt: 1 }}>
        However, even with an open source app, how can you be sure that the app
        is actually encrypting your data? That is why we have made this tool
        (also open source), which uses{" "}
        <Code text="@notesnook/crypto" href={getPackageUrl("crypto")} /> — the
        main library for all cryptographic operations inside Notesnook.
      </Text>
      <Text as="p" variant="body" sx={{ mt: 1 }}>
        Vericrypt will allow you to verify all encryption claims made by
        Notesnook in a practical &amp; provable way right inside your browser.
      </Text>
      <Text
        as="p"
        variant="body"
        sx={{ mt: 1, bg: "bgSecondary", p: 2, borderRadius: 5 }}
      >
        When you use this tool, you&apos;ll be guided each step of the way to
        extract/insert raw data from raw sources.{" "}
        <b>The whole process happens completely in your browser offline</b> and
        you can even disconnect your internet to make sure we aren&apos;t just
        saying that.
      </Text>
      <Button
        sx={{ alignSelf: "center", mt: 2 }}
        onClick={() => window.open("https://app.notesnook.com/login", "_blank")}
      >
        Login to Notesnook
      </Button>
    </StepContainer>
  );
}
