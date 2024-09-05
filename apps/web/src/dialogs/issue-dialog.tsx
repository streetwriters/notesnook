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

import { Flex, Link, Text } from "@theme-ui/components";
import { appVersion } from "../utils/version";
import Field from "../components/field";
import Dialog from "../components/dialog";
import platform from "platform";
import { useState } from "react";
import { isUserPremium } from "../hooks/use-is-user-premium";
import { writeText } from "clipboard-polyfill";
import { store as userstore } from "../stores/user-store";

import { ErrorText } from "../components/error-text";
import { Debug } from "@notesnook/core";
import { ConfirmDialog } from "./confirm";
import { BaseDialogProps, DialogManager } from "../common/dialog-manager";
import { strings } from "@notesnook/intl";

const PLACEHOLDERS = {
  title: strings.issueTitlePlaceholder(),
  body: strings.issuePlaceholder()
};

type IssueDialogProps = BaseDialogProps<boolean>;
export const IssueDialog = DialogManager.register(function IssueDialog(
  props: IssueDialogProps
) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>();

  return (
    <Dialog
      isOpen={true}
      title={strings.reportAnIssue()}
      onClose={() => props.onClose(false)}
      positiveButton={{
        text: strings.submit(),
        form: "issueForm",
        loading: isSubmitting,
        disabled: isSubmitting
      }}
      negativeButton={{
        text: strings.cancel(),
        onClick: () => props.onClose(false)
      }}
    >
      <Flex
        id="issueForm"
        as="form"
        onSubmit={async (e) => {
          e.preventDefault();
          try {
            setIsSubmitting(true);
            setError(undefined);

            const formData = new FormData(e.target as HTMLFormElement);
            const requestData = Object.fromEntries(
              formData.entries() as IterableIterator<[string, string]>
            );

            if (!requestData.title.trim() || !requestData.body.trim()) return;
            requestData.body = BODY_TEMPLATE(requestData.body);
            const url = await Debug.report({
              title: requestData.title,
              body: requestData.body,
              userId: userstore.get().user?.id
            });
            if (!url) throw new Error("Could not submit bug report.");

            props.onClose(true);
            await showIssueReportedDialog({ url });
          } catch (e) {
            if (e instanceof Error) setError(e.message);
          } finally {
            setIsSubmitting(false);
          }
        }}
        sx={{ flexDirection: "column" }}
      >
        <Field
          required
          label={strings.title()}
          id="title"
          name="title"
          placeholder={PLACEHOLDERS.title}
          autoFocus
        />
        <Field
          as="textarea"
          required
          variant="forms.input"
          label={strings.description()}
          id="body"
          name="body"
          placeholder={PLACEHOLDERS.body}
          sx={{ mt: 1 }}
          styles={{
            input: {
              minHeight: 150
            }
          }}
        />
        <Text
          variant="error"
          bg={"var(--background-error)"}
          mt={1}
          p={1}
          sx={{ borderRadius: "default" }}
        >
          {strings.issueNotice[0]()}{" "}
          <Link
            href="https://github.com/streetwriters/notesnook/issues"
            title="github.com/streetwriters/notesnook/issues"
          />{" "}
          {strings.issueNotice[1]()}{" "}
          <Link
            href="https://discord.gg/zQBK97EE22"
            title={strings.issueNotice[2]()}
          />
        </Text>
        <Text variant="subBody" mt={1}>
          {getDeviceInfo()
            .split("\n")
            .map((t) => (
              <>
                {t}
                <br />
              </>
            ))}
        </Text>
        <ErrorText error={error} />
      </Flex>
    </Dialog>
  );
});

function showIssueReportedDialog({ url }: { url: string }) {
  return ConfirmDialog.show({
    title: "Thank you for reporting!",
    positiveButtonText: "Copy link",
    message: `You can track your bug report at [${url}](${url}).

\
Please note that we will respond to your bug report on the link above. **We recommended that you save the above link for later reference.**

\
If your issue is critical (e.g. notes not syncing, crashes etc.), please [join our Discord community](https://discord.com/invite/zQBK97EE22) for one-to-one support.`
  }).then((result) => {
    result && writeText(url);
  });
}

export function getDeviceInfo() {
  const version = appVersion.formatted;
  const os = platform.os;
  const browser = `${platform.name} ${platform.version}`;

  return `App version: ${version}
OS: ${os}
Browser: ${browser}
Pro: ${isUserPremium()}`;
}

const BODY_TEMPLATE = (body: string) => {
  const info = `**Device information:**\n${getDeviceInfo()}`;
  if (!body) return info;
  return `${body}\n\n${info}`;
};
