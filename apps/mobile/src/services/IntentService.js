import ReceiveSharingIntent from 'react-native-receive-sharing-intent';
import {setIntent} from '../views/Editor/Functions';

let previousIntent = {
  text: null,
  weblink: null,
};

async function check(callback) {
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
        callback({
          type: 'intent',
          data: delta,
        });
      } else {
        callback(null);
      }
      ReceiveSharingIntent.clearReceivedFiles();
    },
    (error) => {
      callback(null);
    },
  );
}

export default {
  check,
};
