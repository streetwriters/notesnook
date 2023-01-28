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

import React from "react";
import {
  Dimensions,
  Image,
  TouchableOpacity,
  useWindowDimensions,
  View
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import useGlobalSafeAreaInsets from "../../hooks/use-global-safe-area-insets";
import { useNavigationFocus } from "../../hooks/use-navigation-focus";
import { DDS } from "../../services/device-detection";
import SettingsService from "../../services/settings";
import { useSettingStore } from "../../stores/use-setting-store";
import { useThemeColors } from "@notesnook/theme";
import { getElevation } from "../../utils";
import { tabBarRef } from "../../utils/global-refs";
import { SIZE } from "../../utils/size";
import { Button } from "../ui/button";
import { SvgView } from "../ui/svg";
import { BouncingView } from "../ui/transitions/bouncing-view";
import Heading from "../ui/typography/heading";
import Paragraph from "../ui/typography/paragraph";

let SVG_D = (color, color2) =>
  `<svg data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" width="485.83373" height="483.5" viewBox="0 0 485.83373 483.5" xmlns:xlink="http://www.w3.org/1999/xlink"><path d="M677.54186,336.34717H597.80041a11.47812,11.47812,0,0,1-9.06567-4.39356h0a11.62154,11.62154,0,0,1-2.17652-9.96777,201.63052,201.63052,0,0,0-.00049-93.647,11.62425,11.62425,0,0,1,2.17676-9.96729,11.47753,11.47753,0,0,1,9.06592-4.39355h79.74145a11.6235,11.6235,0,0,1,11.439,9.75537,337.96108,337.96108,0,0,1,0,102.8584A11.6235,11.6235,0,0,1,677.54186,336.34717Z" transform="translate(-357.08314 -208.25)" fill="${color2}"/><path d="M597.80041,219.978a5.51264,5.51264,0,0,0-4.35449,2.1084,5.65943,5.65943,0,0,0-1.05371,4.85351,207.656,207.656,0,0,1,.00048,96.44531,5.65638,5.65638,0,0,0,1.053,4.85254l.00049.00049a5.5112,5.5112,0,0,0,4.35425,2.10889h79.74145a5.58248,5.58248,0,0,0,5.50879-4.667,331.9854,331.9854,0,0,0,0-101.03516,5.58248,5.58248,0,0,0-5.50879-4.667Z" transform="translate(-357.08314 -208.25)" fill="${color}"/><path d="M660.14054,248.82872h-41.845a6.00633,6.00633,0,0,1-5.99977-5.99977v-2.34463a6.00633,6.00633,0,0,1,5.99977-5.99977h41.845a6.00633,6.00633,0,0,1,5.99976,5.99977V242.829A6.00632,6.00632,0,0,1,660.14054,248.82872Z" transform="translate(-357.08314 -208.25)" fill="${color2}"/><path d="M660.14054,278.4545h-41.845a6.00632,6.00632,0,0,1-5.99977-5.99976V270.1101a6.00632,6.00632,0,0,1,5.99977-5.99976h41.845a6.00632,6.00632,0,0,1,5.99976,5.99976v2.34464A6.00632,6.00632,0,0,1,660.14054,278.4545Z" transform="translate(-357.08314 -208.25)" fill="${color2}"/><path d="M660.14054,308.08029h-41.845a6.00633,6.00633,0,0,1-5.99977-5.99977v-2.34463a6.00632,6.00632,0,0,1,5.99977-5.99976h41.845a6.00632,6.00632,0,0,1,5.99976,5.99976v2.34463A6.00632,6.00632,0,0,1,660.14054,308.08029Z" transform="translate(-357.08314 -208.25)" fill="${color2}"/><path d="M827.54186,412.34717H747.80041a11.47812,11.47812,0,0,1-9.06567-4.39356h0a11.62154,11.62154,0,0,1-2.17652-9.96777,201.63052,201.63052,0,0,0-.00049-93.647,11.62425,11.62425,0,0,1,2.17676-9.96729,11.47753,11.47753,0,0,1,9.06592-4.39355h79.74145a11.6235,11.6235,0,0,1,11.439,9.75537,337.96108,337.96108,0,0,1,0,102.8584A11.6235,11.6235,0,0,1,827.54186,412.34717Z" transform="translate(-357.08314 -208.25)" fill="${color2}"/><path d="M747.80041,295.978a5.51264,5.51264,0,0,0-4.35449,2.1084,5.65943,5.65943,0,0,0-1.05371,4.85351,207.656,207.656,0,0,1,.00048,96.44531,5.65638,5.65638,0,0,0,1.053,4.85254l.00049.00049a5.5112,5.5112,0,0,0,4.35425,2.10889h79.74145a5.58248,5.58248,0,0,0,5.50879-4.667,331.9854,331.9854,0,0,0,0-101.03516,5.58248,5.58248,0,0,0-5.50879-4.667Z" transform="translate(-357.08314 -208.25)" fill="${color}"/><path d="M668.54186,498.84717H588.80041a11.97546,11.97546,0,0,1-9.45825-4.584,12.1192,12.1192,0,0,1-2.27-10.394,201.13112,201.13112,0,0,0-.00049-93.41357,12.12077,12.12077,0,0,1,2.27026-10.39356,11.97561,11.97561,0,0,1,9.4585-4.584h79.74145a12.12667,12.12667,0,0,1,11.93311,10.1792,338.45925,338.45925,0,0,1,0,103.01074A12.12668,12.12668,0,0,1,668.54186,498.84717Z" transform="translate(-357.08314 -208.25)" fill="${color}"/><path d="M810.14054,339.82872h-41.845a6.00633,6.00633,0,0,1-5.99977-5.99977v-2.34463a6.00633,6.00633,0,0,1,5.99977-5.99977h41.845a6.00633,6.00633,0,0,1,5.99976,5.99977V333.829A6.00632,6.00632,0,0,1,810.14054,339.82872Z" transform="translate(-357.08314 -208.25)" fill="${color2}"/><path d="M810.14054,369.4545h-41.845a6.00632,6.00632,0,0,1-5.99977-5.99976V361.1101a6.00632,6.00632,0,0,1,5.99977-5.99976h41.845a6.00632,6.00632,0,0,1,5.99976,5.99976v2.34464A6.00632,6.00632,0,0,1,810.14054,369.4545Z" transform="translate(-357.08314 -208.25)" fill="${color2}"/><circle cx="271.81102" cy="228.5" r="23" fill="${color}"/><path d="M639.89416,433.75h-8v-8a3,3,0,0,0-6,0v8h-8a3,3,0,0,0,0,6h8v8a3,3,0,0,0,6,0v-8h8a3,3,0,0,0,0-6Z" transform="translate(-357.08314 -208.25)" fill="${color2}"/><path d="M657.89416,225.25h-42a4.50508,4.50508,0,0,1-4.5-4.5v-8a4.50508,4.50508,0,0,1,4.5-4.5h42a4.50508,4.50508,0,0,1,4.5,4.5v8A4.50508,4.50508,0,0,1,657.89416,225.25Z" transform="translate(-357.08314 -208.25)" fill="${color}"/><path d="M809.89416,302.25h-42a4.50508,4.50508,0,0,1-4.5-4.5v-8a4.50508,4.50508,0,0,1,4.5-4.5h42a4.50508,4.50508,0,0,1,4.5,4.5v8A4.50508,4.50508,0,0,1,809.89416,302.25Z" transform="translate(-357.08314 -208.25)" fill="${color}"/><polygon points="88.596 471.061 100.856 471.061 104.689 423.773 88.594 423.773 88.596 471.061" fill="#ffb8b8"/><path d="M442.55234,675.30845l24.1438-.001h.001a15.38605,15.38605,0,0,1,15.38647,15.38623v.5l-39.53051.00146Z" transform="translate(-357.08314 -208.25)" fill="#2f2e41"/><polygon points="22.596 471.061 34.856 471.061 40.689 423.773 22.594 423.773 22.596 471.061" fill="#ffb8b8"/><path d="M376.55234,675.30845l24.1438-.001h.001a15.38605,15.38605,0,0,1,15.38647,15.38623v.5l-39.53051.00146Z" transform="translate(-357.08314 -208.25)" fill="#2f2e41"/><path d="M381.85436,664.37256a4.98141,4.98141,0,0,1-3.375-1.31836h0a4.961,4.961,0,0,1-1.61572-3.53711L371.947,483.30371l69.81115,17.45215,21.53955,64.61768a70.461,70.461,0,0,1,3.54541,25.82421l-2.67456,62.63672a4.996,4.996,0,0,1-4.99438,4.75879h-11.709a5.02349,5.02349,0,0,1-4.95483-4.32959l-8.3689-69.1416a37.82338,37.82338,0,0,0-5.53173-15.16406l-16.46949-26.07617a1.00011,1.00011,0,0,0-1.83764.41015L397.378,659.38037a4.99328,4.99328,0,0,1-4.687,4.39649l-10.552.58691C382.04406,664.36914,381.94934,664.37256,381.85436,664.37256Z" transform="translate(-357.08314 -208.25)" fill="#2f2e41"/><circle cx="73.05767" cy="136.40609" r="24.56103" fill="#ffb8b8"/><path d="M441.4237,507.92236a5.07628,5.07628,0,0,1-1.25293-.15918H440.17l-69.26428-17.75976a4.9985,4.9985,0,0,1-3.66285-5.81543L383.15,398.49707a31.21377,31.21377,0,0,1,18.24975-22.53955,30.11308,30.11308,0,0,1,28.26563,2.07519c.96973.605,1.94653,1.26465,2.90259,1.96094a30.96046,30.96046,0,0,1,12.57885,24.5293l1.2649,98.32861a5.00656,5.00656,0,0,1-4.988,5.0708Z" transform="translate(-357.08314 -208.25)" fill="${color}"/><path d="M378.03248,508.93008a10.05576,10.05576,0,0,1,4.214-14.83233l-3.08079-35.6018,16.326,8.84848.42262,32.4515a10.11027,10.11027,0,0,1-17.8818,9.13415Z" transform="translate(-357.08314 -208.25)" fill="#ffb8b8"/><path d="M383.86511,489.38916a5.53224,5.53224,0,0,1-1.36573-.17285,5.49559,5.49559,0,0,1-3.97192-3.98633l-8.02319-31.88379a47.37028,47.37028,0,0,1,3.76123-33.13476l16.80884-32.88184a15.54083,15.54083,0,0,1,18.8081-11.01855,15.35574,15.35574,0,0,1,9.47485,7.10058,15.56707,15.56707,0,0,1,1.65406,11.91309l-23.92749,53.50586.28418,32.03564a5.5186,5.5186,0,0,1-3.58448,5.20459l-8.00732,2.97363A5.48,5.48,0,0,1,383.86511,489.38916Z" transform="translate(-357.08314 -208.25)" fill="${color}"/><path d="M498.40087,495.83467a10.05578,10.05578,0,0,1-8.493-12.86954l-28.99341-20.88926,17.35654-6.60182,24.8717,20.84893a10.11027,10.11027,0,0,1-4.74186,19.51169Z" transform="translate(-357.08314 -208.25)" fill="#ffb8b8"/><path d="M483.223,480.58057a5.52249,5.52249,0,0,1-2.46265-.58155L451.3612,465.28174a47.381,47.381,0,0,1-22.66064-24.46533L414.74328,406.626a15.54363,15.54363,0,0,1,3.91772-21.44434,15.35158,15.35158,0,0,1,11.59034-2.54346,15.56975,15.56975,0,0,1,10.08081,6.51221l24.94507,53.03955L489.743,462.87256a5.51764,5.51764,0,0,1,1.60669,6.11182l-2.96973,8.0083a5.474,5.474,0,0,1-2.00684,2.59619,5.49717,5.49717,0,0,1-3.15014.9917Z" transform="translate(-357.08314 -208.25)" fill="${color}"/><path d="M424.98332,369.5931c1.305.571,3.97732-9.82732,2.78025-11.90707-1.78025-3.09293-1.675-3.07072-2.85681-5.117s-1.44623-4.84712.08417-6.64761,5.072-1.56163,5.77042.69581c-.4493-4.2878,3.79189-7.73454,7.993-8.70313s8.63244-.36723,12.85668-1.22917c4.90243-1.00032,10.00316-5.10972,8.04719-10.5007a7.5931,7.5931,0,0,0-1.48106-2.43408c-2.25993-2.54094-5.42117-3.62594-8.512-4.675-6.43006-2.18246-13.036-4.39233-19.82212-4.15141A28.7977,28.7977,0,0,0,404.3967,333.533a26.15571,26.15571,0,0,0-1.08344,4.02534c-2.32924,12.52423,4.94368,24.87794,16.75623,29.64715Z" transform="translate(-357.08314 -208.25)" fill="#2f2e41"/><polygon points="38.9 273.343 39.457 240.414 56.9 205.343 42.9 241.343 38.9 273.343" opacity="0.2"/><path d="M554.16035,564.23244,480.522,533.63692a11.47817,11.47817,0,0,1-6.68609-7.53565h0a11.62155,11.62155,0,0,1,1.81454-10.04,201.63062,201.63062,0,0,0,35.9304-86.47983,11.62422,11.62422,0,0,1,5.83445-8.36925,11.47751,11.47751,0,0,1,10.05779-.57884l73.63839,30.59552a11.62349,11.62349,0,0,1,6.8205,13.39769,337.96147,337.96147,0,0,1-39.46512,94.98607A11.6235,11.6235,0,0,1,554.16035,564.23244Z" transform="translate(-357.08314 -208.25)" fill="${color2}"/><path d="M525.17093,426.17415a5.51263,5.51263,0,0,0-4.83017.27629,5.65945,5.65945,0,0,0-2.83529,4.07775,207.65608,207.65608,0,0,1-37.00407,89.064,5.65636,5.65636,0,0,0-.88946,4.88515l.00027.00064a5.51116,5.51116,0,0,0,3.21185,3.61814l73.63839,30.59552a5.58247,5.58247,0,0,0,6.87782-2.19616,331.98566,331.98566,0,0,0,38.76558-93.30238,5.58248,5.58248,0,0,0-3.29652-6.42343Z" transform="translate(-357.08314 -208.25)" fill="${color}"/><path d="M564.38028,494.28148l-38.6424-16.05527a6.00633,6.00633,0,0,1-3.23855-7.84259l.8996-2.16518a6.00632,6.00632,0,0,1,7.84258-3.23856l38.6424,16.05527a6.00634,6.00634,0,0,1,3.23855,7.84259l-.8996,2.16518A6.00632,6.00632,0,0,1,564.38028,494.28148Z" transform="translate(-357.08314 -208.25)" fill="#808080"/><path d="M553.01334,521.63984l-38.6424-16.05527a6.00633,6.00633,0,0,1-3.23855-7.84259l.89959-2.16518a6.00634,6.00634,0,0,1,7.84259-3.23856L558.517,508.39351a6.00633,6.00633,0,0,1,3.23856,7.84258l-.8996,2.16519A6.00632,6.00632,0,0,1,553.01334,521.63984Z" transform="translate(-357.08314 -208.25)" fill="#808080"/><path d="M579.86437,455.832a4.48944,4.48944,0,0,1-1.68725-.33057l-38.938-15.74267a4.50518,4.50518,0,0,1-2.48535-5.8584l2.99878-7.417a4.50027,4.50027,0,0,1,5.85864-2.48486l38.938,15.74267a4.50518,4.50518,0,0,1,2.48535,5.8584l-2.99878,7.417a4.51079,4.51079,0,0,1-4.17139,2.81543Z" transform="translate(-357.08314 -208.25)" fill="${color}"/><path d="M498.08314,691.75h-140a1,1,0,1,1,0-2h140a1,1,0,0,1,0,2Z" transform="translate(-357.08314 -208.25)" fill="${color}"/></svg>`;

export const SVG_Z =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 245.487 113.9115"><g transform="translate(15.9581 -70.1437)"><path fill="#f2f2f2" d="M181.8672 183.796H88.3134v-54.8973l-.43-.2765 15.1857-14.7907a41.4878 41.4878 0 0 1 28.6939-11.8174l27.916-.2551.04.0477 22.2131 26.426-.0655.7316z" style="stroke-width:.264583"/><path fill="#fff" d="M105.9334 112.1178h55.9519v.5292h-55.9519zM100.3772 117.6741h55.9519v.5292h-55.9519z" style="stroke-width:.264583"/><path fill="#fff" d="M178.6826 154.0514h10.1706v8.9897h-10.1706z" data-name="Rectangle 371" style="stroke-width:.264583"/><path fill="#fff" d="M178.6826 138.4916h10.1706v8.8471h-10.1706z" data-name="Rectangle 372" style="stroke-width:.264583"/><path fill="#f2f2f2" d="M166.653 102.649h9.1202v31.5648h-9.1202z" style="stroke-width:.264583"/><path fill="#e6e6e6" d="M181.8672 183.7957h-50.0656v-36.3798a35.3975 35.3975 0 0 1 8.4588-22.9515l19.3804-22.7213 22.2264 26.4599z" style="stroke-width:.264583"/><path fill="#fff" d="M155.3064 156.4369h10.1706v8.9897h-10.1706z" data-name="Rectangle 374" style="stroke-width:.264583"/><path fill="#fff" d="M155.3064 140.8768h10.1706v8.8471h-10.1706z" data-name="Rectangle 375" style="stroke-width:.264583"/><path fill="#fff" d="M106.7252 154.0514h10.1706v8.9897h-10.1706z" data-name="Rectangle 378" style="stroke-width:.264583"/><path fill="#fff" d="M106.7252 138.4916h10.1706v8.8471h-10.1706z" data-name="Rectangle 379" style="stroke-width:.264583"/><path fill="#f2f2f2" d="M91.7626 85.332h11.0675v38.3117H91.7626z" style="stroke-width:.264583"/><path fill="#f2f2f2" d="M110.199 183.7954H-3.295v-66.6167l-.5047-.325.119-.116 20.73-20.1916A41.863 41.863 0 0 1 46.0038 84.621l37.2782-.3406.0402.0477 26.9535 32.0651-.0773.8764z" style="stroke-width:.264583"/><path fill="#e6e6e6" d="M110.199 183.7954H49.4881V134.88a29.9322 29.9322 0 0 1 7.1528-19.408l26.6087-31.1956 26.9492 32.0815Z" style="stroke-width:.264583"/><path fill="#fff" d="M80.3413 150.6172h9.8174v8.6775h-9.8174zM80.3413 135.5359h9.8174v8.6775h-9.8174z" data-name="Rectangle 381" style="stroke-width:.264583"/><path fill="#fff" d="M19.0243 147.7216H31.369v10.9112H19.0243z" data-name="Rectangle 385" style="stroke-width:.264583"/><path fill="#fff" d="M19.0243 128.8356H31.369v10.7381H19.0243z" data-name="Rectangle 386" style="stroke-width:.264583"/><ellipse cx="20.8891" cy="154.324" fill="#3f3d56" data-name="Ellipse 519" rx="8.7979" ry="17.9515" style="stroke-width:.264583"/><path fill="#808080" d="M21.7016 183.7075c-3.5237-21.1402-.0354-42.2063 0-42.4164l.6856.1162c-.0355.209-3.5036 21.1635 0 42.1862z" data-name="Path 2702" style="fill:#999;stroke-width:.264583"/><path fill="#808080" d="M-54.7406 146.1809h9.0223v.6953h-9.0223z" data-name="Rectangle 388" style="fill:#b3b3b3;stroke-width:.264583" transform="rotate(-28.142)"/><path fill="#808080" d="M-129.2795 83.128h.6953v9.0226h-.6953z" data-name="Rectangle 389" style="fill:#b3b3b3;stroke-width:.264583" transform="rotate(-61.842)"/><ellipse cx="-.4146" cy="141.6901" fill="#808080" data-name="Ellipse 520" rx="12.6968" ry="25.9067" style="fill:#333;stroke-width:.264583"/><path fill="#3f3d56" d="M.9996 184.0552c-5.0784-30.47-.0514-60.829 0-61.1323l.5056.0857c-.0513.3025-5.0636 30.5798 0 60.9624z" data-name="Path 2703" style="fill:#e6e6e6;stroke-width:.264583"/><path fill="#3f3d56" d="M-67.7316 125.3486h13.0209v.513h-13.0209z" data-name="Rectangle 390" style="fill:#ccc;stroke-width:.264583" transform="rotate(-28.142)"/><path fill="#3f3d56" d="M-129.3145 54.7885h.513v13.0209h-.513z" data-name="Rectangle 391" style="fill:#b3b3b3;stroke-width:.264583" transform="rotate(-61.842)"/><path fill="#3f3d56" d="m159.149 89.5463 2.7831-2.2262c-2.1621-.2381-3.0506.9406-3.413 1.874-1.6892-.7014-3.5283.2178-3.5283.2178l5.5687 2.0217a4.2137 4.2137 0 0 0-1.4097-1.8876z" data-name="Path 2708" style="stroke-width:.264583"/><path fill="#3f3d56" d="m108.853 72.401 2.7831-2.2262c-2.1621-.2381-3.0506.9406-3.413 1.874-1.6892-.7013-3.5283.2178-3.5283.2178l5.5687 2.0217a4.214 4.214 0 0 0-1.4105-1.8873z" data-name="Path 2709" style="stroke-width:.264583"/><path fill="#3f3d56" d="m178.9044 76.546 2.7831-2.2262c-2.1622-.2381-3.0506.9406-3.4131 1.874-1.6891-.7014-3.5282.2178-3.5282.2178l5.5687 2.0217a4.2138 4.2138 0 0 0-1.4097-1.8876z" data-name="Path 2710" style="stroke-width:.264583"/><path fill="#3f3d56" d="M60.5922 179.896a4.2088 4.2088 0 0 0-2.1077.5656 4.5297 4.5297 0 0 0-7.567 3.365h13.8924a4.2299 4.2299 0 0 0-4.2174-3.9304z" data-name="Path 2712" style="stroke-width:.264583"/><path fill="#3f3d56" d="M132.852 179.896a4.2088 4.2088 0 0 0-2.1076.5656 4.5297 4.5297 0 0 0-7.5671 3.365h13.8925a4.2299 4.2299 0 0 0-4.2178-3.9307z" data-name="Path 2713" style="stroke-width:.264583"/><g fill="#3f3d56" data-name="Group 204"><path d="M97.2576 176.8633H77.5234v.6366h3.0777v6.0476h.6365v-6.0476H93.225v6.0476h.6365v-6.0476h3.396z" data-name="Path 2714"/><path d="M77.5623 174.9588h19.7342v.6366H77.5623z" data-name="Rectangle 400"/><path d="M77.5623 173.3674h19.7342v.6365H77.5623z" data-name="Rectangle 401"/></g><ellipse cx="215.2396" cy="158.3491" fill="#e6e6e6" data-name="Ellipse 525" rx="7.7041" ry="15.7197" style="stroke-width:.264583"/><path fill="#3f3d56" d="M214.3815 184.0552c3.0816-18.4886.031-36.9094 0-37.0946l-.3069.053c.031.1833 3.0726 18.5551 0 36.9908z" data-name="Path 2716" style="stroke-width:.264583"/><path fill="#3f3d56" d="M-38.7353 256.9106h.3115v7.9035h-.3115z" data-name="Rectangle 406" style="stroke-width:.264583" transform="rotate(-61.847)"/><path fill="#3f3d56" d="M114.2645 243.4071h7.9035v.3115h-7.9035z" data-name="Rectangle 407" style="stroke-width:.264583" transform="rotate(-28.153)"/><g fill="#3f3d56" data-name="Group 205"><path d="M169.5172 176.8633H149.783v.6366h3.0776v6.0476h.6366v-6.0476h11.9872v6.0476h.6366v-6.0476h3.396z" data-name="Path 2714-2"/><path d="M149.8219 174.9588h19.7342v.6366h-19.7342z" data-name="Rectangle 400-2"/><path d="M149.8219 173.3674h19.7342v.6365h-19.7342z" data-name="Rectangle 401-2"/></g><path fill="#f2f2f2" d="m90.2625 105.5306-2.3728-5.5049-4.763.085-2.8892 5.488.0583.0732h-.0208v11.4152h9.981v-11.4153zM164.4423 119.3093l-1.9175-4.0238-3.849.062-2.3348 4.0115.0471.0535h-.0168v8.3438h8.0658v-8.3438z" data-name="Path 2700" style="stroke-width:.264583"/><path fill="#fff" d="M10.3066 102.6488h55.9519v.5292H10.3066zM10.3066 103.178h55.9519v.5292H10.3066zM166.653 104.181h9.1202v.5292h-9.1202zM166.653 109.7372h9.1202v.5292h-9.1202zM91.7626 87.2476h11.0675v.5292H91.7626zM91.7626 92.8039h11.0675v.5292H91.7626z" style="stroke-width:.264583"/></g></svg>';

const Intro = ({ navigation }) => {
  const colors = useThemeColors();
  const isTelemetryEnabled = useSettingStore(
    (state) => state.settings.telemetry
  );
  const { height } = useWindowDimensions();
  const insets = useGlobalSafeAreaInsets();
  useNavigationFocus(navigation, {
    onFocus: () => {
      tabBarRef.current.lock();
    }
  });

  return (
    <View
      testID="notesnook.splashscreen"
      style={{
        width: "100%",
        height: "100%",
        justifyContent: "center",
        alignItems: "center",
        marginTop: insets.top
      }}
    >
      <Image
        source={require("../../assets/images/notesnook.png")}
        style={{
          width: 40,
          height: 40,
          position: "absolute",
          top: 0
        }}
      />
      <View
        style={{
          flexGrow: 1,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 100
        }}
      >
        <SvgView
          width={height / 4 > 200 ? 200 : height / 4}
          height={height / 4 > 200 ? 200 : height / 4}
          src={SVG_D(colors.secondary.background, colors.primary.border)}
        />

        <View
          style={{
            marginTop: 40,
            marginBottom: 20,
            maxWidth: "80%",
            opacity: 0.8
          }}
        >
          <Heading>Safe & encrypted notes</Heading>
          <Paragraph size={SIZE.md + 4}>
            {"Write with freedom.\nNever compromise on\nprivacy again."}
          </Paragraph>
        </View>
      </View>

      <View
        style={{
          width: "100%",
          zIndex: 20,
          position: "absolute",
          bottom: height / 10
        }}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={{
            flexDirection: "row",
            alignSelf: "center",
            width: "90%",
            marginBottom: 12,
            paddingHorizontal: 12,
            justifyContent: "center",
            padding: 12,
            maxWidth: 500
          }}
          onPress={() => {
            SettingsService.set({ telemetry: !isTelemetryEnabled });
          }}
        >
          <Icon
            size={SIZE.lg}
            name={
              isTelemetryEnabled ? "checkbox-marked" : "checkbox-blank-outline"
            }
            color={
              isTelemetryEnabled ? colors.primary.accent : colors.primary.icon
            }
          />

          <Paragraph
            style={{
              flexShrink: 1,
              marginLeft: 12
            }}
            size={SIZE.md}
          >
            Help improve Notesnook by sending completely anonymized{" "}
            <Heading size={SIZE.md}>private analytics and bug reports.</Heading>
          </Paragraph>
        </TouchableOpacity>

        <Button
          fontSize={SIZE.md}
          height={45}
          width={250}
          onPress={async () => {
            navigation.navigate("AppLock", {
              welcome: true
            });
          }}
          style={{
            paddingHorizontal: 24,
            alignSelf: "center",
            borderRadius: 100,
            ...getElevation(5)
          }}
          type="accent"
          title="Get started"
        />
      </View>

      {colors.isDark ? null : (
        <BouncingView
          style={{
            position: "absolute",
            bottom: DDS.isTab ? -300 : -100,
            zIndex: -1
          }}
          duration={3000}
        >
          <SvgView
            width={Dimensions.get("window").width}
            height={Dimensions.get("window").width}
            src={SVG_Z}
          />
        </BouncingView>
      )}
    </View>
  );
};

export default Intro;

/**
 * 1. Welcome Screen
 * 2. Select privacy mode
 * 3. Ask to Sign up
 * 4. Sign up
 * 5. Home Screen
 */
