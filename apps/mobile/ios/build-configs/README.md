# iOS Build Config Switching

This folder controls iOS bundle identifiers and app display name per environment.

## Files

- `ios-build.production.xcconfig`: production identifiers and name
- `ios-build.staging.xcconfig`: staging identifiers and name
- `ios-build.active.xcconfig`: active config consumed during build
- `use-ios-build-config.sh`: helper to switch active config

## Switch Active Config

From `apps/mobile`:

```bash
bash ios/build-configs/use-ios-build-config.sh production
bash ios/build-configs/use-ios-build-config.sh staging
```

## Build With Active Config

Use `xcodebuild` with the active file:

```bash
xcodebuild \
  -workspace ios/Notesnook.xcworkspace \
  -scheme Notesnook \
  -configuration Release \
  -xcconfig ios/build-configs/ios-build.active.xcconfig
```

You can also use a specific config file directly:

```bash
xcodebuild \
  -workspace ios/Notesnook.xcworkspace \
  -scheme Notesnook \
  -configuration Release \
  -xcconfig ios/build-configs/ios-build.staging.xcconfig
```
