import { db } from "../utils/DB";
import { eOpenPremiumDialog } from "../utils/Events";
import { eSendEvent } from "./EventManager";

let premiumStatus = true;

async function setPremiumStatus() {

	try {
		let user = await db.user.getUser();
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
  //return true;
  return premiumStatus && premiumStatus !== 0 && premiumStatus !== 4
}

async function verify(callback,error) {

 /*  if (!callback) console.warn('You must provide a callback function');
  await callback();

  return; */
  try {
	let user = await db.user.getUser();
	
    if (!user || !user.id || premiumStatus) {
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
