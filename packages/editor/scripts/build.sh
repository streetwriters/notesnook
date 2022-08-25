cp ./node_modules/katex/dist/katex.min.css $(realpath ./styles/)
cp -r ./node_modules/katex/dist/fonts/ $(realpath ./styles/)
cp ./node_modules/prism-themes/themes/prism-dracula.min.css $(realpath ./styles/)/prism-theme.css
cp ./node_modules/prism-themes/themes/prism-dracula.min.css $(realpath ./styles/)/prism-theme.css

yarn tsc --watch