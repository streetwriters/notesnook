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

import { useMemo } from "react";
import { Box, Button, Flex, Image, Link, Text } from "@theme-ui/components";
import { getRandom, usePromise } from "@notesnook/common";
import Grberk from "../../assets/testimonials/grberk.jpeg";
import Holenstein from "../../assets/testimonials/holenstein.jpg";
import Jason from "../../assets/testimonials/jason.jpg";
import Cameron from "../../assets/testimonials/cameron.jpg";
import { hosts } from "@notesnook/core";
import { SettingsDialog } from "../../dialogs/settings";
import { strings } from "@notesnook/intl";

const testimonials = [
  {
    username: "grberk",
    image: Grberk,
    name: "Glenn Berkshier",
    link: "https://twitter.com/grberk/status/1438955961490751489",
    text: "Are you looking for an alternative to @evernote, or just looking for a more secure note taking platform? Take a look at @notesnook and see if it will fit your needs."
  },
  {
    username: "HolensteinDan",
    image: Holenstein,
    name: "Dan Holenstein",
    link: "https://twitter.com/HolensteinDan/status/1439728355935342592",
    text: "@notesnook app is what @evernote should have become long ago. And they're still improving."
  },
  {
    username: "jasonbereklewis",
    image: Jason,
    name: "Jason Berek-Lewis",
    link: "https://twitter.com/jasonbereklewis/status/1438635808727044098",
    text: "I work in content writing and communications. My day starts and ends in Notesnook. My Chrome app is always open; it's where I take all my notes. The clean design, focus mode, the tagging and color coding are all features that help keep my work organised every day."
  },
  {
    username: "camflint",
    image: Cameron,
    name: "Cameron Flint",
    link: "https://twitter.com/camflint/status/1481061416434286592",
    text: "I'm pretty impressed at the progress @notesnook are making on their app — particularly in respect to how performant the app runs and behaves, despite the overhead of end-to-end encrypting user data."
  }
];

function randomTestimonial() {
  return testimonials[getRandom(0, testimonials.length - 1)];
}

function randomTitle() {
  return strings.webAuthTitles[
    getRandom(0, strings.webAuthTitles.length - 1)
  ]();
}

function AuthContainer(props) {
  const testimonial = useMemo(() => randomTestimonial(), []);
  const title = useMemo(() => randomTitle(), []);

  const version = usePromise(
    async () =>
      await fetch(`${hosts.API_HOST}/version`)
        .then((r) => r.json())
        .catch(() => undefined)
  );

  return (
    <Flex
      sx={{
        position: "relative",
        height: "100%",
        bg: "background"
      }}
    >
      <Box
        sx={{
          position: "relative",
          overflow: "hidden",
          flexDirection: "column",
          display: ["none", "none", "flex"],
          flex: 1
        }}
      >
        <Box
          as="svg"
          version="1.1"
          viewBox="0 0 1920 1080"
          preserveAspectRatio="xMinYMin slice"
          sx={{
            position: "absolute",
            top: -100,
            left: 0,
            height: "100%"
            // opacity: 0.7,
          }}
        >
          <g mask='url("#SvgjsMask1017")' fill="none">
            <path
              d="M1184.21-85.14C1033.8-60.27 964.89 302.42 717.38 307.22 469.87 312.02 483.97 244.72 250.55 244.72 17.13 244.72-98.53 307.08-216.28 307.22"
              stroke="var(--icon)"
              strokeWidth="2"
            ></path>
            <path
              d="M641.38-10.43C534.57 43 590.55 387.5 384.53 392.38 178.52 397.26 2.17 282.99-129.16 282.38"
              stroke="var(--icon)"
              strokeWidth="2"
            ></path>
            <path
              d="M1136.18-29.24C957.53-5.77 852.26 404.49 561.01 405.07 269.76 405.65 142.54 160.4-14.16 155.07"
              stroke="var(--icon)"
              strokeWidth="2"
            ></path>
            <path
              d="M508.47-71.88C398.16-66.29 333.42 117.75 114.38 127.84-104.65 137.93-170.96 308.31-279.7 312.84"
              stroke="var(--icon)"
              strokeWidth="2"
            ></path>
            <path
              d="M1104.88-26.74C976.63-19.04 883.5 217.2 653.03 218.11 422.55 219.02 427.1 155.61 201.17 155.61-24.75 155.61-136.64 217.96-250.68 218.11"
              stroke="var(--icon)"
              strokeWidth="2"
            ></path>
          </g>
          <defs>
            <mask id="SvgjsMask1017">
              <rect width="1440" height="500" fill="#ffffff"></rect>
            </mask>
          </defs>
        </Box>

        <Flex
          p={50}
          sx={{
            zIndex: 1,
            flex: 1,
            flexDirection: "column",
            alignItems: "start",
            justifyContent: "end"
          }}
        >
          <svg
            style={{
              height: 90,
              width: 90,
              alignSelf: "start",
              marginBottom: 20
            }}
          >
            <use href="#full-logo" />
          </svg>
          <Text variant={"heading"} sx={{ fontSize: 48 }}>
            {title}
          </Text>
          <Text
            variant="body"
            mt={10}
            sx={{ fontSize: 14, color: "paragraph-secondary" }}
          >
            {testimonial.text} —{" "}
            <Link
              sx={{ fontStyle: "italic", color: "paragraph-secondary" }}
              href={testimonial.link}
              target="_blank"
              rel="noopener noreferrer"
            >
              source
            </Link>
          </Text>
          <Flex mt={2} sx={{ alignItems: "center", justifyContent: "center" }}>
            <Image
              src={testimonial.image}
              sx={{ borderRadius: 50, width: 40 }}
            />
            <Flex ml={2} sx={{ flexDirection: "column" }}>
              <Text variant="body" sx={{ fontSize: 14, fontWeight: "bold" }}>
                {testimonial.name}
              </Text>
              <Text variant="subBody">@{testimonial.username}</Text>
            </Flex>
          </Flex>

          <Flex
            mt={2}
            pt={2}
            sx={{
              justifyContent: "space-between",
              borderTop: "1px solid var(--border)",
              width: "100%"
            }}
          >
            <Text variant={"subBody"}>
              {version.status === "fulfilled" &&
              !!version.value &&
              version.value.instance !== "default" ? (
                <>
                  {strings.usingInstance(
                    version.value.instance,
                    version.value.version
                  )}
                </>
              ) : (
                <>{strings.usingOfficialInstance()}</>
              )}
            </Text>
            <Button
              variant="anchor"
              onClick={() => SettingsDialog.show({ activeSection: "servers" })}
            >
              {strings.configure()}
            </Button>
          </Flex>
        </Flex>
      </Box>
      <Flex
        sx={{
          position: "relative",
          flex: 1.5,
          flexDirection: "column"
        }}
      >
        <Box
          as="svg"
          version="1.1"
          viewBox="0 0 1920 1080"
          preserveAspectRatio="xMinYMin slice"
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: "130%",
            height: "100%"
          }}
        >
          <path
            d="M0 336L29.2 316.2C58.3 296.3 116.7 256.7 174.8 267.5C233 278.3 291 339.7 349.2 361.3C407.3 383 465.7 365 523.8 359.5C582 354 640 361 698.2 346.5C756.3 332 814.7 296 872.8 267.2C931 238.3 989 216.7 1047.2 202.3C1105.3 188 1163.7 181 1221.8 202.7C1280 224.3 1338 274.7 1396.2 298C1454.3 321.3 1512.7 317.7 1570.8 332C1629 346.3 1687 378.7 1745.2 366.2C1803.3 353.7 1861.7 296.3 1890.8 267.7L1920 239L1920 0L1890.8 0C1861.7 0 1803.3 0 1745.2 0C1687 0 1629 0 1570.8 0C1512.7 0 1454.3 0 1396.2 0C1338 0 1280 0 1221.8 0C1163.7 0 1105.3 0 1047.2 0C989 0 931 0 872.8 0C814.7 0 756.3 0 698.2 0C640 0 582 0 523.8 0C465.7 0 407.3 0 349.2 0C291 0 233 0 174.8 0C116.7 0 58.3 0 29.2 0L0 0Z"
            fill="var(--background-secondary)"
          ></path>
          <path
            d="M0 627L29.2 607.3C58.3 587.7 116.7 548.3 174.8 564.7C233 581 291 653 349.2 683.5C407.3 714 465.7 703 523.8 703C582 703 640 714 698.2 724.8C756.3 735.7 814.7 746.3 872.8 742.7C931 739 989 721 1047.2 670.7C1105.3 620.3 1163.7 537.7 1221.8 528.7C1280 519.7 1338 584.3 1396.2 623.8C1454.3 663.3 1512.7 677.7 1570.8 666.8C1629 656 1687 620 1745.2 602C1803.3 584 1861.7 584 1890.8 584L1920 584L1920 237L1890.8 265.7C1861.7 294.3 1803.3 351.7 1745.2 364.2C1687 376.7 1629 344.3 1570.8 330C1512.7 315.7 1454.3 319.3 1396.2 296C1338 272.7 1280 222.3 1221.8 200.7C1163.7 179 1105.3 186 1047.2 200.3C989 214.7 931 236.3 872.8 265.2C814.7 294 756.3 330 698.2 344.5C640 359 582 352 523.8 357.5C465.7 363 407.3 381 349.2 359.3C291 337.7 233 276.3 174.8 265.5C116.7 254.7 58.3 294.3 29.2 314.2L0 334Z"
            fill="var(--hover)"
          ></path>
          <path
            d="M0 735L29.2 731.5C58.3 728 116.7 721 174.8 739C233 757 291 800 349.2 832.3C407.3 864.7 465.7 886.3 523.8 886.3C582 886.3 640 864.7 698.2 859.3C756.3 854 814.7 865 872.8 870.5C931 876 989 876 1047.2 845.3C1105.3 814.7 1163.7 753.3 1221.8 729.8C1280 706.3 1338 720.7 1396.2 738.7C1454.3 756.7 1512.7 778.3 1570.8 789.2C1629 800 1687 800 1745.2 814.5C1803.3 829 1861.7 858 1890.8 872.5L1920 887L1920 582L1890.8 582C1861.7 582 1803.3 582 1745.2 600C1687 618 1629 654 1570.8 664.8C1512.7 675.7 1454.3 661.3 1396.2 621.8C1338 582.3 1280 517.7 1221.8 526.7C1163.7 535.7 1105.3 618.3 1047.2 668.7C989 719 931 737 872.8 740.7C814.7 744.3 756.3 733.7 698.2 722.8C640 712 582 701 523.8 701C465.7 701 407.3 712 349.2 681.5C291 651 233 579 174.8 562.7C116.7 546.3 58.3 585.7 29.2 605.3L0 625Z"
            fill="var(--border)"
          ></path>
          <path
            d="M0 897L29.2 895.3C58.3 893.7 116.7 890.3 174.8 908.3C233 926.3 291 965.7 349.2 985.3C407.3 1005 465.7 1005 523.8 1003.3C582 1001.7 640 998.3 698.2 996.7C756.3 995 814.7 995 872.8 986C931 977 989 959 1047.2 939.2C1105.3 919.3 1163.7 897.7 1221.8 894C1280 890.3 1338 904.7 1396.2 911.8C1454.3 919 1512.7 919 1570.8 928C1629 937 1687 955 1745.2 960.3C1803.3 965.7 1861.7 958.3 1890.8 954.7L1920 951L1920 885L1890.8 870.5C1861.7 856 1803.3 827 1745.2 812.5C1687 798 1629 798 1570.8 787.2C1512.7 776.3 1454.3 754.7 1396.2 736.7C1338 718.7 1280 704.3 1221.8 727.8C1163.7 751.3 1105.3 812.7 1047.2 843.3C989 874 931 874 872.8 868.5C814.7 863 756.3 852 698.2 857.3C640 862.7 582 884.3 523.8 884.3C465.7 884.3 407.3 862.7 349.2 830.3C291 798 233 755 174.8 737C116.7 719 58.3 726 29.2 729.5L0 733Z"
            fill="var(--hover)"
          ></path>
          <path
            d="M0 1081L29.2 1081C58.3 1081 116.7 1081 174.8 1081C233 1081 291 1081 349.2 1081C407.3 1081 465.7 1081 523.8 1081C582 1081 640 1081 698.2 1081C756.3 1081 814.7 1081 872.8 1081C931 1081 989 1081 1047.2 1081C1105.3 1081 1163.7 1081 1221.8 1081C1280 1081 1338 1081 1396.2 1081C1454.3 1081 1512.7 1081 1570.8 1081C1629 1081 1687 1081 1745.2 1081C1803.3 1081 1861.7 1081 1890.8 1081L1920 1081L1920 949L1890.8 952.7C1861.7 956.3 1803.3 963.7 1745.2 958.3C1687 953 1629 935 1570.8 926C1512.7 917 1454.3 917 1396.2 909.8C1338 902.7 1280 888.3 1221.8 892C1163.7 895.7 1105.3 917.3 1047.2 937.2C989 957 931 975 872.8 984C814.7 993 756.3 993 698.2 994.7C640 996.3 582 999.7 523.8 1001.3C465.7 1003 407.3 1003 349.2 983.3C291 963.7 233 924.3 174.8 906.3C116.7 888.3 58.3 891.7 29.2 893.3L0 895Z"
            fill="var(--border)"
          ></path>
        </Box>
        {props.children}
      </Flex>
    </Flex>
  );
}
export default AuthContainer;
