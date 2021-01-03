import React, {createRef, useEffect, useState} from 'react';
import {Modal, SafeAreaView, TouchableOpacity, View} from 'react-native';
import Animated, {Easing} from 'react-native-reanimated';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import WebView from 'react-native-webview';
import {useTracked} from '../../provider';
import {Actions} from '../../provider/Actions';
import {DDS} from '../../services/DeviceDetection';
import {
  eSendEvent,
  eSubscribeEvent,
  eUnSubscribeEvent,
  sendNoteEditedEvent,
} from '../../services/EventManager';
import {dHeight} from '../../utils';
import {db} from '../../utils/DB';
import {
  eApplyChanges,
  eShowMergeDialog,
  refreshNotesPage,
} from '../../utils/Events';
import {normalize, SIZE} from '../../utils/SizeUtils';
import {Button} from '../Button';
import BaseDialog from '../Dialog/base-dialog';
import DialogButtons from '../Dialog/dialog-buttons';
import DialogContainer from '../Dialog/dialog-container';
import DialogHeader from '../Dialog/dialog-header';
import {updateEvent} from '../DialogManager/recievers';
import Paragraph from '../Typography/Paragraph';
import KeepAwake from '@sayem314/react-native-keep-awake';

const {Value, timing} = Animated;

const firstWebViewHeight = new Value(dHeight * 0.5 - 50);
const secondWebViewHeight = new Value(dHeight * 0.5 - 50);
const primaryWebView = createRef();
const secondaryWebView = createRef();
let note = null;

function openEditorAnimation(
  heightToAnimate,
  extendedHeight = null,
  siblingStatus,
  insets,
) {
  let openConfig = {
    duration: 300,
    toValue: !siblingStatus
      ? dHeight - (100 + insets.top)
      : dHeight * 0.5 - (50 + insets.top / 2),
    easing: Easing.inOut(Easing.ease),
  };

  let extendConfig = {
    duration: 300,
    toValue: dHeight * 0.5 - (50 + insets.top / 2),
    easing: Easing.inOut(Easing.ease),
  };

  if (extendedHeight) {
    timing(extendedHeight, extendConfig).start();
  }
  timing(heightToAnimate, openConfig).start();
}

function closeEditorAnimation(heightToAnimate, heightToExtend = null, insets) {
  let closeConfig = {
    duration: 300,
    toValue: 0,
    easing: Easing.inOut(Easing.ease),
  };

  let extendConfig = {
    duration: 300,
    toValue: dHeight - (100 + insets.top),
    easing: Easing.inOut(Easing.ease),
  };
  if (heightToExtend) {
    timing(heightToExtend, extendConfig).start();
  }

  timing(heightToAnimate, closeConfig).start();
}

let primaryData = null;

let secondaryData = null;
const MergeEditor = () => {
  const [state, dispatch] = useTracked();
  const {colors} = state;
  const [visible, setVisible] = useState(false);
  const [primary, setPrimary] = useState(true);
  const [secondary, setSecondary] = useState(true);
  const [keepContentFrom, setKeepContentFrom] = useState(null);
  const [copyToSave, setCopyToSave] = useState(null);
  const [disardedContent, setDiscardedContent] = useState(null);
  const [dialogVisible, setDialogVisible] = useState(false);

  const insets = useSafeAreaInsets();
  const postMessageToPrimaryWebView = (message) =>
    primaryWebView.current?.postMessage(JSON.stringify(message));

  const postMessageToSecondaryWebView = (message) =>
    secondaryWebView.current?.postMessage(JSON.stringify(message));

  const onPrimaryWebViewLoad = () => {
    postMessageToPrimaryWebView({
      type: 'delta',
      value: primaryData.data,
    });
    let c = {...colors};
    c.factor = normalize(1);
    postMessageToPrimaryWebView({
      type: 'theme',
      value: c,
    });
  };

  const onSecondaryWebViewLoad = () => {
    postMessageToSecondaryWebView({
      type: 'delta',
      value: secondaryData.data,
    });
    let c = {...colors};
    c.factor = normalize(1);
    postMessageToSecondaryWebView({
      type: 'theme',
      value: c,
    });
  };

  const _onShouldStartLoadWithRequest = (request) => {
    if (request.url.includes('https')) {
      Linking.openURL(request.url);
      return false;
    } else {
      return true;
    }
  };

  const onMessageFromPrimaryWebView = (evt) => {
    console.log(evt.nativeEvent.data);
    if (evt.nativeEvent.data !== '') {
      let data = JSON.parse(evt.nativeEvent.data);
      console.log(data);
      if (data.type === 'delta') {
        console.log(data.data);
        primaryData = data.data;
      }
    }
  };

  const onMessageFromSecondaryWebView = (evt) => {
    console.log(data.data);
    if (evt.nativeEvent.data === '') {
      let data = JSON.parse(evt.nativeEvent.data);
      if (data.type === 'delta') {
        console.log(data.data);
        secondaryData = data.data;
      }
    }
  };

  const applyChanges = async () => {
    if (keepContentFrom === 'primary') {
      await db.notes.add({
        content: {
          data: primaryData.data,
          resolved: true,
          type: primaryData.type,
        },
        id: note.id,
        conflicted: false,
      });
    } else if (keepContentFrom === 'secondary') {
      await db.notes.add({
        content: {
          data: primaryData.data,
          type: primaryData.type,
          resolved: true,
        },
        id: note.id,
        conflicted: false,
      });
    }

    if (copyToSave === 'primary') {
      await db.notes.add({
        content: {
          data: primaryData.data,
          type: primaryData.type,
        },
        id: null,
      });
    } else if (copyToSave === 'secondary') {
      await db.notes.add({
        content: {
          data: secondaryData.data,
          type: secondaryData.type,
        },
        id: null,
      });
    }
    eSendEvent(refreshNotesPage);
    sendNoteEditedEvent({
      id: note.id,
      forced: true,
    });
    updateEvent({type: Actions.NOTES});
    updateEvent({type: Actions.FAVORITES});
    close();
  };

  const show = async (item) => {
    note = item;
    let noteData = await db.content.raw(note.contentId);

    switch (noteData.type) {
      case 'delta':
        primaryData = noteData;
        secondaryData = noteData.conflicted;
    }
    setVisible(true);
    firstWebViewHeight.setValue(dHeight / 2 - (50 + insets.top / 2));
    secondWebViewHeight.setValue(dHeight / 2 - (50 + insets.top / 2));
    openEditorAnimation(firstWebViewHeight, secondWebViewHeight, true, insets);
  };

  useEffect(() => {
    eSubscribeEvent(eApplyChanges, applyChanges);
    eSubscribeEvent(eShowMergeDialog, show);
    return () => {
      eUnSubscribeEvent(eApplyChanges, applyChanges);
      eUnSubscribeEvent(eShowMergeDialog, show);
    };
  }, []);

  const onPressKeepFromPrimaryWebView = () => {
    if (keepContentFrom == 'primary') {
      setKeepContentFrom(null);
      openEditorAnimation(
        firstWebViewHeight,
        secondWebViewHeight,
        false,
        insets,
      );
    } else {
      setKeepContentFrom('primary');
      closeEditorAnimation(firstWebViewHeight, secondWebViewHeight, insets);
    }
  };

  const onPressSaveCopyFromPrimaryWebView = () => {
    setCopyToSave('primary');
    setDialogVisible(true);
  };

  const onPressKeepFromSecondaryWebView = () => {
    if (keepContentFrom == 'secondary') {
      setKeepContentFrom(null);
      openEditorAnimation(
        secondWebViewHeight,
        firstWebViewHeight,
        false,
        insets,
      );
    } else {
      setKeepContentFrom('secondary');
      closeEditorAnimation(secondWebViewHeight, firstWebViewHeight, insets);
    }
  };

  const onPressSaveCopyFromSecondaryWebView = () => {
    setCopyToSave('secondary');
    setDialogVisible(true);
  };

  const onPressDiscardFromPrimaryWebView = () => {
    setDiscardedContent('primary');
    setDialogVisible(true);
  };

  const onPressDiscardFromSecondaryWebView = () => {
    setDiscardedContent('secondary');
    setDialogVisible(true);
  };

  const close = () => {
    setVisible(false);
    setPrimary(true);
    setSecondary(true);
    setCopyToSave(null);
    setDiscardedContent(null);
    setKeepContentFrom(null);
    setDialogVisible(false);
    primaryData = null;
    secondaryData = null;
    primaryText = null;
    secondaryText = null;
    note = null;
    openEditorAnimation(firstWebViewHeight, secondWebViewHeight, true, insets);
  };

  const params = 'platform=' + Platform.OS;
  const sourceUri =
    (Platform.OS === 'android' ? 'file:///android_asset/' : '') +
    'Web.bundle/loader.html';
  const injectedJS = `if (!window.location.search) {
         var link = document.getElementById('progress-bar');
          link.href = './site/plaineditor.html?${params}';
          link.click();  
    }`;

  return !visible ? null : (
    <Modal
      statusBarTranslucent
      transparent={false}
      animationType="slide"
      visible={true}>
      <SafeAreaView
        style={{
          backgroundColor: colors.nav,
          paddingTop: insets.top,
        }}>
        <KeepAwake />
        {dialogVisible && (
          <BaseDialog visible={true}>
            <DialogContainer>
              <DialogHeader
                title="Apply Changes"
                paragraph="Apply selected changes to note?"
              />
              <DialogButtons
                positiveTitle="Apply"
                negativeTitle="Cancel"
                onPressNegative={() => setDialogVisible(false)}
                onPressPositive={applyChanges}
              />
            </DialogContainer>
          </BaseDialog>
        )}

        <View
          style={{
            height: '100%',
            width: '100%',
            backgroundColor: DDS.isLargeTablet() ? 'rgba(0,0,0,0.3)' : null,
          }}>
          <View
            style={{
              backgroundColor: colors.nav,
              width: '100%',
              height: 50,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingHorizontal: 12,
            }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
              <Icon
                style={{
                  textAlign: 'center',
                  textAlignVertical: 'center',
                  marginLeft: -8,
                  paddingRight: 10,
                  paddingVertical: 10,
                }}
                onPress={close}
                size={SIZE.xxl}
                name="arrow-left"
              />
              <TouchableOpacity
                onPress={() => {
                  if (keepContentFrom === 'primary') return;
                  if (!primary) {
                    openEditorAnimation(
                      firstWebViewHeight,
                      secondary && keepContentFrom !== 'secondary'
                        ? secondWebViewHeight
                        : null,
                      secondary && keepContentFrom !== 'secondary',
                      insets,
                    );
                    setPrimary(true);
                  } else {
                    closeEditorAnimation(
                      firstWebViewHeight,
                      secondary && keepContentFrom !== 'secondary'
                        ? secondWebViewHeight
                        : null,
                      insets,
                    );
                    setPrimary(false);
                  }
                }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}>
                <Paragraph color={colors.icon} size={SIZE.xxs}>
                  Saved on {timeConverter(primaryData.dateEdited)}
                </Paragraph>
                <Icon
                  size={SIZE.lg}
                  name={primary ? 'chevron-up' : 'chevron-down'}
                />
              </TouchableOpacity>
            </View>

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'flex-end',
              }}>
              {keepContentFrom === 'secondary' ? (
                <Button
                  width={null}
                  onPress={onPressSaveCopyFromPrimaryWebView}
                  title="Save Copy"
                />
              ) : null}
              <View style={{width: 10}} />
              {keepContentFrom === 'secondary' ? (
                <Button
                  width={null}
                  title="Discard"
                  color={colors.errorText}
                  onPress={onPressDiscardFromPrimaryWebView}
                />
              ) : null}
              <View style={{width: 10}} />
              {keepContentFrom === 'secondary' ? null : (
                <Button
                  width={null}
                  title={keepContentFrom === 'primary' ? 'Undo' : 'Keep'}
                  onPress={onPressKeepFromPrimaryWebView}
                  color={
                    keepContentFrom === 'primary' ? colors.errorText : 'accent'
                  }
                />
              )}
            </View>
          </View>

          <Animated.View
            style={{
              height: firstWebViewHeight,
            }}>
            <WebView
              onLoad={onPrimaryWebViewLoad}
              ref={primaryWebView}
              style={{
                width: '100%',
                height: '100%',
              }}
              injectedJavaScript={Platform.OS === 'ios' ? injectedJS : null}
              onShouldStartLoadWithRequest={_onShouldStartLoadWithRequest}
              cacheMode="LOAD_DEFAULT"
              domStorageEnabled={true}
              scrollEnabled={false}
              bounces={false}
              allowFileAccess={true}
              scalesPageToFit={true}
              allowingReadAccessToURL={Platform.OS === 'android' ? true : null}
              allowFileAccessFromFileURLs={true}
              allowUniversalAccessFromFileURLs={true}
              originWhitelist={['*']}
              javaScriptEnabled={true}
              cacheEnabled={true}
              onMessage={onMessageFromPrimaryWebView}
              source={
                Platform.OS === 'ios'
                  ? {uri: sourceUri}
                  : {
                      uri: 'file:///android_asset/plaineditor.html',
                      baseUrl: 'file:///android_asset/',
                    }
              }
            />
          </Animated.View>

          <View
            style={{
              backgroundColor: colors.nav,
              width: '100%',
              height: 50,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingHorizontal: 12,
            }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
              <TouchableOpacity
                onPress={() => {
                  if (keepContentFrom === 'secondary') return;
                  if (!secondary) {
                    openEditorAnimation(
                      secondWebViewHeight,
                      primary && keepContentFrom !== 'primary'
                        ? firstWebViewHeight
                        : null,
                      primary && keepContentFrom !== 'primary',
                      insets,
                    );
                    setSecondary(true);
                  } else {
                    closeEditorAnimation(
                      secondWebViewHeight,
                      primary && keepContentFrom !== 'primary'
                        ? firstWebViewHeight
                        : null,
                      insets,
                    );
                    setSecondary(false);
                  }
                }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}>
                <Paragraph color={colors.icon} size={SIZE.xs}>
                  Saved on {timeConverter(secondaryData.dateEdited)}
                </Paragraph>
                <Icon
                  size={SIZE.lg}
                  name={secondary ? 'chevron-up' : 'chevron-down'}
                />
              </TouchableOpacity>
            </View>

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'flex-end',
              }}>
              {keepContentFrom === 'primary' ? (
                <Button
                  width={null}
                  onPress={onPressSaveCopyFromSecondaryWebView}
                  title="Save Copy"
                />
              ) : null}
              <View style={{width: 10}} />
              {keepContentFrom === 'primary' ? (
                <Button
                  width={null}
                  title="Discard"
                  color={colors.errorText}
                  onPress={onPressDiscardFromSecondaryWebView}
                />
              ) : null}
              <View style={{width: 10}} />
              {keepContentFrom === 'primary' ? null : (
                <Button
                  width={null}
                  title={keepContentFrom === 'secondary' ? 'Undo' : 'Keep'}
                  onPress={onPressKeepFromSecondaryWebView}
                  color={
                    keepContentFrom === 'secondary'
                      ? colors.errorText
                      : 'accent'
                  }
                />
              )}
            </View>
          </View>

          <Animated.View
            style={{
              height: secondWebViewHeight,
            }}>
            <WebView
              onLoad={onSecondaryWebViewLoad}
              ref={secondaryWebView}
              style={{
                width: '100%',
                height: '100%',
              }}
              injectedJavaScript={Platform.OS === 'ios' ? injectedJS : null}
              onShouldStartLoadWithRequest={_onShouldStartLoadWithRequest}
              cacheMode="LOAD_DEFAULT"
              domStorageEnabled={true}
              scrollEnabled={false}
              bounces={false}
              allowFileAccess={true}
              scalesPageToFit={true}
              allowingReadAccessToURL={Platform.OS === 'android' ? true : null}
              allowFileAccessFromFileURLs={true}
              allowUniversalAccessFromFileURLs={true}
              originWhitelist={['*']}
              javaScriptEnabled={true}
              cacheEnabled={true}
              onMessage={onMessageFromSecondaryWebView}
              source={
                Platform.OS === 'ios'
                  ? {uri: sourceUri}
                  : {
                      uri: 'file:///android_asset/plaineditor.html',
                      baseUrl: 'file:///android_asset/',
                    }
              }
            />
          </Animated.View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

export default MergeEditor;
