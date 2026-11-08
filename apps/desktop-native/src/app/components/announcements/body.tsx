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

import { shell } from "@platform";
import {
  Button,
  dataColor,
  Flex,
  Grid,
  Image,
  Text as UIText,
  type ButtonProps,
  type SxProp,
  type TextProps
} from "@ui";
import {
  Attachment,
  Backup,
  Edit,
  Notebook,
  PDF,
  Sync,
  Tag2,
  Vault,
  type Icon
} from "../icons";
import { store as appStore } from "../../stores/app-store";
import { createBackup } from "../../common";
import { allowedPlatforms } from "../../stores/announcement-store";
import { BuyDialog } from "../../dialogs/buy-dialog";
import { DialogManager } from "../../common/dialog-manager";

type AnnouncementStyle = {
  marginTop?: number;
  marginBottom?: number;
  textAlign?: "left" | "center" | "right";
};

type AnnouncementAction = {
  title: string;
  type: string;
  data: string;
  platforms: string[];
};

type AnnouncementItem = {
  type: string;
  platforms: string[];
  style?: AnnouncementStyle;
  text?: string;
  value?: string;
  src?: string;
  items?: { text: string }[];
  listType?: string;
  actions?: AnnouncementAction[];
};

type Layout = { margins: number[]; horizontalMargin: number };
const INLINE_LAYOUT: Layout = { margins: [0, 1], horizontalMargin: 2 };
const DIALOG_LAYOUT: Layout = { margins: [0, 2], horizontalMargin: 3 };

const features: { icon: Icon; title: string }[] = [
  { icon: Sync, title: "Instant private sync" },
  { icon: Notebook, title: "Unlimited notebooks" },
  { icon: Tag2, title: "Unlimited tags" },
  { icon: Attachment, title: "Encrypted attachments" },
  { icon: Backup, title: "Encrypted backups" },
  { icon: Vault, title: "Secure private vault" },
  { icon: PDF, title: "Export to PDF" },
  { icon: Edit, title: "Rich text editor" }
];

type AnnouncementBodyProps = {
  components: AnnouncementItem[];
  type: "inline" | "dialog";
  dismiss?: () => void;
};

export default function AnnouncementBody({
  components,
  type,
  dismiss
}: AnnouncementBodyProps) {
  const layout = type === "inline" ? INLINE_LAYOUT : DIALOG_LAYOUT;
  return (
    <>
      {components
        .filter((item) =>
          item.platforms.some(
            (platform) => allowedPlatforms.indexOf(platform) > -1
          )
        )
        .map((item, index) => {
          const style = item.style || {};
          const key = `${item.type}-${index}`;
          const props = { layout };
          if (type === "inline") {
            switch (item.type) {
              case "title":
                return (
                  <Title
                    key={key}
                    {...props}
                    item={{ ...item, style: { ...style, textAlign: "left" } }}
                    fontSize="subtitle"
                  />
                );
              case "description":
                return (
                  <Description
                    key={key}
                    {...props}
                    item={{
                      ...item,
                      style: { ...style, textAlign: "left", marginTop: 1 }
                    }}
                    fontSize="body"
                    color="icon"
                  />
                );
              case "callToActions":
                return (
                  <InlineCalltoActions
                    key={key}
                    item={item}
                    dismissAnnouncement={dismiss}
                  />
                );
              case "text":
                return (
                  <BodyText
                    key={key}
                    value={item.value}
                    sx={{
                      ...mapStyle(style, layout),
                      mx: layout.horizontalMargin
                    }}
                  />
                );
              default:
                return null;
            }
          } else {
            switch (item.type) {
              case "image":
                return <AnnouncementImage key={key} {...props} item={item} />;
              case "list":
                return <List key={key} {...props} item={item} />;
              case "title":
                return <Title key={key} {...props} item={item} />;
              case "subheading":
                return (
                  <Title key={key} {...props} item={item} fontSize="title" />
                );
              case "description":
                return (
                  <Description
                    key={key}
                    {...props}
                    item={item}
                    fontSize="subtitle"
                  />
                );
              case "callToActions":
                return (
                  <CalltoActions
                    key={key}
                    item={item}
                    dismissAnnouncement={dismiss}
                  />
                );
              case "features":
                return <Features key={key} {...props} item={item} />;
              case "text":
                return (
                  <BodyText
                    key={key}
                    value={item.value}
                    sx={{
                      ...mapStyle(style, layout),
                      mx: layout.horizontalMargin
                    }}
                  />
                );
              default:
                return null;
            }
          }
        })}
    </>
  );
}

function AnnouncementImage({
  item,
  layout
}: {
  item: AnnouncementItem;
  layout: Layout;
}) {
  if (!item.src) return null;
  return (
    <Image
      src={item.src}
      resizeMode="cover"
      sx={{ maxHeight: 150, ...mapStyle(item.style || {}, layout) }}
    />
  );
}

function List({ item, layout }: { item: AnnouncementItem; layout: Layout }) {
  return (
    <Flex
      sx={{
        flexDirection: "column",
        mt: 1,
        ...mapStyle(item.style || {}, layout)
      }}
    >
      {item.items?.map((listItem, index) => (
        <BodyText
          key={listItem.text}
          value={
            item.listType === "ol"
              ? `${index + 1}. ${listItem.text}`
              : `• ${listItem.text}`
          }
        />
      ))}
    </Flex>
  );
}

function Title({
  item,
  fontSize,
  layout
}: {
  item: AnnouncementItem;
  fontSize?: SxProp["fontSize"];
  layout: Layout;
}) {
  return (
    <BodyText
      value={(item.text || "").toUpperCase()}
      variant="heading"
      sx={{
        mx: layout.horizontalMargin,
        ...mapStyle(item.style || {}, layout),
        fontSize
      }}
    />
  );
}

function Description({
  item,
  fontSize,
  color,
  layout
}: {
  item: AnnouncementItem;
  fontSize?: SxProp["fontSize"];
  color?: "icon";
  layout: Layout;
}) {
  return (
    <BodyText
      value={item.text}
      sx={{
        mx: layout.horizontalMargin,
        ...mapStyle(item.style || {}, layout),
        fontSize,
        fontWeight: "normal",
        color: color || "paragraph"
      }}
    />
  );
}

function BodyText({
  value,
  ...restProps
}: { value?: string } & Omit<TextProps, "children">) {
  return (
    <UIText selectable variant="body" {...restProps}>
      {value}
    </UIText>
  );
}

function CalltoActions({
  item,
  dismissAnnouncement
}: {
  item: AnnouncementItem;
  dismissAnnouncement?: () => void;
}) {
  return (
    <Flex
      sx={{
        flexDirection: "row",
        px: 2,
        pb: 2,
        alignItems: "center",
        justifyContent: "center",
        gap: 1
      }}
    >
      {item.actions
        ?.filter((cta) =>
          cta.platforms.some(
            (platform) => allowedPlatforms.indexOf(platform) > -1
          )
        )
        .map((action, index) => (
          <CalltoAction
            key={index}
            action={action}
            variant={index === 0 ? "accent" : "secondary"}
            dismissAnnouncement={dismissAnnouncement}
          />
        ))}
    </Flex>
  );
}

function InlineCalltoActions({
  item,
  dismissAnnouncement
}: {
  item: AnnouncementItem;
  dismissAnnouncement?: () => void;
}) {
  return (
    <Flex sx={{ flexDirection: "row", px: 2 }}>
      {item.actions
        ?.filter((cta) =>
          cta.platforms.some(
            (platform) => allowedPlatforms.indexOf(platform) > -1
          )
        )
        .map((action, index) => (
          <CalltoAction
            key={action.title}
            action={action}
            variant="anchor"
            sx={{
              textDecorationLine: "underline",
              color: index === 0 ? "accent" : "paragraph",
              fontWeight: "bold"
            }}
            dismissAnnouncement={dismissAnnouncement}
          />
        ))}
    </Flex>
  );
}

function CalltoAction({
  action,
  variant,
  sx,
  dismissAnnouncement
}: {
  action: AnnouncementAction;
  variant: ButtonProps["variant"];
  sx?: SxProp;
  dismissAnnouncement?: () => void;
}) {
  return (
    <Button
      variant={variant}
      sx={sx}
      onPress={async () => {
        if (dismissAnnouncement) dismissAnnouncement();
        DialogManager.closeAll();
        switch (action.type) {
          case "link": {
            shell.openUrl(action.data);
            break;
          }
          case "promo": {
            const [coupon, plan] = action.data.split(":");
            await BuyDialog.show({ plan, coupon });
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
      <UIText>{action.title}</UIText>
    </Button>
  );
}

export function Features({
  item,
  layout
}: {
  item: AnnouncementItem;
  layout: Layout;
}) {
  return (
    <Grid
      columns={2}
      sx={{
        columnGap: 1,
        rowGap: 1,
        mx: layout.horizontalMargin,
        ...mapStyle(item.style || {}, layout)
      }}
    >
      {features.map((feature) => (
        <Flex
          key={feature.title}
          sx={{
            flexDirection: "row",
            p: 1,
            borderRadius: "default",
            border: "1px solid",
            borderColor: "border"
          }}
        >
          <feature.icon
            size={16}
            color="icon"
            sx={{ alignSelf: "flex-start" }}
          />
          <UIText variant="body" sx={{ ml: 1 }}>
            {feature.title}
          </UIText>
        </Flex>
      ))}
    </Grid>
  );
}

function mapStyle(style: AnnouncementStyle, layout: Layout): SxProp {
  return {
    mt: layout.margins[style.marginTop ?? 0],
    mb: layout.margins[style.marginBottom ?? 0],
    textAlign: style.textAlign
  };
}

export const ANNOUNCEMENT_DISMISS_COLORS = {
  background: dataColor("#ff000033"),
  icon: dataColor("#ff0000")
};
