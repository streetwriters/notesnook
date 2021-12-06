const detox = require('detox');
const {beforeAll} = require('jest-circus');
const {notesnook} = require('../test.ids');
const {
  LaunchApp,
  navigate,
  tapById,
  elementById,
  visibleByText,
  tapByText
} = require('./misc.e2e');
const {sleep} = require('./utils.test');

beforeAll(async () => {
  await device.reloadReactNative();
});

describe('Basic tests', () => {
  it('App should launch successfully & hide welcome screen', async () => {
    await LaunchApp();
  });

  it('Basic navigation should work', async () => {
    await sleep(500);
    await navigate('Notebooks');
    await navigate('Favorites');
    await navigate('Trash');
    await navigate('Tags');
    await navigate('Settings');
    await navigate('Monographs');
    await navigate('Notes');
  });

  it('App should create a note successfully', async () => {
    await sleep(100);
    await tapById(notesnook.buttons.add);
    await sleep(200);
    await elementById(notesnook.editor.id).tap({
      x: 15,
      y: 15
    });
    await elementById(notesnook.editor.id).typeText('Test note description that is very long and should not fit in text.');
    await sleep(200);
    await tapById(notesnook.editor.back);
    await sleep(300);
    await visibleByText('Test note description that ');
    await tapById(notesnook.ids.note.get(1));
    await tapById(notesnook.editor.back);
  });


});
