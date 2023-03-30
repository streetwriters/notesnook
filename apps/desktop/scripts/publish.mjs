// const { sep } = require("path");
// // const mv = require("mvdir");

// console.log(`Script directory:`, __dirname);

// // cd(`${__dirname}/../../`);

// // await $`yarn install`;

// // await $`yarn build:desktop`;

// // cd(`${__dirname}/../`);

// // const err = await mv(`../build`, `./build`);
// // if (err) throw new Error("Error moving build directory.");
// await $`ls ./build`;

// await $`esbuild ./electron.js ./preload.js --minify --external:electron --external:fsevents --bundle --outdir=./build --platform=node`;

// await $`electron-builder -c.extraMetadata.main=./build/electron.js`;
