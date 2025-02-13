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

import React, { useEffect, useState } from "react";
import { Linking, View } from "react-native";
import { ScrollView } from "react-native-actions-sheet";
import { checkVersion } from "react-native-check-version";
import Config from "react-native-config";
import deviceInfoModule from "react-native-device-info";
import { useThemeColors } from "@notesnook/theme";
import { STORE_LINK } from "../../../utils/constants";
import { AppFontSize } from "../../../utils/size";
import { Button } from "../../ui/button";
import Seperator from "../../ui/seperator";
import { SvgView } from "../../ui/svg";
import { ProgressBarComponent } from "../../ui/svg/lazy";
import Heading from "../../ui/typography/heading";
import Paragraph from "../../ui/typography/paragraph";
import { getContainerBorder } from "../../../utils/colors";
import { strings } from "@notesnook/intl";
const UPDATE_SVG = (color) =>
  `<svg data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" width="774" height="669.5" viewBox="0 0 774 669.5" xmlns:xlink="http://www.w3.org/1999/xlink"><path d="M938.2145,322.3829C936.73266,207.5841,878.16775,115.25,806.13079,115.25c-43.29082,0-81.71777,33.346-105.81477,84.87331l28.33157,71.08654-39.15446-43.81576c-9.876,29.64743-15.48115,63.49569-15.48115,99.44475a324.20917,324.20917,0,0,0,9.98686,80.80891l75.92761-12.24058-67.9507,37.99628c22.13728,60.69069,62.59851,102.1414,109.23586,104.87608l-8.988,244.5184,27.81449.99338-5.94527-245.75716c66.41162-6.32443,119.60967-91.20375,123.8712-197.42794l-45.89372-25.66252Z" transform="translate(-213 -115.25)" fill="#f0f0f0"/><rect x="157.51532" y="354.40187" width="6.60151" height="49.25266" fill="${color}"/><polygon points="187.815 376.276 182.98 380.779 160.823 356.936 138.658 380.779 133.823 376.276 160.823 347.243 187.815 376.276" fill="${color}"/><path d="M371.9876,543.6602a52.8121,52.8121,0,1,1,52.8121-52.81209A52.87183,52.87183,0,0,1,371.9876,543.6602Zm0-99.02268a46.21059,46.21059,0,1,0,46.21058,46.21059A46.26275,46.26275,0,0,0,371.9876,444.63752Z" transform="translate(-213 -115.25)" fill="${color}"/><rect x="212.75248" y="253.9314" width="3.63974" height="27.15545" fill="#e4e4e4"/><polygon points="229.458 265.992 226.793 268.475 214.576 255.328 202.356 268.475 199.69 265.992 214.576 249.984 229.458 265.992" fill="#e4e4e4"/><path d="M426.56422,409.9859a29.118,29.118,0,1,1,29.118-29.118A29.15089,29.15089,0,0,1,426.56422,409.9859Zm0-54.59616A25.47821,25.47821,0,1,0,452.04243,380.868,25.507,25.507,0,0,0,426.56422,355.38974Z" transform="translate(-213 -115.25)" fill="#e4e4e4"/><rect x="99.52274" y="186.73872" width="3.63974" height="27.15545" fill="#e4e4e4"/><polygon points="116.229 198.799 113.563 201.282 101.346 188.136 89.126 201.282 86.46 198.799 101.346 182.792 116.229 198.799" fill="#e4e4e4"/><path d="M313.33448,342.79321a29.118,29.118,0,1,1,29.118-29.118A29.15088,29.15088,0,0,1,313.33448,342.79321Zm0-54.59615a25.47821,25.47821,0,1,0,25.47821,25.4782A25.507,25.507,0,0,0,313.33448,288.19706Z" transform="translate(-213 -115.25)" fill="#e4e4e4"/><path d="M518.7325,635.91942a8.22484,8.22484,0,0,1,.958-12.302,9.56322,9.56322,0,0,1,1.26081-.83521l-6.99347-30.13439,16.26512,5.84042,4.14749,27.72073a8.21849,8.21849,0,0,1-2.21462,10.58849A10.12952,10.12952,0,0,1,518.7325,635.91942Z" transform="translate(-213 -115.25)" fill="#ffb8b8"/><path d="M516.88531,612.40706l-.08727-.29605c-8.79267-29.805-17.88169-60.6154-28.97824-94.16236l-.0728-.21977.2448-.13088c6.18493-3.30762,15.48114-3.08736,21.62358.51183,5.68293,3.33,8.55569,9.77159,7.0024,15.68347l8.09328,38.67327c3.29039,12.64158,6.69574,25.72668,9.95036,38.62892l.09229.36576-.504.0295c-5.92592.34536-12.04821.70254-16.95322.89973Z" transform="translate(-213 -115.25)" fill="#ccc"/><polygon points="229.16 657.57 217.627 657.57 212.138 616.801 229.16 616.801 229.16 657.57" fill="#ffb8b8"/><path d="M445.10175,783.06559H407.9141v-.43107c0-7.31472,6.49345-13.26551,14.47493-13.26551h22.71272Z" transform="translate(-213 -115.25)" fill="#2f2e41"/><polygon points="337.837 648.851 326.848 652.06 308.113 614.743 324.331 610.006 337.837 648.851" fill="#ffb8b8"/><path d="M521.60173,783.39141l-.14262-.41086c-2.42325-6.96953,1.79234-14.4459,9.39693-16.66692l21.64062-6.31955,4.53736,13.05Z" transform="translate(-213 -115.25)" fill="#2f2e41"/><ellipse cx="279.46347" cy="354.21043" rx="23.10522" ry="21.17504" fill="#ffb8b8"/><path d="M502.83713,465.536c.13132-8.54065-3.76885-16.99907-9.79916-21.25171a16.77762,16.77762,0,0,0-19.87954.322c-5.937,4.44645-9.65428,13.02823-9.33974,21.56167C477.12124,466.20257,490.42379,466.23726,502.83713,465.536Z" transform="translate(-213 -115.25)" fill="#2f2e41"/><path d="M448.74454,759.69687l-.46255-.04125c-10.03358-.90255-20.40891-1.83457-30.21419-1.9415l-.5333-.00589.07281-.48411c2.32311-15.42,3.30793-31.45044,4.26037-46.9538.9405-15.308,1.91269-31.13682,4.17769-46.17039.95818-4.0257,1.892-8.00342,2.82264-11.96682,7.70037-32.79837,14.97378-63.77816,29.98728-94.44433l.14194-.28963.34381.03789c14.08679,1.56221,27.62283,6.27241,38.11391,13.26256l.20326.13513-.00988.23027a131.25944,131.25944,0,0,0-.10174,14.17269,44.82523,44.82523,0,0,1,7.48241,42.489c4.13084,12.65215,8.40154,25.73075,12.75907,38.63212,10.5818,26.587,21.53153,54.10056,32.75594,81.99045l.1842.45717-.51791.11114c-8.07587,1.73775-16.40668,3.52938-24.62518,4.22482l-.31028.0261-.14745-.25174a587.30717,587.30717,0,0,1-50.88262-112.12662c-2.80473,7.83882-6.84508,14.91443-10.75934,21.76819a157.11556,157.11556,0,0,0-9.86087,19.31354c-1.73239,13.0365-2.192,27.16078-2.63591,40.81947-.42007,12.91442-.81671,25.11236-2.19312,36.582Z" transform="translate(-213 -115.25)" fill="#2f2e41"/><path d="M484.57528,444.67592c10.01507-1.97751,21.093-.09617,28.95819,6.09651s11.85919,16.9058,8.62805,26.09364-14.20114,15.65236-24.12,13.27969c2.84131-7.33881-.35623-16.34918-7.302-20.57639C482.50242,464.55626,480.23475,452.58775,484.57528,444.67592Z" transform="translate(-213 -115.25)" fill="#2f2e41"/><path d="M496.73471,571.62025l-.36633-.15281c-12.77629-5.34207-25.30408-9.441-37.04181-13.18089l-.35989-.07114-.00092-.95644.23358.07451c.04915-.09935.1045-.21217.16008-.32456.16031-.325.26963-.54642.36264-.69292l-.00252-.00126c.97862-1.82742,1.75651-3.59337,2.50868-5.30123.77628-1.76259,1.5776-3.58243,2.61295-5.50793a15.68833,15.68833,0,0,1-4.02289-17.95719c2.593-5.63211,9.20424-10.01859,16.15083-10.74644,2.54543-6.42185,8.21712-19.91552,8.21712-19.91552s11.92674-.30015,16.72316-.85793l.08062-.00926.07923.016c10.4711,2.10273,19.213,11.1834,21.25846,22.08265,1.72665,9.199-.89525,19.721-7.38227,29.62807A128.7532,128.7532,0,0,1,504.93,561.61682c-2.92186,3.34837-5.68157,6.51067-7.97367,9.69571Z" transform="translate(-213 -115.25)" fill="#ccc"/><path d="M519.3919,459.10521v0Z" transform="translate(-213 -115.25)" fill="#2f2e41"/><path d="M519.861,457.22412c-7.01076-.95907-12.51527-7.52688-11.71835-13.982s7.76344-11.72977,14.83079-11.22907,13.06654,6.694,12.77147,13.18459S528.81221,458.44864,519.861,457.22412Z" transform="translate(-213 -115.25)" fill="#2f2e41"/><path d="M518.76646,453.03852c-7.01067-.95906-12.51516-7.52688-11.71821-13.98194.54524-4.41578,3.9788-8.27657,8.35539-10.11667-5.65378,1.13408-10.51956,5.64916-11.17757,10.97881-.79695,6.45506,4.70754,13.02288,11.71821,13.98195a14.465,14.465,0,0,0,7.6875-.98538A14.866,14.866,0,0,1,518.76646,453.03852Z" transform="translate(-213 -115.25)" fill="#2f2e41"/><path d="M382.77632,566.82181a9.99626,9.99626,0,0,1,12.97554-3.271,9.61149,9.61149,0,0,1,1.27935.81118l28.67233-16.08336-.58936,16.00057-27.13738,12.82a10.15042,10.15042,0,0,1-11.63139,1.61428A8.34216,8.34216,0,0,1,382.77632,566.82181Z" transform="translate(-213 -115.25)" fill="#ffb8b8"/><path d="M406.35053,557.3917l.2755-.17406c27.73394-17.52829,56.40359-35.64765,87.2197-56.41349l.20185-.13613.21621.16792c5.46363,4.24233,8.33439,12.34854,6.67808,18.85539-1.5324,6.02009-7.20243,10.64869-13.80215,11.27624L450.049,550.84631c-11.90943,7.05521-24.23685,14.35751-36.42636,21.46865l-.34555.20162-.19828-.42571c-2.32974-5.0055-4.73707-10.17674-6.57422-14.34943Z" transform="translate(-213 -115.25)" fill="#ccc"/><path d="M986,784.75H214a1,1,0,0,1,0-2H986a1,1,0,0,1,0,2Z" transform="translate(-213 -115.25)" fill="#cacaca"/></svg>`;

export const Update = ({ version: appVersion, fwdRef }) => {
  const { colors } = useThemeColors();
  const [version, setVersion] = useState(appVersion);
  let notes = version?.notes
    ? version.notes.replace("Thank you for using Notesnook!", "").split("- ")
    : ["Bug fixes and performance improvements"];
  notes = notes?.map((n) => n.replace(/\n|<br>/g, ""));
  const isGithubRelease = Config.GITHUB_RELEASE === "true";

  const getSupportedAbi = () => {
    let abi = deviceInfoModule.supportedAbisSync();
    let armv8a = abi.find((a) => a === "arm64-v8a");
    let armv7 = abi.find((a) => a === "armeabi-v7a");

    return armv8a || armv7 || abi[0];
  };

  const GITHUB_URL =
    !version || !version.needsUpdate
      ? null
      : `https://github.com/streetwriters/notesnook/releases/download/${
          version.version
        }-android/notesnook-${getSupportedAbi()}.apk`;
  const GITHUB_PAGE_URL =
    !version || !version.needsUpdate
      ? null
      : `https://github.com/streetwriters/notesnook/releases/tag/${version.version}-android`;

  useEffect(() => {
    if (!version) {
      (async () => {
        try {
          let v = await checkVersion();
          setVersion(v);
        } catch (e) {
          setVersion({
            needsUpdate: false
          });
        }
      })();
    }
  }, [version]);

  return (
    <View
      style={{
        alignSelf: "center",
        alignItems: "center",
        width: "100%",
        paddingHorizontal: 12,
        maxHeight: "97%"
      }}
    >
      {!version || !version?.needsUpdate ? (
        <>
          <View
            style={{
              paddingVertical: 60,
              justifyContent: "center",
              alignItems: "center"
            }}
          >
            {!version ? (
              <>
                <ProgressBarComponent
                  size={AppFontSize.xxl}
                  indeterminate={true}
                  color={colors.primary.accent}
                  borderWidth={0}
                  height={5}
                  width={250}
                />
                <Paragraph
                  style={{
                    marginTop: 5
                  }}
                  size={AppFontSize.md}
                >
                  {strings.checkNewVersion()}
                </Paragraph>
              </>
            ) : (
              <Paragraph size={AppFontSize.md}>{strings.noUpdates()}</Paragraph>
            )}
          </View>
        </>
      ) : (
        <>
          <View
            style={{
              flexDirection: "row",
              alignItems: "flex-end",
              justifyContent: "space-between",
              width: "100%",
              backgroundColor: colors.secondary.background,
              borderRadius: 10,
              padding: 12,
              ...getContainerBorder(colors.secondary.background)
            }}
          >
            <View>
              <Heading>{strings.updateAvailable()}</Heading>
              <Paragraph>
                {strings.versionReleased(
                  version.version,
                  isGithubRelease ? "github" : "store"
                )}
              </Paragraph>
            </View>

            <SvgView
              src={UPDATE_SVG(colors.primary.accent)}
              width={100}
              height={100}
            />
          </View>

          <Seperator />
          <ScrollView
            nestedScrollEnabled={true}
            style={{
              width: "100%"
            }}
          >
            <Heading size={AppFontSize.md}>{strings.releaseNotes()}:</Heading>

            {version.body ? (
              <Paragraph
                color={colors.secondary.paragraph}
                style={{
                  marginBottom: 5,
                  fontFamily: "monospace",
                  fontSize: 12,
                  lineHeight: 20,
                  marginTop: 10
                }}
                selectable
              >
                {version.body}
              </Paragraph>
            ) : null}
            {notes.map((item) =>
              item && item !== "" ? (
                <Paragraph
                  key={item}
                  color={colors.secondary.paragraph}
                  style={{
                    marginBottom: 5
                  }}
                  selectable
                >
                  • {item}
                </Paragraph>
              ) : null
            )}
          </ScrollView>
          <Seperator />
          <Button
            title={
              isGithubRelease ? strings.downloadUpdate() : strings.update()
            }
            onPress={() => {
              Linking.openURL(isGithubRelease ? GITHUB_URL : STORE_LINK).catch(
                console.log
              );
            }}
            type="accent"
            style={{
              width: "100%"
            }}
          />

          <Paragraph
            size={12}
            color={colors.secondary.paragraph}
            style={{
              textDecorationLine: "underline",
              marginTop: 10
            }}
            onPress={() => {
              Linking.openURL(GITHUB_PAGE_URL).catch(() => {
                /* empty */
              });
            }}
          >
            {strings.readReleaseNotes()}
          </Paragraph>
        </>
      )}
    </View>
  );
};
