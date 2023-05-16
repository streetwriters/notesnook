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
  mdiCheck,
  mdiChevronDown,
  mdiLoading,
  mdiPlus,
  mdiClose,
  mdiDeleteOutline,
  mdiDownloadOutline,
  mdiCheckboxMarkedOutline,
  mdiChevronUp,
  mdiChevronRight,
  mdiWeatherNight,
  mdiWeatherSunny,
  mdiCogOutline,
  mdiNewspaperVariantOutline,
  mdiTextBoxOutline,
  mdiFitToScreenOutline,
  mdiCursorDefaultClickOutline,
  mdiNewspaper,
  mdiMagnify,
  mdiViewDayOutline,
  mdiViewDashboardOutline,
  mdiArrowLeft,
  mdiCheckCircleOutline,
  mdiCircleOutline,
  mdiBookOutline,
  mdiBookmarkOutline,
  mdiPound
} from "@mdi/js";

export const Icons = {
  darkMode: mdiWeatherNight,
  lightMode: mdiWeatherSunny,
  settings: mdiCogOutline,
  search: mdiMagnify,

  fullPage: mdiNewspaper,
  article: mdiNewspaperVariantOutline,
  visible: mdiViewDayOutline,
  selection: mdiCursorDefaultClickOutline,

  simplified: mdiTextBoxOutline,
  screenshot: mdiFitToScreenOutline,
  complete: mdiViewDashboardOutline,

  check: mdiCheck,
  checkbox: mdiCheckboxMarkedOutline,
  loading: mdiLoading,
  plus: mdiPlus,
  close: mdiClose,
  delete: mdiDeleteOutline,
  download: mdiDownloadOutline,
  chevronDown: mdiChevronDown,
  chevronUp: mdiChevronUp,
  chevronRight: mdiChevronRight,

  checkCircle: mdiCheckCircleOutline,
  circle: mdiCircleOutline,
  notebook: mdiBookOutline,
  topic: mdiBookmarkOutline,
  tag: mdiPound,

  none: "",
  back: mdiArrowLeft
};

export type IconNames = keyof typeof Icons;
