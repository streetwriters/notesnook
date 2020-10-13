import React, {createRef, useEffect, useState} from 'react';
import {Modal, Text, TouchableOpacity, View, SafeAreaView} from 'react-native';
import Animated, {Easing} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import WebView from 'react-native-webview';
import {useTracked} from '../../provider';
import {Actions} from '../../provider/Actions';
import {
  eSendEvent,
  eSubscribeEvent,
  eUnSubscribeEvent,
} from '../../services/EventManager';
import {
  eApplyChanges,
  eShowMergeDialog,
  refreshNotesPage,
} from '../../utils/Events';
import {dHeight} from '../../utils';
import {Button} from '../Button';
import {simpleDialogEvent, updateEvent} from '../DialogManager/recievers';
import {TEMPLATE_APPLY_CHANGES} from '../DialogManager/Templates';
import {normalize, SIZE} from "../../utils/SizeUtils";
import {db} from "../../utils/DB";

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
) {
  let openConfig = {
    duration: 300,
    toValue: !siblingStatus ? dHeight - 100 : dHeight * 0.5 - 50,
    easing: Easing.inOut(Easing.ease),
  };

  let extendConfig = {
    duration: 300,
    toValue: dHeight * 0.5 - 50,
    easing: Easing.inOut(Easing.ease),
  };

  if (extendedHeight) {
    timing(extendedHeight, extendConfig).start();
  }
  timing(heightToAnimate, openConfig).start();
}

function closeEditorAnimation(heightToAnimate, heightToExtend = null) {
  let closeConfig = {
    duration: 300,
    toValue: 0,
    easing: Easing.inOut(Easing.ease),
  };

  let extendConfig = {
    duration: 300,
    toValue: dHeight - 100,
    easing: Easing.inOut(Easing.ease),
  };
  if (heightToExtend) {
    timing(heightToExtend, extendConfig).start();
  }

  timing(heightToAnimate, closeConfig).start();
}

let primaryDelta = null;
let primaryText = '';

let secondaryDelta = null;
let secondaryText = '';

const MergeEditor = () => {
  const [state, dispatch] = useTracked();
  const {colors} = state;
  const [visible, setVisible] = useState(false);
  const [primary, setPrimary] = useState(true);
  const [secondary, setSecondary] = useState(true);
  const [keepContentFrom, setKeepContentFrom] = useState(null);
  const [copyToSave, setCopyToSave] = useState(null);
  const [disardedContent, setDiscardedContent] = useState(null);

  const postMessageToPrimaryWebView = (message) =>
    primaryWebView.current?.postMessage(JSON.stringify(message));

  const postMessageToSecondaryWebView = (message) =>
    secondaryWebView.current?.postMessage(JSON.stringify(message));

  const onPrimaryWebViewLoad = () => {
    postMessageToPrimaryWebView({
      type: 'delta',
      value: primaryDelta,
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
      value: secondaryDelta,
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
    if (evt.nativeEvent.data !== '') {
      let data = JSON.parse(evt.nativeEvent.data);
      primaryDelta = data.delta;
      primaryText = data.text;
    }
  };

  const onMessageFromSecondaryWebView = (evt) => {
    if (evt.nativeEvent.data !== '') {
      let data = JSON.parse(evt.nativeEvent.data);
      secondaryDelta = data.delta;
      secondaryText = data.text;
    }
  };

  const applyChanges = async () => {
    if (keepContentFrom === 'primary') {
      await db.notes.add({
        content: {
          text: primaryText,
          delta: {
            data: primaryDelta,
            resolved: true,
          },
        },
        id: note.id,
        conflicted: false,
      });
    } else if (keepContentFrom === 'secondary') {
      await db.notes.add({
        content: {
          text: secondaryText,
          delta: {
            data: primaryDelta,
            resolved: true,
          },
        },
        id: note.id,
        conflicted: false,
      });
    }

    if (copyToSave === 'primary') {
      await db.notes.add({
        content: {
          text: primaryText,
          delta: primaryDelta,
        },
        id: null,
      });
    } else if (copyToSave === 'secondary') {
      await db.notes.add({
        content: {
          text: secondaryText,
          delta: secondaryDelta,
        },
        id: null,
      });
    }
    eSendEvent(refreshNotesPage);
    updateEvent({type: Actions.NOTES});
    updateEvent({type: Actions.FAVORITES});
    close();
  };

  const show = async (item) => {
    note = item;

    let rawDelta = await db.delta.raw(note.content.delta);
    primaryDelta = rawDelta.data;
    secondaryDelta = rawDelta.conflicted.data;

    setVisible(true);
    openEditorAnimation(firstWebViewHeight, secondWebViewHeight, true);
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
      openEditorAnimation(firstWebViewHeight, secondWebViewHeight);
    } else {
      setKeepContentFrom('primary');
      closeEditorAnimation(firstWebViewHeight, secondWebViewHeight);
    }
  };

  const onPressSaveCopyFromPrimaryWebView = () => {
    setCopyToSave('primary');
    simpleDialogEvent(TEMPLATE_APPLY_CHANGES);
  };

  const onPressKeepFromSecondaryWebView = () => {
    if (keepContentFrom == 'secondary') {
      setKeepContentFrom(null);
      openEditorAnimation(secondWebViewHeight, firstWebViewHeight);
    } else {
      setKeepContentFrom('secondary');
      closeEditorAnimation(secondWebViewHeight, firstWebViewHeight);
    }
  };

  const onPressSaveCopyFromSecondaryWebView = () => {
    setCopyToSave('secondary');
    simpleDialogEvent(TEMPLATE_APPLY_CHANGES);
  };

  const onPressDiscardFromPrimaryWebView = () => {
    setDiscardedContent('primary');
    simpleDialogEvent(TEMPLATE_APPLY_CHANGES);
  };

  const onPressDiscardFromSecondaryWebView = () => {
    setDiscardedContent('secondary');
    simpleDialogEvent(TEMPLATE_APPLY_CHANGES);
  };

  const close = () => {
    setVisible(false);
    setPrimary(true);
    setSecondary(true);
    setCopyToSave(null);
    setDiscardedContent(null);
    setKeepContentFrom(null);
    primaryDelta = null;
    secondaryDelta = null;
    primaryText = null;
    secondaryText = null;
    note = null;
    openEditorAnimation(firstWebViewHeight, secondWebViewHeight, true);
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




  return (
    <Modal transparent={false} animated animationType="fade" visible={visible}>
      <SafeAreaView
        style={{
          backgroundColor: colors.nav,
        }}>
        <View
          style={{
            height: '100%',
            width: '100%',
            backgroundColor: 'rgba(0,0,0,0.3)',
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
                name="chevron-left"
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
                    );
                    setPrimary(true);
                  } else {
                    closeEditorAnimation(
                      firstWebViewHeight,
                      secondary && keepContentFrom !== 'secondary'
                        ? secondWebViewHeight
                        : null,
                    );
                    setPrimary(false);
                  }
                }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}>
                <Text
                  style={{
                    color: colors.icon,
                    fontSize: SIZE.xxs,
                  }}>
                  Saved on 10/10/20 {'\n'}
                  12:30pm on Tablet
                </Text>
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
                    );
                    setSecondary(true);
                  } else {
                    closeEditorAnimation(
                      secondWebViewHeight,
                      primary && keepContentFrom !== 'primary'
                        ? firstWebViewHeight
                        : null,
                    );
                    setSecondary(false);
                  }
                }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}>
                <Text
                  style={{
                    color: colors.icon,
                    fontSize: SIZE.xxs,
                  }}>
                  Saved on 10/10/20 {'\n'}
                  12:30pm on Tablet
                </Text>
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
