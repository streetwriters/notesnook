#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<EOF
Usage: $0 <production|staging> [--marketing-version <x.y.z>] [--build-number <n>]

Examples:
  $0 production
  $0 staging --marketing-version 3.3.19 --build-number 2179
EOF
}

if [[ $# -lt 1 ]]; then
  usage
  exit 1
fi

ENV_NAME="$1"
shift

MARKETING_VERSION=""
BUILD_NUMBER=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --marketing-version)
      if [[ $# -lt 2 ]]; then
        echo "Missing value for --marketing-version"
        exit 1
      fi
      MARKETING_VERSION="$2"
      shift 2
      ;;
    --build-number)
      if [[ $# -lt 2 ]]; then
        echo "Missing value for --build-number"
        exit 1
      fi
      BUILD_NUMBER="$2"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1"
      usage
      exit 1
      ;;
  esac
done

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ACTIVE_FILE="$SCRIPT_DIR/ios-build.active.xcconfig"
SOURCE_FILE="$SCRIPT_DIR/ios-build.${ENV_NAME}.xcconfig"

if [[ ! -f "$SOURCE_FILE" ]]; then
  echo "Unknown config '$ENV_NAME'. Expected 'production' or 'staging'."
  exit 1
fi

set_or_append_key() {
  local file="$1"
  local key="$2"
  local value="$3"
  local escaped_value="${value//&/\\&}"

  if grep -Eq "^[[:space:]]*${key}[[:space:]]*=" "$file"; then
    sed -E -i.bak "s|^[[:space:]]*${key}[[:space:]]*=.*$|${key} = ${escaped_value}|g" "$file"
    rm -f "$file.bak"
  else
    printf "\n%s = %s\n" "$key" "$value" >> "$file"
  fi
}

if [[ -n "$MARKETING_VERSION" || -n "$BUILD_NUMBER" ]]; then
  for xcconfig in "$SCRIPT_DIR"/*.xcconfig; do
    if [[ -n "$MARKETING_VERSION" ]]; then
      set_or_append_key "$xcconfig" "IOS_MARKETING_VERSION" "$MARKETING_VERSION"
    fi

    if [[ -n "$BUILD_NUMBER" ]]; then
      set_or_append_key "$xcconfig" "IOS_CURRENT_PROJECT_VERSION" "$BUILD_NUMBER"
    fi
  done
fi

cp "$SOURCE_FILE" "$ACTIVE_FILE"
echo "Active iOS build config set to: $ENV_NAME"

if [[ -n "$MARKETING_VERSION" ]]; then
  echo "Updated marketing version in all xcconfigs: $MARKETING_VERSION"
fi

if [[ -n "$BUILD_NUMBER" ]]; then
  echo "Updated build number in all xcconfigs: $BUILD_NUMBER"
fi
