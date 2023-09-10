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
import { Flex, Text, Input } from "@theme-ui/components";
import { getSourceUrl } from "../utils/links";
import { Code } from "./code";
import { StepContainer } from "./step-container";

type EnterAccountPasswordProps = {
  onPasswordSubmitted: (password: string) => void;
};

export function EnterAccountPassword(props: EnterAccountPasswordProps) {
  return (
    <StepContainer
      onSubmit={(e) => {
        e.preventDefault();
        document.getElementById("step_4")?.scrollIntoView({
          behavior: "smooth",
          block: "center"
        });
        return false;
      }}
      onSubmitCapture={() => false}
      inputMode="text"
      id="step_3"
      as="form"
      sx={{ flexDirection: "column" }}
    >
      <Flex sx={{ justifyContent: "space-between", alignItems: "center" }}>
        <Text variant="title">Account password</Text>
        <Code
          text="src/components/step-3.tsx"
          href={getSourceUrl("src/components/step-3.tsx")}
        />
      </Flex>
      <Flex
        sx={{
          bg: "bgSecondary",
          mt: 2,
          p: 2,
          borderRadius: "default",
          flexDirection: "column"
        }}
      >
        <Text variant="subtitle">
          Will my account password be sent to the server?
        </Text>
        <Text as="p" variant="body">
          Never. Your password never ever leaves this browser tab. Everything
          takes place locally. This is the most fundamental part of zero
          knowledge data encryption.
        </Text>
      </Flex>
      <Input
        variant="forms.clean"
        id="password"
        name="password"
        type="password"
        placeholder="Enter your account password"
        sx={{
          mt: 2,
          fontSize: "subheading",
          fontFamily: "monospace",
          textAlign: "center"
        }}
        onChange={(e) => {
          props.onPasswordSubmitted(e.target.value);
        }}
      />
    </StepContainer>
  );
}
