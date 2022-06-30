cp ./node_modules/katex/dist/katex.min.css $(realpath ./styles/)
cp ./node_modules/prism-themes/themes/prism-dracula.min.css $(realpath ./styles/)/prism-theme.css
ln -s $(realpath ./src/styles.css) $(realpath ./styles/)

yarn tsc --watch