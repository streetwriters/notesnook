import { Actions } from "../provider/Actions";
import { eOpenLoginDialog } from "../utils/Events";
import { eSendEvent } from "./EventManager";

export function setLoginMessage(dispatch) {
	dispatch({type:Actions.MESSAGE_BOARD_STATE,state:{
		visible:true,
		message:'You are not logged in',
		actionText:"Login to sync your notes",
		onPress: () => {
			eSendEvent(eOpenLoginDialog);
		},
		data:{},
		icon:'account-outline'
	}});
}

export function clearMessage(dispatch) {
	dispatch({type:Actions.MESSAGE_BOARD_STATE,state:{
		visible:false,
		message:'',
		actionText:"",
		onPress: null,
		data:{},
		icon:'account-outline'
	}});
}