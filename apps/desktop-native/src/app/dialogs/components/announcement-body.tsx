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

import type { ReactNode } from "react";
import { Button, Flex, Image, Text, type SxProp } from "@ui";
import { shell } from "@platform";
import {
  Sync,
  Notebook,
  Tag2,
  Attachment,
  Backup,
  Vault,
  PDF,
  Edit
} from "../../components/icons";
import { store as appStore } from "../../stores/app-store";
import { createBackup } from "../../common";
import { allowedPlatforms } from "../../stores/announcement-store";
import { BuyDialog } from "../buy-dialog";
import { DialogManager } from "../../common/dialog-manager";

type ItemStyle = {
  marginTop?: number;
  marginBottom?: number;
  textAlign?: "left" | "center" | "right";
};

type CallToActionItem = {
  type: string;
  title: string;
  data: string;
  platforms: string[];
};

type AnnouncementItem = {
  type: string;
  platforms: string[];
  style?: ItemStyle;
  value?: string;
  text?: string;
  src?: string;
  items?: { text: string }[];
  actions?: CallToActionItem[];
};

const features = [
  { icon: Sync, title: "Instant private sync" },
  { icon: Notebook, title: "Unlimited notebooks" },
  { icon: Tag2, title: "Unlimited tags" },
  { icon: Attachment, title: "Encrypted attachments" },
  { icon: Backup, title: "Encrypted backups" },
  { icon: Vault, title: "Secure private vault" },
  { icon: PDF, title: "Export to PDF" },
  { icon: Edit, title: "Rich text editor" }
];

function mapStyle(style: ItemStyle | undefined, margins: number[]) {
  return {
    mt: margins[style?.marginTop ?? 0],
    mb: margins[style?.marginBottom ?? 0],
    textAlign: style?.textAlign
  } satisfies SxProp;
}

export function AnnouncementBody(props: {
  components: AnnouncementItem[];
  type: "inline" | "dialog";
  dismiss: () => void;
}) {
  const { components, type, dismiss } = props;
  const inline = type === "inline";
  const margins = inline ? [0, 1] : [0, 2];
  const horizontal = inline ? 2 : 3;

  const nodes: ReactNode[] = components
    .filter((item) =>
      item.platforms.some((platform) => allowedPlatforms.indexOf(platform) > -1)
    )
    .map((item, index) => {
      const style = item.style;
      switch (item.type) {
        case "title":
          return (
            <Text
              key={index}
              variant="heading"
              sx={{
                mx: horizontal,
                ...mapStyle(style, margins),
                fontSize: inline ? "subtitle" : undefined,
                textAlign: inline ? "left" : style?.textAlign
              }}
            >
              {(item.text || "").toUpperCase()}
            </Text>
          );
        case "subheading":
          if (inline) return null;
          return (
            <Text
              key={index}
              variant="heading"
              sx={{
                mx: horizontal,
                ...mapStyle(style, margins),
                fontSize: "title"
              }}
            >
              {(item.text || "").toUpperCase()}
            </Text>
          );
        case "description":
          return (
            <Text
              key={index}
              variant="body"
              selectable
              sx={{
                mx: horizontal,
                ...mapStyle(style, margins),
                fontSize: inline ? "body" : "subtitle",
                fontWeight: "normal",
                color: inline ? "icon" : "paragraph",
                textAlign: inline ? "left" : style?.textAlign,
                mt: inline ? 1 : margins[style?.marginTop ?? 0]
              }}
            >
              {item.text}
            </Text>
          );
        case "text":
          return (
            <Text
              key={index}
              variant="body"
              selectable
              sx={{ mx: horizontal, ...mapStyle(style, margins) }}
            >
              {item.value}
            </Text>
          );
        case "image":
          if (inline || !item.src) return null;
          return (
            <Image
              key={index}
              src={item.src}
              resizeMode="cover"
              sx={{ height: 150, ...mapStyle(style, margins) }}
            />
          );
        case "list":
          if (inline) return null;
          return (
            <Flex
              key={index}
              sx={{
                flexDirection: "column",
                ...mapStyle(style, margins)
              }}
            >
              {item.items?.map((listItem) => (
                <Text key={listItem.text} variant="body" selectable>
                  {`• ${listItem.text}`}
                </Text>
              ))}
            </Flex>
          );
        case "features":
          if (inline) return null;
          return (
            <Flex
              key={index}
              sx={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: 1,
                mx: horizontal,
                ...mapStyle(style, margins)
              }}
            >
              {features.map((feature) => (
                <Flex
                  key={feature.title}
                  sx={{
                    width: "49%",
                    p: 1,
                    flexDirection: "row",
                    borderRadius: "default",
                    border: "1px solid",
                    borderColor: "border"
                  }}
                >
                  <feature.icon size={16} />
                  <Text variant="body" sx={{ ml: 1 }}>
                    {feature.title}
                  </Text>
                </Flex>
              ))}
            </Flex>
          );
        case "callToActions":
          return (
            <Flex
              key={index}
              sx={{
                px: 2,
                pb: inline ? 0 : 2,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: inline ? "flex-start" : "center",
                gap: 1,
                ...mapStyle(style, margins)
              }}
            >
              {item.actions
                ?.filter((cta) =>
                  cta.platforms.some(
                    (platform) => allowedPlatforms.indexOf(platform) > -1
                  )
                )
                .map((action, actionIndex) => (
                  <CallToAction
                    key={actionIndex}
                    action={action}
                    primary={actionIndex === 0}
                    inline={inline}
                    dismiss={dismiss}
                  />
                ))}
            </Flex>
          );
        default:
          return null;
      }
    });

  return <Flex sx={{ flexDirection: "column" }}>{nodes}</Flex>;
}

function CallToAction(props: {
  action: CallToActionItem;
  primary: boolean;
  inline: boolean;
  dismiss: () => void;
}) {
  const { action, primary, inline, dismiss } = props;
  return (
    <Button
      variant={inline ? "anchor" : primary ? "accent" : "secondary"}
      onPress={async () => {
        dismiss();
        DialogManager.closeAll();
        switch (action.type) {
          case "link": {
            shell.openUrl(action.data);
            break;
          }
          case "promo": {
            const [coupon] = action.data.split(":");
            await BuyDialog.show({ couponCode: coupon });
            break;
          }
          case "force-sync": {
            await appStore.sync({ type: "full", force: true });
            break;
          }
          case "backup": {
            await createBackup();
            break;
          }
          default: {
            return;
          }
        }
      }}
    >
      <Text
        sx={
          inline
            ? {
                textDecorationLine: "underline",
                color: primary ? "accent" : "paragraph",
                fontWeight: "bold"
              }
            : undefined
        }
      >
        {action.title}
      </Text>
    </Button>
  );
}
