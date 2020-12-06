import { db } from "../utils/DB";
import { eOpenPremiumDialog } from "../utils/Events";
import { eSendEvent } from "./EventManager";

let premiumStatus = null;

async function setPremiumStatus(status) {
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

function get() {
  return premiumStatus && premiumStatus !== 0 && premiumStatus !== 4
}

async function verify(callback,error) {
  try {
	let user = await db.user.get();
	
    if (!user || !user.id) {
      if (error) {
        error();
        return;
      }

      eSendEvent( eOpenPremiumDialog);
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
  setPremiumStatus,
  get
};
