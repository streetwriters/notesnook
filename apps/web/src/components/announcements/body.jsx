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

import {
  Box,
  Button,
  Flex,
  Image as RebassImage,
  Text as RebassText
} from "@theme-ui/components";
import {
  Sync,
  Notebook,
  Tag2,
  Attachment,
  Backup,
  Vault,
  PDF,
  Edit
} from "../icons";
import { store as appStore } from "../../stores/app-store";
import { createBackup } from "../../common";
import { allowedPlatforms } from "../../stores/announcement-store";
import { alpha } from "@theme-ui/color";
import { BuyDialog } from "../../dialogs/buy-dialog/buy-dialog";
import { DialogManager } from "../../common/dialog-manager";

var margins = [0, 2];
var HORIZONTAL_MARGIN = 3;

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

export default function AnnouncementBody({ components, type, dismiss }) {
  return components
    .filter((item) =>
      item.platforms.some((platform) => allowedPlatforms.indexOf(platform) > -1)
    )
    .map((item) => {
      item.style = item.style || {};

      if (type === "inline") {
        HORIZONTAL_MARGIN = 2;
        margins = [0, 1];

        switch (item.type) {
          case "title":
            return (
              <Title
                item={{ ...item, style: { ...item.style, textAlign: "left" } }}
                fontSize="subtitle"
              />
            );
          case "description":
            return (
              <Description
                item={{
                  ...item,
                  style: { ...item.style, textAlign: "left", marginTop: 1 }
                }}
                fontSize="body"
                color="icon"
              />
            );
          case "callToActions":
            return (
              <InlineCalltoActions item={item} dismissAnnouncement={dismiss} />
            );
          case "text":
            return (
              <Text
                value={item.value}
                sx={mapStyle(item.style)}
                mx={HORIZONTAL_MARGIN}
              />
            );
          default:
            return null;
        }
      } else if (type === "dialog") {
        HORIZONTAL_MARGIN = 3;
        margins = [0, 2];

        switch (item.type) {
          case "image":
            return <Image item={item} />;
          case "list":
            return <List item={item} />;
          case "title":
            return <Title item={item} />;
          case "subheading":
            return <Title item={item} fontSize={"title"} />;
          case "description":
            return <Description item={item} fontSize="subtitle" />;
          case "callToActions":
            return <CalltoActions item={item} dismissAnnouncement={dismiss} />;
          case "features":
            return <Features item={item} />;
          case "text":
            return (
              <Text
                value={item.value}
                sx={mapStyle(item.style)}
                mx={HORIZONTAL_MARGIN}
              />
            );
          default:
            return null;
        }
      }
      return null;
    });
}

function Image({ item }) {
  const { src, style } = item;
  return (
    <RebassImage
      src={src}
      maxHeight="150px"
      sx={{
        objectFit: "cover",
        ...mapStyle(style)
      }}
    />
  );
}

function List({ item }) {
  const { items, listType, style } = item;
  return (
    <Flex
      as={listType || "ul"}
      mt={1}
      sx={{ ...mapStyle(style), flexDirection: "column" }}
    >
      {items.map((item) => (
        <ListItem key={item.text} item={item} />
      ))}
    </Flex>
  );
}

function ListItem({ item }) {
  const { text } = item;
  return <Text as="li" value={text} />;
}

function Title({ item, fontSize }) {
  const { text, style } = item;
  return (
    <Text
      value={text.toUpperCase()}
      variant="heading"
      mx={HORIZONTAL_MARGIN}
      sx={{ ...mapStyle(style), fontSize }}
    />
  );
}

function Description({ item, fontSize, color }) {
  const { text, style } = item;
  return (
    <Text
      value={text}
      variant="body"
      mx={HORIZONTAL_MARGIN}
      sx={{
        ...mapStyle(style),
        fontSize: fontSize,
        fontWeight: "normal",
        color: color || "paragraph"
      }}
    />
  );
}

function Text({ value, ...restProps }) {
  return (
    <RebassText className="selectable" variant={"body"} {...restProps}>
      {value}
    </RebassText>
  );
}

function CalltoActions({ item, dismissAnnouncement }) {
  const { actions, style } = item;
  return (
    <Flex
      // bg="bgSecondary"
      px={2}
      pb={2}
      sx={{
        ...mapStyle(style),
        alignItems: "center",
        justifyContent: "center",
        gap: 1
      }}
    >
      {actions
        ?.filter((cta) =>
          cta.platforms.some(
            (platform) => allowedPlatforms.indexOf(platform) > -1
          )
        )
        .map((action, index) => (
          <CalltoAction
            key={index}
            action={action}
            index={index}
            variant={index === 0 ? "accent" : "secondary"}
            sx={{
              ":first-of-type": {
                mr: 1
              }
            }}
            dismissAnnouncement={dismissAnnouncement}
          />
        ))}
    </Flex>
  );
}

function InlineCalltoActions({ item, dismissAnnouncement }) {
  const { actions, style } = item;
  return (
    <Flex px={2} sx={mapStyle(style)}>
      {actions
        ?.filter((cta) =>
          cta.platforms.some(
            (platform) => allowedPlatforms.indexOf(platform) > -1
          )
        )
        .map((action, index) => (
          <CalltoAction
            key={action.title}
            action={action}
            variant={"anchor"}
            sx={{
              textDecoration: "underline",
              textDecorationLine: "underline",
              textDecorationColor:
                index === 0 ? alpha("accent", 0.7) : "border",
              color: index === 0 ? "accent" : "paragraph",
              fontWeight: "bold"
            }}
            dismissAnnouncement={dismissAnnouncement}
          />
        ))}
    </Flex>
  );
}

function CalltoAction({ action, variant, sx, dismissAnnouncement }) {
  return (
    <Button
      variant={variant}
      sx={sx}
      onClick={async () => {
        if (dismissAnnouncement) dismissAnnouncement();
        DialogManager.closeAll();
        switch (action.type) {
          case "link": {
            const url = new URL(action.data);
            const target =
              url.origin === window.location.origin && !IS_DESKTOP_APP
                ? "_self"
                : "_blank";
            window.open(action.data, target, "noopener noreferrer");
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
      {action.title}
    </Button>
  );
}

export function Features({ item }) {
  const { style } = item;
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        columnGap: 1,
        rowGap: 1,
        mx: HORIZONTAL_MARGIN,
        ...mapStyle(style)
      }}
    >
      {features.map((feature) => (
        <Flex
          key={feature.title}
          p={1}
          sx={{
            borderRadius: "default",
            border: "1px solid var(--border)"
          }}
        >
          <feature.icon size={16} sx={{ alignSelf: "start" }} />
          <RebassText variant="body" ml={1}>
            {feature.title}
          </RebassText>
        </Flex>
      ))}
    </Box>
  );
}

function mapStyle(style) {
  return {
    mt: margins[style.marginTop],
    mb: margins[style.marginBottom],
    textAlign: style.textAlign
  };
}
