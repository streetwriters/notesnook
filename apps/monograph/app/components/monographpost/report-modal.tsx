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
import { useCallback, useRef, useState } from "react";
import Modal from "react-modal";
import { Button, Flex, Text } from "@theme-ui/components";
import { Monograph } from "./types";
import Turnstile from "react-turnstile";
import { BaseThemeProvider } from "../theme-provider";

const BASE_URL = "https://notesnook.com/api/v1/reports";

const REPORT_TYPES = [
  {
    type: "spam",
    title: "Spam"
  },
  {
    type: "malware",
    title: "Malware"
  },
  {
    type: "violence",
    title: "Violence"
  },
  {
    type: "child_abuse",
    title: "Child abuse"
  },
  {
    type: "copyright",
    title: "Copyright"
  }
];

type SubmitStatus = { success: boolean; error?: string };
export default function ReportDialog({
  setVisible,
  monograph
}: {
  monograph: Monograph;
  setVisible: (visible: boolean) => void;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [status, setStatus] = useState<SubmitStatus>();

  const onSubmit = useCallback(async (body: FormData) => {
    try {
      setStatus(undefined);
      const response = await fetch(`${BASE_URL}/submit`, {
        method: "post",
        body
      });
      const json = (await response.json()) as { error: string };

      if (!response.ok) {
        setStatus({ success: false, error: json.error });
      } else {
        setStatus({ success: true });
      }
    } catch (e) {
      if (e instanceof Error) {
        setStatus({ success: false, error: e.message });
        console.error(e);
      }
    }
  }, []);

  return (
    <Modal
      isOpen={true}
      shouldCloseOnOverlayClick
      shouldCloseOnEsc
      appElement={document.getElementById("root")!}
      overlayClassName={"theme-scope-dialog"}
      style={{
        overlay: {
          border: "none",
          backgroundColor: "transparent"
        },
        content: {
          backgroundColor: "var(--backdrop)",
          margin: 0,
          inset: 0,
          height: "100%",
          border: "none",
          justifyContent: "center",
          alignItems: "center",
          display: "flex",
          position: "fixed"
        }
      }}
      onRequestClose={() => {
        setVisible(false);
        setStatus(undefined);
      }}
    >
      <BaseThemeProvider colorScheme="dark" scope="dialog">
        <Flex
          ref={formRef}
          as="form"
          sx={{
            flexDirection: "column",
            width: ["120%", 400],
            marginLeft: ["-10%", 0],
            border: "1px solid var(--border)",
            borderRadius: 10,
            backgroundColor: "background",
            p: 25,
            rowGap: 2
          }}
          onSubmit={async (e) => {
            if (e.target instanceof HTMLFormElement) {
              e.preventDefault();
              const body = new FormData(e.target);
              onSubmit(body);
            }
          }}
        >
          <Text variant="heading">
            {status?.success ? "Reported" : "Report"}
          </Text>

          {status?.success ? (
            <>
              <Text variant="body">
                Thank you for helping us keep Monographs safe for everyone.
              </Text>
            </>
          ) : (
            <>
              {REPORT_TYPES.map((item) => (
                <Button
                  key={item.type}
                  title={item.title}
                  type="button"
                  variant="menuitem"
                  sx={{
                    borderRadius: "default",
                    justifyContent: "flex-start",
                    px: 2,
                    height: 35,
                    textAlign: "left"
                  }}
                  onClick={async () => {
                    if (!formRef.current) return;

                    const body = new FormData(formRef.current);

                    body.set("itemType", "monograph");
                    body.set("id", monograph.id);
                    body.set("type", item.type);
                    await onSubmit(body);
                  }}
                >
                  {item.title}
                </Button>
              ))}
              <Flex
                sx={{
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "column",
                  mt: 20
                }}
              >
                <Turnstile
                  sitekey={
                    process.env.NODE_ENV === "development"
                      ? "1x00000000000000000000AA"
                      : "0x4AAAAAAABECn7nWfOgIw-9"
                  }
                  onVerify={() => {
                    // noop
                  }}
                  style={{
                    fontSize: "1rem"
                  }}
                  theme={/*colorMode === "dark" ? "dark" :*/ "light"}
                />
              </Flex>
            </>
          )}

          <Button
            title={status ? "Close" : "Cancel"}
            sx={{
              alignSelf: "flex-end"
            }}
            variant="dialog"
            onClick={() => {
              setVisible(false);
              setStatus(undefined);
            }}
          >
            {status ? "Close" : "Cancel"}
          </Button>
        </Flex>
      </BaseThemeProvider>
    </Modal>
  );
}
