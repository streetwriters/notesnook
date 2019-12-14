import React, {PixelRatio, Platform, Dimensions} from 'react-native';
const windowSize = Dimensions.get('window');

export class DeviceDetectionService {
  constructor() {
    this.pixelDensity = PixelRatio.get();
    this.width = windowSize.width;
    this.height = windowSize.height;
    this.adjustedWidth = this.width * this.pixelDensity;
    this.adjustedHeight = this.height * this.pixelDensity;

    this.isPhoneOrTablet();
    this.isIosOrAndroid();
    this.detectIphoneX();
  }

  isPhoneOrTablet() {
    if (Platform.isPad) {
      this.isTab = true;
      this.isPhone = false;
    }
    if (
      this.pixelDensity < 2 &&
      (this.adjustedWidth >= 1000 || this.adjustedHeight >= 1000)
    ) {
      this.isTab = true;
      this.isPhone = false;
    } else if (
      this.pixelDensity === 2 &&
      (this.adjustedWidth >= 1920 || this.adjustedHeight >= 1920)
    ) {
      this.isTab = true;
      this.isPhone = false;
    } else {
      this.isTab = false;
      this.isPhone = true;
    }
  }

  isIosOrAndroid() {
    if (Platform.OS === 'ios') {
      this.isIos = true;
      this.isAndroid = false;
    } else {
      this.isIos = false;
      this.isAndroid = true;
    }
  }

  detectIphoneX() {
    if (
      Platform.OS === 'ios' &&
      !Platform.isTVOS &&
      !Platform.isTVOS &&
      (windowSize.height === 812 || windowSize.width === 812)
    ) {
      this.isIphoneX = true;
    } else {
      this.isIphoneX = false;
    }
  }
}
