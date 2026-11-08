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

import { useRef, useState } from "react";
import { Dialog, Flex, Text } from "@ui";
import { clipboard } from "@platform";
import { store as userstore } from "../stores/user-store";
import { Debug, IssueReportResponse } from "@notesnook/core";
import { ConfirmDialog } from "./confirm";
import { BaseDialogProps, DialogManager } from "../common/dialog-manager";
import { strings } from "@notesnook/intl";
import { getDeviceInfo } from "../utils/platform";
import { getSubscriptionInfo } from "./settings/components/user-profile";
import { ErrorText } from "../components/error-text";
import { Field } from "./components/field";
import { LinkText } from "./components/link-text";

type IssueDialogProps = BaseDialogProps<boolean>;

export const IssueDialog = DialogManager.register(function IssueDialog(
  props: IssueDialogProps
) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>();
  const values = useRef({ title: "", body: "" });

  const onSubmit = async () => {
    try {
      setIsSubmitting(true);
      setError(undefined);
      const requestData = { ...values.current };
      if (!requestData.title.trim() || !requestData.body.trim()) return;
      requestData.body = BODY_TEMPLATE(requestData.body);

      const response = await Debug.report({
        title: requestData.title,
        body: requestData.body,
        userId: userstore.get().user?.id
      });
      if (!response) throw new Error(strings.couldNotSubmitBugReport());
      if ("error" in response) throw new Error(response.error);

      props.onClose(true);
      await showIssueReportedDialog(response);
    } catch (e) {
      if (e instanceof Error) setError(e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={true}
      title={strings.reportAnIssue()}
      onClose={() => props.onClose(false)}
      positiveButton={{
        text: strings.submit(),
        onClick: onSubmit,
        loading: isSubmitting,
        disabled: isSubmitting
      }}
      negativeButton={{
        text: strings.cancel(),
        onClick: () => props.onClose(false)
      }}
    >
      <Flex sx={{ flexDirection: "column" }}>
        <Field
          required
          label={strings.title()}
          id="title"
          placeholder={strings.issueTitlePlaceholder()}
          autoFocus
          onChangeText={(text) => (values.current.title = text)}
        />
        <Field
          as="textarea"
          required
          label={strings.description()}
          id="body"
          placeholder={strings.issuePlaceholder()}
          sx={{ mt: 1 }}
          styles={{ input: { minHeight: 150 } }}
          onChangeText={(text) => (values.current.body = text)}
        />
        <Text
          variant="error"
          sx={{ bg: "background-error", mt: 1, p: 1, borderRadius: "default" }}
        >
          {strings.issueNotice[0]()}{" "}
          <LinkText href="https://github.com/streetwriters/notesnook/issues">
            github.com/streetwriters/notesnook/issues
          </LinkText>
          {strings.issueNotice[1]()}{" "}
          <LinkText href="https://discord.gg/zQBK97EE22">
            {strings.issueNotice[2]()}
          </LinkText>
          /
        </Text>
        <Text variant="subBody" sx={{ mt: 1 }}>
          {getDeviceInfo([`Plan: ${getSubscriptionInfo().title}`])}
        </Text>
        <ErrorText error={error} />
      </Flex>
    </Dialog>
  );
});

function showIssueReportedDialog(response: IssueReportResponse) {
  if ("error" in response) return;

  switch (response.type) {
    case "email": {
      return ConfirmDialog.show({
        title: strings.yourSupportRequestHasBeenForwarded(),
        subtitle: strings.supportEmailMessage()
      });
    }
    case "discussion": {
      const url = response.url;
      return ConfirmDialog.show({
        title: strings.thankYouForFeedback(),
        positiveButtonText: strings.copyLink(),
        subtitle: strings.featureRequestMessage(url)
      }).then((result) => {
        result && clipboard.write({ "text/plain": url });
      });
    }
    case "issue": {
      const url = response.url;
      return ConfirmDialog.show({
        title: strings.thankYouForReporting(),
        positiveButtonText: strings.copyLink(),
        subtitle: strings.bugReportMessage(url)
      }).then((result) => {
        result && clipboard.write({ "text/plain": url });
      });
    }
  }
}

const BODY_TEMPLATE = (body: string) => {
  const info = `**Device information:**\n${getDeviceInfo([
    `Plan: ${getSubscriptionInfo().title}`
  ])}`;
  if (!body) return info;
  return `${body}\n\n${info}`;
};
