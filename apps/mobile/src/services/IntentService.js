import ReceiveSharingIntent from 'react-native-receive-sharing-intent';
import { eOnLoadNote } from '../utils/Events';
import { tabBarRef } from '../utils/Refs';
import { setIntent } from '../views/Editor/Functions';
import { DDS } from './DeviceDetection';
import { eSendEvent } from './EventManager';

let previousIntent = {
  text: null,
  weblink: null,
};

function check() {
  ReceiveSharingIntent.getReceivedFiles(
    (d) => {
      let data = d[0];
      if (data.text || data.weblink) {
        let text = data.text;
        let weblink = data.weblink;
        let delta = null;

        if (weblink && text) {
          delta = [{insert: `${text + ' ' + weblink}`}];
          text = data.text + ' ' + data.weblink;
        } else if (text && !weblink) {
          delta = [{insert: `${text}`}];
          text = data.text;
        } else if (weblink) {
          delta = [{insert: `${weblink}`}];
          text = weblink;
        }

        previousIntent.text = text;
        previousIntent.weblink = weblink;
        setIntent();
        eSendEvent(eOnLoadNote, {
          type: 'intent',
          data: delta,
          text: text,
        });
        if (DDS.isPhone || DDS.isSmallTab) {
          tabBarRef.current?.goToPage(1);
        }
      }
      ReceiveSharingIntent.clearReceivedFiles();
    },
    (error) => {
      console.log(error, 'INTENT ERROR');
    },
  );
}

export default {
  check,
};
