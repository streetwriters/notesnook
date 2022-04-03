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

const credentials = {
  username: 'testaccount1@notesnook.com',
  password: 'testaccount@123'
};

describe('AUTH', () => {
  it('Sign up', async () => {
    await prepare();

    await openSideMenu();
    await tapByText('Login to sync your notes.');
    await sleep(500);
    await tapByText(`Don't have an account? Sign up`);
    await elementById('input.email').typeText(credentials.username);
    await elementById('input.password').typeText(credentials.password);
    await elementById('input.confirmPassword').typeText(credentials.password);
    await elementById('input.confirmPassword').tapReturnKey();
    await sleep(5000);
    await device.pressBack();
    await visibleByText('Tap here to sync your notes.');
  });

  it('Login to account', async () => {
    await prepare();
    await openSideMenu();
    await tapByText('Login to sync your notes.');
    await elementById('input.email').typeText(credentials.username);
    await elementById('input.password').typeText(credentials.password);
    await elementById('input.password').tapReturnKey();
    await sleep(5000);
    await visibleByText('Tap here to sync your notes.');
  });

  it.only('Delete account', async () => {
    await prepare();
    await openSideMenu();
    await tapByText('Login to sync your notes.');
    await elementById('input.email').typeText(credentials.username);
    await elementById('input.password').typeText(credentials.password);
    await elementById('input.password').tapReturnKey();
    await sleep(5000);

    await tapByText('Settings');
    await sleep(1000);
    await elementById('scrollview').scrollToIndex(6);
    await sleep(2000);
    await tapByText('Delete account');
    await elementById('input-value').typeText(credentials.password);
    await tapByText('Delete');
    await sleep(5000);
  });
});
