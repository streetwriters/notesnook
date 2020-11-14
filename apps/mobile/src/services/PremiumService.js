import { db } from "../utils/DB";
import { eOpenPremiumDialog } from "../utils/Events";
import { eSendEvent } from "./EventManager";

let premiumStatus = null;

function setPremiumStatus(status) {
	try {
		let user = await db.user.get();
		if (!user || !user.id) {
		  premiumStatus = null;
		} else {
		 premiumStatus = user.subscription.status
		}
	  } catch (e) {
		premiumStatus = null
	  }
}

async function verify(callback) {
  try {
	let user = await db.user.get();
	
    if (!user || !user.id) {
      eSendEvent(eOpenPremiumDialog);
      return;
    } else {
      if (!callback) console.warn('You must provide a callback function');
      await callback();
    }
  } catch (e) {
    // show error dialog TODO
  }
}

export default {
  verify,
  setPremiumStatus
};
