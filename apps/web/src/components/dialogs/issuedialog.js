import { Flex, Text } from "rebass";
import { getAppVersion } from "../../utils/useVersion";
import Field from "../field";
import Dialog from "./dialog";
import platform from "platform";
import { useState } from "react";
import { db } from "../../common/db";
import { confirm } from "../../common/dialog-controller";

const PLACEHOLDERS = {
  title: "Briefly describe what happened",
  body: `Tell us more about the issue you are facing.

For example things like:
    1. Steps to reproduce the issue
    2. Things you have tried so far
    3. etc.
    
This is all optional, of course.`,
};

function getDeviceInfo() {
  const appVersion = getAppVersion().formatted;
  const os = platform.os;
  const browser = `${platform.name} ${platform.version}`;

  return `App version: ${appVersion}
OS: ${os}
Browser: ${browser}`;
}
const BODY_TEMPLATE = (body) => {
  const info = `**Device information:**\n${getDeviceInfo()}`;
  if (!body) return info;
  return `${body}\n\n${info}`;
};

function IssueDialog(props) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState();

  return (
    <Dialog
      isOpen={true}
      title={"Report an issue"}
      scrollable
      description={
        "Let us know if you are facing an issue. We'll do our best to sort it out for you."
      }
      onClose={props.onClose}
      positiveButton={{
        text: "Report",
        props: {
          form: "issueForm",
        },
        loading: isSubmitting,
        disabled: isSubmitting,
      }}
      negativeButton={{ text: "Cancel", onClick: props.onClose }}
    >
      <Flex
        id="issueForm"
        as="form"
        flexDirection="column"
        onSubmit={async (e) => {
          e.preventDefault();
          try {
            setIsSubmitting(true);
            setError();

            const formData = new FormData(e.target);
            const requestData = Object.fromEntries(formData.entries());
            if (!requestData.title.trim() || !requestData.body.trim()) return;
            requestData.body = BODY_TEMPLATE(requestData.body);
            const url = await db.debug.report(
              requestData.title,
              requestData.body
            );
            confirm({
              title: "Thank you for reporting!",
              message: (
                <>
                  You can track your issue at{" "}
                  <Text as="a" href={url} sx={{ lineBreak: "anywhere" }}>
                    {url}
                  </Text>
                </>
              ),
            });
          } catch (e) {
            setError(e.message);
          } finally {
            setIsSubmitting(false);
          }
        }}
      >
        <Field
          required
          label="Title"
          id="title"
          name="title"
          placeholder={PLACEHOLDERS.title}
          autoFocus
        />
        <Field
          as="textarea"
          required
          variant="forms.input"
          label="Description"
          id="body"
          name="body"
          placeholder={PLACEHOLDERS.body}
          sx={{ mt: 1 }}
          styles={{
            input: {
              minHeight: 150,
            },
          }}
        />
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
        {error && (
          <Text bg="errorBg" variant="error" mt={1} px={1}>
            Error: {error}
          </Text>
        )}
      </Flex>
    </Dialog>
  );
}

export default IssueDialog;
