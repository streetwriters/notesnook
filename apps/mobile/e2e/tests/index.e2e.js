const detox = require("detox");
const { LaunchApp } = require("./misc.e2e");


beforeAll(
	async () => {
	  await detox.init();
  	  await detox.device.launchApp();
	},
	30 * 1000,
);

it('App should launch successfully', async () => {
	await LaunchApp();
});