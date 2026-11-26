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
import Field from "../components/field";
import Dialog from "../components/dialog";
import { Fragment } from "react";
import { useForm } from "react-hook-form";
import { writeText } from "clipboard-polyfill";
import { store as userstore } from "../stores/user-store";

import { ErrorText } from "../components/error-text";
import { Debug, IssueReportResponse } from "@notesnook/core";
import { ConfirmDialog } from "./confirm";
import { BaseDialogProps, DialogManager } from "../common/dialog-manager";
import { strings } from "@notesnook/intl";
import { getDeviceInfo } from "../utils/platform";
import { getSubscriptionInfo } from "./settings/components/user-profile";

const REQUIRED_FIELD_ERROR = "Please fill out this field";

type IssueDialogProps = BaseDialogProps<boolean>;
type IssueFormValues = { title: string; body: string };

export const IssueDialog = DialogManager.register(function IssueDialog(
  props: IssueDialogProps
) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting }
  } = useForm<IssueFormValues>({ defaultValues: { title: "", body: "" } });

  async function submitIssue(values: IssueFormValues) {
    try {
      const response = await Debug.report({
        title: values.title,
        body: BODY_TEMPLATE(values.body),
        userId: userstore.get().user?.id
      });
      if (!response) throw new Error(strings.couldNotSubmitBugReport());
      if ("error" in response) throw new Error(response.error);

      props.onClose(true);
      await showIssueReportedDialog(response);
    } catch (e) {
      if (e instanceof Error) setError("root", { message: e.message });
    }
  }

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
        onSubmit={handleSubmit(submitIssue)}
        sx={{
          flexDirection: "column",
          gap: "spacing4",
          mt: "spacing6",
          mb: "spacing7"
        }}
      >
        <Field
          label={strings.title()}
          id="title"
          placeholder={strings.issueTitlePlaceholder()}
          autoFocus
          error={errors.title?.message}
          {...register("title", {
            validate: (title) => !!title.trim() || REQUIRED_FIELD_ERROR
          })}
        />
        <Field
          as="textarea"
          variant="forms.input"
          label={strings.description()}
          id="body"
          placeholder={strings.issuePlaceholder()}
          error={errors.body?.message}
          {...register("body", {
            validate: (body) => !!body.trim() || REQUIRED_FIELD_ERROR
          })}
          styles={{
            input: {
              minHeight: 150
            }
          }}
        />
        <Text
          bg="background-error"
          p="spacing4"
          sx={{
            borderRadius: "radius2",
            fontSize: "xs",
            lineHeight: 1.3,
            color: "paragraph",
            a: { color: "accent", fontWeight: 500, textDecoration: "none" }
          }}
        >
          {strings.issueNotice[0]()}{" "}
          <Link
            href="https://github.com/streetwriters/notesnook/issues"
            title="github.com/streetwriters/notesnook/issues"
            target="_blank"
          >
            github.com/streetwriters/notesnook/issues
          </Link>{" "}
          {strings.issueNotice[1]()}{" "}
          <Link
            href="https://discord.gg/zQBK97EE22"
            title={strings.issueNotice[2]()}
            target="_blank"
          >
            {strings.issueNotice[2]()}
          </Link>
        </Text>
        <Text
          sx={{ fontSize: "sm", lineHeight: 1.3, color: "paragraph-secondary" }}
        >
          {getDeviceInfo([`Plan: ${getSubscriptionInfo().title}`])
            .split("\n")
            .map((t, i) => (
              <Fragment key={i}>
                {t}
                <br />
              </Fragment>
            ))}
        </Text>
        <ErrorText error={errors.root?.message} />
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
        result && writeText(url);
      });
    }
    case "issue": {
      const url = response.url;
      return ConfirmDialog.show({
        title: strings.thankYouForReporting(),
        positiveButtonText: strings.copyLink(),
        subtitle: strings.bugReportMessage(url)
      }).then((result) => {
        result && writeText(url);
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
