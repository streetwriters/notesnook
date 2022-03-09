export function getPlatform() {
  var userAgent = window.navigator.userAgent,
    platform = window.navigator.platform,
    macosPlatforms = ["Macintosh", "MacIntel", "MacPPC", "Mac68K"],
    windowsPlatforms = ["Win32", "Win64", "Windows", "WinCE"],
    iosPlatforms = ["iPhone", "iPad", "iPod"],
    os = null;

  if (macosPlatforms.indexOf(platform) !== -1) {
    return "macOS";
  } else if (iosPlatforms.indexOf(platform) !== -1) {
    return "iOS";
  } else if (windowsPlatforms.indexOf(platform) !== -1) {
    return "Windows";
  } else if (/Android/.test(userAgent)) {
    return "Android";
  } else if (!os && /Linux/.test(platform)) {
    return "Linux";
  }

  return os;
}

export function getDownloadLink(platform) {
  const baseurl = `https://notesnook.com/downloads/${platform.toLowerCase()}`;
  switch (platform) {
    case "iOS":
      return [
        {
          type: "Install from App Store",
          link: "https://apps.apple.com/pk/app/notesnook-take-private-notes/id1544027013",
        },
      ];
    case "Android":
      return [
        {
          type: "Install from Google Play Store",
          link: "https://play.google.com/store/apps/details?id=com.streetwriters.notesnook",
        },
        {
          type: "Download .apk (arm64-v8a)",
          link: `${baseurl}/notesnook-arm64-v8a.apk`,
        },
        {
          type: "Download .apk (armeabi-v7a)",
          link: `${baseurl}/notesnook-armeabi-v7a.apk`,
        },
        {
          type: "Download .apk (x86)",
          link: `${baseurl}/notesnook-x86.apk`,
        },
        {
          type: "Download .apk (x86_64)",
          link: `${baseurl}/notesnook-x86_64.apk`,
        },
      ];
    case "macOS":
      return [
        {
          type: "Download .dmg (x64)",
          link: `${baseurl}/notesnook_x64.dmg`,
        },
        {
          type: "Download .dmg (arm64)",
          link: `${baseurl}/notesnook_arm64.dmg`,
        },
      ];
    case "Windows":
      return [
        {
          type: "Download .exe (x64)",
          link: `${baseurl}/notesnook_x64.exe`,
        },
      ];
    case "Linux":
      return [
        {
          type: "Download .AppImage",
          link: `${baseurl}/notesnook_x86_64.AppImage`,
        },
        {
          type: "Download .deb",
          link: `${baseurl}/notesnook_amd64.deb`,
        },
        {
          type: "Download .rpm",
          link: `${baseurl}/notesnook_x86_64.rpm`,
        },
      ];
    default:
      return [
        {
          type: "Download",
          link: "https://github.com/streetwriters/notesnook/releases/",
        },
      ];
  }
}

export function isDesktop() {
  return "api" in window;
}

export function isTesting() {
  return !!process.env.REACT_APP_TEST;
}
