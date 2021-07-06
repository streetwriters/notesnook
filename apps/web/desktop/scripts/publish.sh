# Go to notes-web directory
cd ../

# Generate the web app build
if ! yarn build:desktop; then
    echo "Failed to build web app."
    exit
fi

# Change back to desktop directory
cd desktop

# Copy build files to desktop folder
# NOTE: we have to do this because electron-builder cannot work in parent directories. 
if ! yarn copyfiles -a ../build ./build; then
    echo "Could not copy build files."
    exit
fi

# Generate electron specific bundle
if ! yarn bundle; then
    echo "Could not generate electron bundle"
    exit
fi

# Build and publish
if ! electron-builder -c.extraMetadata.main=./build/electron.js; then
    echo "Failed to build and publish electron builds"
    exit
fi