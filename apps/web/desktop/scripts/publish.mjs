const { sep } = require("path");
// const mv = require("mvdir");

console.log(`Script directory:`, __dirname);

// cd(`${__dirname}${sep}..${sep}..${sep}`);

// await $`yarn install`;

// await $`yarn build:desktop`;

// cd(`${__dirname}${sep}..${sep}`);

// const err = await mv(`..${sep}build`, `.${sep}build`);
// if (err) throw new Error("Error moving build directory.");

await $`esbuild .${sep}electron.js .${sep}preload.js --minify --external:electron --external:fsevents --bundle --outdir=.${sep}build --platform=node`;

await $`electron-builder -c.extraMetadata.main=.${sep}build${sep}electron.js`;
