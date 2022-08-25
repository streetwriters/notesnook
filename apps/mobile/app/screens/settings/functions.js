import { presentDialog } from '../../components/dialog/functions';
import { ToastEvent } from '../../services/event-manager';
import { db } from '../../common/database';
import { sleep } from '../../utils/time';

export async function verifyUser(context, onsuccess, disableBackdropClosing, onclose, closeText) {
  presentDialog({
    context: context,
    title: "Verify it's you",
    input: true,
    inputPlaceholder: 'Enter account password',
    paragraph: 'Please enter your account password',
    positiveText: 'Verify',
    secureTextEntry: true,
    disableBackdropClosing: disableBackdropClosing,
    onClose: onclose,
    negativeText: closeText || 'Cancel',
    positivePress: async value => {
      try {
        let verified = await db.user.verifyPassword(value);
        if (verified) {
          sleep(300).then(async () => {
            await onsuccess();
          });
        } else {
          ToastEvent.show({
            heading: 'Incorrect password',
            message: 'The account password you entered is incorrect',
            type: 'error',
            context: 'global'
          });
          return false;
        }
      } catch (e) {
        ToastEvent.show({
          heading: 'Failed to backup data',
          message: e.message,
          type: 'error',
          context: 'global'
        });
        return false;
      }
    }
  });
}
