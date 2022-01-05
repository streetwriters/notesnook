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
  switch (platform) {
    case "iOS":
      return [
        {
          link: "https://apps.apple.com/pk/app/notesnook-take-private-notes/id1544027013",
        },
      ];
    case "Android":
      return [
        {
          link: "https://play.google.com/store/apps/details?id=com.streetwriters.notesnook",
        },
      ];
    case "macOS":
      return [
        {
          type: "x64",
          link: "https://github.com/streetwriters/notesnook/releases/latest/download/notesnook_x64.dmg",
        },
        {
          type: "arm64",
          link: "https://github.com/streetwriters/notesnook/releases/latest/download/notesnook_amd64.dmg",
        },
      ];
    case "Windows":
      return [
        {
          type: ".exe",
          link: "https://github.com/streetwriters/notesnook/releases/latest/download/notesnook_x64.exe",
        },
      ];
    case "Linux":
      return [
        {
          type: ".AppImage",
          link: "https://github.com/streetwriters/notesnook/releases/latest/download/notesnook_x86_64.AppImage",
        },
        {
          type: ".deb",
          link: "https://github.com/streetwriters/notesnook/releases/latest/download/notesnook_x86_64.deb",
        },
        {
          type: ".rpm",
          link: "https://github.com/streetwriters/notesnook/releases/latest/download/notesnook_x86_64.rpm",
        },
      ];
    default:
      return [
        { link: "https://github.com/streetwriters/notesnook/releases/latest/" },
      ];
  }
}

export function isDesktop() {
  return "api" in window;
}

export function isTesting() {
  return !!process.env.REACT_APP_TEST;
}
