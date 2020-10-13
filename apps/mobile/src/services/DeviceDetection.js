import {Dimensions, PixelRatio, Platform} from 'react-native';
import DeviceInfo from 'react-native-device-info';

let windowSize = Dimensions.get('window');

export class DeviceDetectionService {
  constructor() {
   this.setNewValues();
  }

  setNewValues() {
    windowSize = Dimensions.get('window');
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

  getDeviceSize = () => {
    let dpi = this.pixelDensity * 160;
    let deviceWidthInInches = this.adjustedWidth / dpi;
    let deviceHeightInInches = this.adjustedHeight / dpi;
    return Math.sqrt(
      Math.pow(deviceWidthInInches, 2) + Math.pow(deviceHeightInInches, 2),
    );
  };

  checkSmallTab(orientation) {
    this.width = Dimensions.get('screen').width;
    this.height = Dimensions.get('screen').height;
    let deviceSize = this.getDeviceSize();

    if (DeviceInfo.isTablet() && (orientation === "PORTRAIT" || deviceSize < 9)) {
      console.log('small tab');
      this.isTab = true;
      this.isPhone = false;
      this.isSmallTab = true;
    } else {
      if (!DeviceInfo.isTablet() ) {
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
    /*  if (Platform.isPad) {
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
    } */
    if (DeviceInfo.isTablet()) {
      this.isTab = true;
      this.isPhone = false;
    } else {
      this.isTab = false;
      this.isPhone = false;
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
    this.isIphoneX = Platform.OS === 'ios' &&
        !Platform.isTVOS &&
        !Platform.isTVOS &&
        (windowSize.height === 812 || windowSize.width === 812);
  }
}

export const DDS = new DeviceDetectionService();