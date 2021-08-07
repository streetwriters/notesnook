const detox = require("detox");
const { LaunchApp } = require("./misc.e2e");

it('App Launch', async () => {
	await LaunchApp();
});