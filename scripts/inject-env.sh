#!/bin/sh

set -e

# Directory where the built React SPA files are located
NGINX_ROOT=${NGINX_ROOT:-"/usr/share/nginx/html"}
FLAG_FILE="/.env_injected"

# Check if environment variables have already been injected
if [ -f "$FLAG_FILE" ]; then
  echo "Environment variables have already been injected. Skipping."
  exit 0
fi

echo "Starting environment variable injection..."

# Find all text files in the NGINX_ROOT directory
find "$NGINX_ROOT" -type f -name "*.html" -o -name "*.js" -o -name "*.css" -o -name "*.json" | while read -r file; do
  # Find all unique INJECT_ENV__ patterns in the file
  patterns=$(grep -o "INJECT_ENV__[A-Za-z0-9_]*" "$file" 2>/dev/null | sort -u || true)

  if [ -n "$patterns" ]; then
    echo "Processing file: $file"

    # Build a single sed command for all replacements in this file
    sed_command=""

    for pattern in $patterns; do
      # Extract the name without prefix
      name=${pattern#INJECT_ENV__}

      # Get the corresponding environment variable value (without INJECT_ENV__ prefix)
      value=$(env | grep "^$name=" | cut -d= -f2-)

      if [ -n "$value" ]; then
        # Append to the sed command with proper escaping for any special characters in value
        escaped_value=$(echo "$value" | sed 's/[\/&]/\\&/g')
        sed_command="${sed_command}s/\\b${pattern}\\b/${escaped_value}/g; "
      fi
    done

    # Execute the sed command only if we have replacements
    if [ -n "$sed_command" ]; then
      sed -i "$sed_command" "$file"
    fi
  fi
done

# Create a flag file to indicate that environment variables have been injected
touch "$FLAG_FILE"

echo "Environment variable injection completed."
