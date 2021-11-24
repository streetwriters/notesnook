import dayjs from 'dayjs';
import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  Appearance,
  Linking,
  Platform,
  ScrollView,
  TouchableOpacity,
  View
} from 'react-native';
import * as RNIap from 'react-native-iap';
import {enabled} from 'react-native-privacy-snapshot';
import Menu, {MenuItem} from 'react-native-reanimated-material-menu';
import AnimatedProgress from 'react-native-reanimated-progress-bar';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import ToggleSwitch from 'toggle-switch-react-native';
import {Button} from '../../components/Button';
import {Button as MButton} from '../../components/Button/index';
import {ContainerTopSection} from '../../components/Container/ContainerTopSection';
import BaseDialog from '../../components/Dialog/base-dialog';
import DialogButtons from '../../components/Dialog/dialog-buttons';
import DialogContainer from '../../components/Dialog/dialog-container';
import DialogHeader from '../../components/Dialog/dialog-header';
import {presentDialog} from '../../components/Dialog/functions';
import {Issue} from '../../components/Github/issue';
import {Header as TopHeader} from '../../components/Header/index';
import Input from '../../components/Input';
import {PressableButton} from '../../components/PressableButton';
import Seperator from '../../components/Seperator';
import {Card} from '../../components/SimpleList/card';
import {Toast} from '../../components/Toast';
import Heading from '../../components/Typography/Heading';
import Paragraph from '../../components/Typography/Paragraph';
import {useTracked} from '../../provider';
import {Actions} from '../../provider/Actions';
import {
  useMessageStore,
  useSettingStore,
  useUserStore
} from '../../provider/stores';
import Backup from '../../services/Backup';
import BiometricService from '../../services/BiometricService';
import {DDS} from '../../services/DeviceDetection';
import {
  eSendEvent,
  eSubscribeEvent,
  eUnSubscribeEvent,
  openVault,
  presentSheet,
  ToastEvent
} from '../../services/EventManager';
import Navigation from '../../services/Navigation';
import Notifications from '../../services/Notifications';
import PremiumService from '../../services/PremiumService';
import SettingsService from '../../services/SettingsService';
import Sync from '../../services/Sync';
import {
  AndroidModule,
  APP_VERSION,
  InteractionManager,
  MenuItemsList,
  SUBSCRIPTION_PROVIDER,
  SUBSCRIPTION_STATUS,
  SUBSCRIPTION_STATUS_STRINGS
} from '../../utils';
import {
  ACCENT,
  COLOR_SCHEME,
  COLOR_SCHEME_DARK,
  COLOR_SCHEME_LIGHT,
  setColorScheme
} from '../../utils/Colors';
import {hexToRGBA, RGB_Linear_Shade} from '../../utils/ColorUtils';
import {db} from '../../utils/database';
import {
  eCloseProgressDialog,
  eOpenLoginDialog,
  eOpenPremiumDialog,
  eOpenProgressDialog,
  eOpenRecoveryKeyDialog,
  eOpenRestoreDialog,
  eScrollEvent,
  eUpdateSearchState
} from '../../utils/Events';
import {openLinkInBrowser} from '../../utils/functions';
import {MMKV} from '../../utils/mmkv';
import {tabBarRef} from '../../utils/Refs';
import {pv, SIZE} from '../../utils/SizeUtils';
import Storage from '../../utils/storage';
import {sleep} from '../../utils/TimeUtils';

const AccoutLogoutSection = () => {
	const [state, dispatch] = useTracked();
	const {colors} = state;
	const user = useUserStore(state => state.user);
	const [visible, setVisible] = useState(false);
	const [deleteAccount, setDeleteAccount] = useState(false);
	const [loading, setLoading] = useState(false);
	const passwordValue = useRef();
	const pwdInput = useRef();
  
	return !user ? null : (
	  <>
		{loading && (
		  <BaseDialog visible={true}>
			<View
			  style={{
				width: '100%',
				height: '100%',
				backgroundColor: colors.bg,
				justifyContent: 'center',
				alignItems: 'center'
			  }}>
			  <Heading color={colors.pri} size={SIZE.lg}>
				Logging out
			  </Heading>
			  <Paragraph color={colors.icon}>
				Please wait while log out and clear app data.
			  </Paragraph>
			  <View
				style={{
				  flexDirection: 'row',
				  height: 10,
				  width: 100,
				  marginTop: 15
				}}>
				<AnimatedProgress fill={colors.accent} total={8} current={8} />
			  </View>
			</View>
		  </BaseDialog>
		)}
  
		{visible && (
		  <BaseDialog visible={true}>
			<DialogContainer>
			  <DialogHeader
				title="Logout"
				paragraph="Clear all your data and reset the app."
				padding={12}
			  />
			  <Seperator />
			  <DialogButtons
				positiveTitle="Logout"
				negativeTitle="Cancel"
				onPressNegative={() => setVisible(false)}
				onPressPositive={async () => {
				  try {
					setVisible(false);
					setLoading(true);
					await sleep(10);
					await db.user.logout();
					await BiometricService.resetCredentials();
					await Storage.write('introCompleted', 'true');
					setLoading(false);
				  } catch (e) {
					setVisible(false);
					setLoading(false);
				  }
				}}
			  />
			</DialogContainer>
		  </BaseDialog>
		)}
  
		{deleteAccount && (
		  <BaseDialog
			onRequestClose={() => {
			  setDeleteAccount(false);
			  passwordValue.current = null;
			}}
			visible={true}>
			<DialogContainer>
			  <DialogHeader
				title="Delete account"
				paragraph="All your data will be removed
				  permanantly. Make sure you have saved backup of your notes. This action is IRREVERSIBLE."
				paragraphColor={colors.red}
				padding={12}
			  />
  
			  <Seperator half />
  
			  <View
				style={{
				  paddingHorizontal: 12
				}}>
				<Input
				  placeholder="Enter account password"
				  fwdRef={pwdInput}
				  onChangeText={v => {
					passwordValue.current = v;
				  }}
				  secureTextEntry={true}
				/>
			  </View>
  
			  <DialogButtons
				positiveTitle="Delete"
				positiveType="errorShade"
				onPressPositive={async () => {
				  if (!passwordValue.current) {
					ToastEvent.show({
					  heading: 'Account Password is required',
					  type: 'error',
					  context: 'local'
					});
					return;
				  }
				  try {
					await db.user.deleteUser(passwordValue.current);
				  } catch (e) {
					ToastEvent.show({
					  heading: 'Failed to delete account',
					  message: e.message,
					  type: 'error',
					  context: 'local'
					});
				  }
				  close();
				}}
				onPressNegative={() => {
				  setDeleteAccount(false);
				  passwordValue.current = null;
				}}
			  />
			</DialogContainer>
			<Toast context="local" />
		  </BaseDialog>
		)}
  
		{[
		  {
			name: 'Logout',
			func: async () => {
			  setVisible(true);
			}
		  }
		].map((item, index) => (
		  <PressableButton
			onPress={item.func}
			key={item.name}
			type="gray"
			customStyle={{
			  height: 50,
			  borderTopWidth: index === 0 ? 1 : 0,
			  borderTopColor: colors.nav,
			  width: '100%',
			  alignItems: 'flex-start',
			  paddingHorizontal: 12,
			  marginTop: index === 0 ? 25 : 0,
			  borderRadius: 0
			}}>
			<Heading
			  color={item.name === 'Logout' ? colors.pri : colors.red}
			  style={{
				fontSize: SIZE.md
			  }}>
			  {item.name}
			</Heading>
		  </PressableButton>
		))}
  
		<PressableButton
		  onPress={() => {
			setDeleteAccount(true);
			passwordValue.current = null;
		  }}
		  type="error"
		  customStyle={{
			borderWidth: 1,
			borderRadius: 5,
			paddingVertical: 10,
			width: '95%',
			alignItems: 'flex-start',
			paddingHorizontal: 12,
			marginTop: 25,
			borderColor: colors.red
		  }}>
		  <Heading
			color={colors.red}
			style={{
			  fontSize: SIZE.md
			}}>
			Delete account
		  </Heading>
		  <Paragraph
			style={{
			  flexWrap: 'wrap',
			  flexBasis: 1
			}}
			color={colors.red}>
			Your account will be deleted and all your data will be removed
			permanantly. Make sure you have saved backup of your notes. This
			action is IRREVERSIBLE.
		  </Paragraph>
		</PressableButton>
	  </>
	);
  };

  export default AccoutLogoutSection;