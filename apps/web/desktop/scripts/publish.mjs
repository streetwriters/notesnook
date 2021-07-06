console.log(`Script directory:`, __dirname);

cd(`${__dirname}/../../`);

await $`yarn install`;

await $`yarn build:desktop`;

cd(`${__dirname}/../`);

await $`yarn copyfiles -a ../build ./build`;

await $`yarn bundle`;

await $`electron-builder -c.extraMetadata.main=./build/electron.js`;
