ln -s $(realpath ./src/styles.css) $(realpath ./dist/)
ln -s $(realpath ./src/extensions.d.ts) $(realpath ./dist/)

yarn tsc --watch