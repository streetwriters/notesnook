const { sep } = require("path");

console.log(`Script directory:`, __dirname);

cd(`${__dirname}${sep}..${sep}..${sep}`);

await $`yarn install`;

await $`yarn build:desktop`;

cd(`${__dirname}${sep}..${sep}`);

await $`yarn copyfiles -a ..${sep}build .${sep}build`;

await $`yarn bundle`;

await $`electron-builder -c.extraMetadata.main=.${sep}build${sep}electron.js`;
