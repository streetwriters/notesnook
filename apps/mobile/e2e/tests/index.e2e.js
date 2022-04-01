const { notesnook } = require('../test.ids');
const { navigate, tapByText, prepare } = require('./utils');
const { sleep } = require('./utils');

describe('APP LAUNCH AND NAVIGATION', () => {
  it('App should launch successfully & hide welcome screen', async done => {
    await prepare();
  });

  it('Basic navigation should work', async done => {
    await prepare();
    await navigate('Notebooks');
    await tapByText('Skip introduction');
    await sleep(500);
    await navigate('Favorites');
    await navigate('Trash');
    await navigate('Tags');
    await navigate('Settings');
    await navigate('Monographs');
    await navigate('Notes');
  });
});
