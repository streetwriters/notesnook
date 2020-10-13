import {Dimensions, PixelRatio, Platform} from "react-native";
import {DDS} from "../services/DeviceDetection";

export const scale = {
    fontScale: 1,
};
let windowSize = Dimensions.get('window');
let adjustedWidth = windowSize.width * PixelRatio.get();
let adjustedHeight = windowSize.height * PixelRatio.get();
const pixelDensity = PixelRatio.get();
export const getDeviceSize = () => {
    let dpi = getDpi(pixelDensity);
    let deviceWidthInInches = adjustedWidth / dpi;
    let deviceHeightInInches = adjustedHeight / dpi;
    let diagonalSize = Math.sqrt(
        Math.pow(deviceWidthInInches, 2) + Math.pow(deviceHeightInInches, 2),
    );
    return diagonalSize;
};
const getDpi = (pd) => {
    return 160 * pd;
};
const correction = (size, multiplier) => {
    let dSize = getDeviceSize();
    if (dSize >= 4 && dSize <= 5.3 && pixelDensity <= 3) {
        return size * 0.92;
    } else if (dSize > 5.3 && dSize < 7 && pixelDensity < 3 && !DDS.isTab) {
        if (Platform.OS === 'ios') {
            return size;
        }
        return size * 0.93;
    } else if (dSize <= 7 && pixelDensity >= 3 && !DDS.isTab) {
        return size * 0.98;
    } else if (dSize >= 6.5 && dSize <= 7.2 && DDS.isTab) {
        return size * multiplier;
    } else if (dSize > 7.2 && dSize <= 8.5 && DDS.isTab) {
        return size * (multiplier + 0.10);
    } else if (dSize > 8.5 && dSize <= 9.8 && DDS.isTab) {
        return size * (multiplier + 0.15);
    } else if (dSize > 9.8) {
        return size;
    } else {
        return size;
    }
};
export const normalize = (size) => {
    let pd = pixelDensity;
    if (pd === 1 || pd < 1) {
        return correction(size, 0.82);
    } else if (pd > 1 && pd <= 1.5) {
        return correction(size, 0.7);
    } else if (pd > 1.5 && pd <= 2) {
        return correction(size, 0.9);
    } else if (pd > 2 && pd <= 3) {
        return correction(size, 0.93);
    } else if (pd > 3) {
        return correction(size, 1);
    }
};
export const SIZE = {
    xxs: 10 * scale.fontScale,
    xs: 12 * scale.fontScale,
    sm: normalize(15) * scale.fontScale,
    md: normalize(17) * scale.fontScale,
    lg: normalize(24) * scale.fontScale,
    xl: normalize(27) * scale.fontScale,
    xxl: normalize(31) * scale.fontScale,
    xxxl: normalize(34) * scale.fontScale,
};

export function updateSize() {
    SIZE.xxs = 10 * scale.fontScale;
    SIZE.xs = 12 * scale.fontScale;
    SIZE.sm = normalize(15) * scale.fontScale;
    SIZE.md = normalize(17) * scale.fontScale;
    SIZE.lg = normalize(24) * scale.fontScale;
    SIZE.xl = normalize(27) * scale.fontScale;
    SIZE.xxl = normalize(31) * scale.fontScale;
    SIZE.xxxl = normalize(34) * scale.fontScale;
    ph = normalize(10) * scale.fontScale;
    pv = normalize(10) * scale.fontScale;
}

export const br = 5;  // border radius
export var ph = normalize(10);  // padding horizontal
export var pv = normalize(10);  // padding vertical
export const opacity = 0.5;  // active opacity
export const WEIGHT = {
    light: 'DMSans-Regular',
    regular: 'DMSans-Regular',
    medium: 'DMSans-Regular',
    semibold: 'DMSerifText-Regular',
    bold: 'DMSerifText-Regular',
};