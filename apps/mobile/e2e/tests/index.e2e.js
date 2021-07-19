const { notesnook } = require("../test.ids");
const { sleep } = require("./utils.test");

it('App initialization', async () => {
    device.launchApp();
    console.log('sleeping after launch');
    await sleep(5000);
	await expect(element(by.id(notesnook.ids.default.root))).toBeVisible();
});