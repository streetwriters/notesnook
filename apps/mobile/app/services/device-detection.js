/*
This file is part of the Notesnook project (https://notesnook.com/)

Copyright (C) 2022 Streetwriters (Private) Limited

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

import { Dimensions, PixelRatio, Platform } from "react-native";
import DeviceInfo from "react-native-device-info";

let windowSize = Dimensions.get("window");

export class DeviceDetectionService {
  constructor() {
    this.setNewValues();
  }

  setNewValues() {
    windowSize = Dimensions.get("window");
    this.pixelDensity = PixelRatio.get();
    this.width = windowSize.width;
    this.height = windowSize.height;
    this.adjustedWidth = this.width * this.pixelDensity;
    this.adjustedHeight = this.height * this.pixelDensity;
    this.isPhoneOrTablet();
    this.isIosOrAndroid();
    this.detectIphoneX();
    this.checkSmallTab();
  }

  setSize(size) {
    windowSize = size;
    this.width = windowSize.width;
    this.height = windowSize.height;
    this.adjustedWidth = this.width * this.pixelDensity;
    this.adjustedHeight = this.height * this.pixelDensity;
    this.isPhoneOrTablet();
    this.isIosOrAndroid();
    this.detectIphoneX();
    this.checkSmallTab(size.width > size.height ? "LANDSCAPE" : "PORTRAIT");
  }

  getDeviceSize = () => {
    let dpi = this.pixelDensity * 160;
    let deviceWidthInInches = this.adjustedWidth / dpi;
    let deviceHeightInInches = this.adjustedHeight / dpi;
    let diagonalSize = Math.sqrt(
      Math.pow(deviceWidthInInches, 2) + Math.pow(deviceHeightInInches, 2)
    );
    return Platform.isPad ? diagonalSize + 2 : diagonalSize;
  };

  checkSmallTab(orientation) {
    this.width = Dimensions.get("screen").width;
    this.height = Dimensions.get("screen").height;
    let deviceSize = this.getDeviceSize();

    if (
      (!DeviceInfo.isTablet() && orientation === "LANDSCAPE") ||
      (DeviceInfo.isTablet() && (orientation === "PORTRAIT" || deviceSize < 9))
    ) {
      this.isTab = true;
      this.isPhone = false;
      this.isSmallTab = true;
    } else if (
      DeviceInfo.isTablet() &&
      orientation === "LANDSCAPE" &&
      deviceSize > 9
    ) {
      this.isTab = true;
      this.isPhone = false;
      this.isSmallTab = false;
    } else {
      if (!DeviceInfo.isTablet()) {
        this.isTab = false;
        this.isPhone = true;
        this.isSmallTab = false;
      } else {
        this.isTab = true;
        this.isSmallTab = false;
        this.isPhone = true;
      }
    }
  }

  isPhoneOrTablet() {
    if (DeviceInfo.isTablet()) {
      this.isTab = true;
      this.isPhone = false;
    } else {
      this.isTab = false;
      this.isPhone = false;
    }
  }

  isIosOrAndroid() {
    if (Platform.OS === "ios") {
      this.isIos = true;
      this.isAndroid = false;
    } else {
      this.isIos = false;
      this.isAndroid = true;
    }
  }

  detectIphoneX() {
    this.isIphoneX =
      Platform.OS === "ios" &&
      !Platform.isTVOS &&
      !Platform.isTVOS &&
      (windowSize.height === 812 || windowSize.width === 812);
  }

  isLargeTablet() {
    return this.isTab && !this.isSmallTab;
  }
}

export const DDS = new DeviceDetectionService();
