const { notesnook } = require('../test.ids');
const {
  navigate,
  tapByText,
  prepare,
  openSideMenu,
  elementById,
  visibleByText
} = require('./utils');
const { sleep } = require('./utils');

describe('AUTH', () => {
  it('Login to account', async () => {
    await prepare();
    await openSideMenu();
    await tapByText('Login to sync your notes.');
    await elementById('input.email').typeText('testaccount@notesnook.com');
    await elementById('input.password').typeText('testaccount@123');
    await elementById('input.password').tapReturnKey();
    await sleep(5000);
    await visibleByText('Tap here to sync your notes.');
  });
});
