rm -rf dist/
cp ./node_modules/katex/dist/katex.min.css $(realpath ./styles/)
cp -r ./node_modules/katex/dist/fonts/ $(realpath ./styles/)
cp ./node_modules/prism-themes/themes/prism-dracula.min.css $(realpath ./styles/)/prism-theme.css

ln -s $(realpath ./src/styles.css) $(realpath ./styles/)

yarn tsc --module commonjs --outDir ./dist/cjs --target es2015
yarn tsc --module esnext --outDir ./dist/es --target es6

cat >dist/cjs/package.json <<!EOF
{
    "type": "commonjs"
}
!EOF

cat >dist/es/package.json <<!EOF
{
    "type": "module"
}
!EOF