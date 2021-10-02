import KeepAwake from '@sayem314/react-native-keep-awake';
import React, {createRef, useEffect, useState} from 'react';
import {Modal, SafeAreaView, Text, TouchableOpacity, View} from 'react-native';
import Animated, {Easing} from 'react-native-reanimated';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import WebView from 'react-native-webview';
import {useTracked} from '../../provider';
import {DDS} from '../../services/DeviceDetection';
import {
  eSendEvent,
  eSubscribeEvent,
  eUnSubscribeEvent,
} from '../../services/EventManager';
import Navigation from '../../services/Navigation';
import Sync from '../../services/Sync';
import {dHeight} from '../../utils';
import {db} from '../../utils/database';
import diff from '../../utils/differ';
import {
  eApplyChanges,
  eShowMergeDialog,
  refreshNotesPage,
} from '../../utils/Events';
import {openLinkInBrowser} from '../../utils/functions';
import {normalize, SIZE} from '../../utils/SizeUtils';
import {timeConverter} from '../../utils/TimeUtils';
import {
  getNote,
  sourceUri,
  updateNoteInEditor,
} from '../../views/Editor/Functions';
import {Button} from '../Button';
import BaseDialog from '../Dialog/base-dialog';
import DialogButtons from '../Dialog/dialog-buttons';
import DialogContainer from '../Dialog/dialog-container';
import DialogHeader from '../Dialog/dialog-header';
import Paragraph from '../Typography/Paragraph';

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

  const onPrimaryWebViewLoad = () => {
    // console.log('on load called')
    //return;
    // console.log("on load called")
    // let htmlDiff = {
    //   before: primaryData.data,
    // };
    // console.log(secondaryData.data?.length,primaryData.data?.length);
    // console.log('before entering')
    // if (secondaryData.data) {
    //   console.log("getting diff");
    //   htmlDiff = diff.diff_dual_pane(primaryData.data, secondaryData.data);
    //   console.log("diff generated");
    // }
    // console.log('posting message')
    postMessage(primaryWebView, 'htmldiff', primaryData?.data);
    let theme = {...colors};
    theme.factor = normalize(1);
    postMessage(primaryWebView, 'theme', JSON.stringify(theme));
  };

  const onSecondaryWebViewLoad = () => {
    // console.log('onload2')
    //return;
    //  let htmlDiff = {
    //    before: primaryData.data,
    //  };
    //  if (secondaryData.data) {
    //  htmlDiff = diff.diff_dual_pane(primaryData.data, secondaryData.data);
    //  }
    postMessage(secondaryWebView, 'htmldiff', secondaryData?.data);
    let theme = {...colors};
    theme.factor = normalize(1);
    postMessage(secondaryWebView, 'theme', JSON.stringify(theme));
  };

  function postMessage(webview, type, value = null) {
    let message = {
      type: type,
      value,
    };
    webview.current?.postMessage(JSON.stringify(message));
  }

  const _onShouldStartLoadWithRequest = request => {
    if (request.url.includes('http')) {
      openLinkInBrowser(request.url, colors)
        .catch(e =>
          ToastEvent.show({
            title: 'Failed to open link',
            message: e.message,
            type: 'success',
            context: 'local',
          }),
        )
        .then(r => {
          console.log('closed');
        });

      return false;
    } else {
      return true;
    }
  };

  const onMessageFromPrimaryWebView = evt => {
    if (evt.nativeEvent.data !== '') {
      let data = JSON.parse(evt.nativeEvent.data);

      if (data.type === 'tiny') {
        primaryData = {
          type: 'tiny',
          data: data.value,
        };
      }
    }
  };

  const onMessageFromSecondaryWebView = evt => {
    if (evt.nativeEvent.data === '') {
      let data = JSON.parse(evt.nativeEvent.data);
      if (data.type === 'tiny') {
        secondaryData = {
          type: 'tiny',
          data: data.value,
        };
      }
    }
  };

  const applyChanges = async () => {
    if (keepContentFrom === 'primary') {
      await db.notes.add({
        content: {
          data: primaryData.data
            ? diff.clean(primaryData.data)
            : primaryData.data,
          type: primaryData.type,
          dateEdited:primary.dateEdited,
          remote:true,
          dateResolved:secondaryData.dateEdited
        },
        id: note.id,
        conflicted: false,
      });
    } else if (keepContentFrom === 'secondary') {
      await db.notes.add({
        content: {
          data: secondaryData.data
            ? diff.clean(secondaryData.data)
            : secondaryData.data,
          type: secondaryData.type,
          remote:true,
          dateEdited:secondaryData.dateEdited,
          dateResolved:secondaryData.dateEdited
        },
        id: note.id,
        conflicted: false,
      });
    }

    if (copyToSave === 'primary') {
      await db.notes.add({
        content: {
          data: primaryData.data
            ? diff.clean(primaryData.data)
            : primaryData.data,
          type: primaryData.type,

        },
        id: null,
      });
    } else if (copyToSave === 'secondary') {
      await db.notes.add({
        content: {
          data: secondaryData.data
            ? diff.clean(secondaryData.data)
            : secondaryData.data,
          type: secondaryData.type,
        },
        id: null,
      });
    }
    eSendEvent(refreshNotesPage);
    Navigation.setRoutesToUpdate([
      Navigation.routeNames.NotesPage,
      Navigation.routeNames.Favorites,
      Navigation.routeNames.Notes,
    ]);
    if (getNote()?.id === note.id) {
      updateNoteInEditor();
    }
    close();
    await Sync.run();
  };

  const show = async item => {
    note = item;
    console.log('getting raw data');
    let noteData = await db.content.raw(note.contentId);
    console.log('got raw data');
    switch (noteData.type) {
      case 'tiny':
        primaryData = noteData;
        secondaryData = noteData.conflicted;
    }
    setVisible(true);
    console.log('display');
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

  return !visible ? null : (
    <Modal
      statusBarTranslucent
      transparent={false}
      animationType="slide"
      onRequestClose={() => {
        close();
      }}
      visible={true}>
      <SafeAreaView
        style={{
          backgroundColor: colors.bg,
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
                maxWidth: '50%',
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
                color={colors.pri}
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
                <Paragraph
                  style={{maxWidth: '80%'}}
                  color={colors.icon}
                  size={SIZE.xs}>
                  <Text style={{color: colors.accent, fontWeight: 'bold'}}>
                    (This Device)
                  </Text>{' '}
                  Saved on {timeConverter(primaryData?.dateEdited)}
                </Paragraph>
                <Icon
                  size={SIZE.lg}
                  name={primary ? 'chevron-up' : 'chevron-down'}
                  color={colors.pri}
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
                  title="Save copy"
                />
              ) : null}
              <View style={{width: 10}} />
              {keepContentFrom === 'secondary' ? (
                <Button
                  width={null}
                  height={40}
                  title="Discard"
                  type="accent"
                  accentColor="red"
                  accentText="light"
                  color={colors.errorText}
                  onPress={onPressDiscardFromPrimaryWebView}
                />
              ) : null}
              {keepContentFrom === 'secondary' ? null : (
                <>
                  <View style={{width: 10}} />
                  <Button
                    width={null}
                    height={40}
                    title={keepContentFrom === 'primary' ? 'Undo' : 'Keep'}
                    onPress={onPressKeepFromPrimaryWebView}
                    color={
                      keepContentFrom === 'primary'
                        ? colors.errorText
                        : 'accent'
                    }
                  />
                </>
              )}
            </View>
          </View>

          <Animated.View
            style={{
              height: firstWebViewHeight,
              backgroundColor: colors.bg,
            }}>
            <WebView
              onLoad={onPrimaryWebViewLoad}
              ref={primaryWebView}
              style={{
                width: '100%',
                height: '100%',
                backgroundColor: 'transparent',
              }}
              onShouldStartLoadWithRequest={_onShouldStartLoadWithRequest}
              cacheMode="LOAD_DEFAULT"
              domStorageEnabled={true}
              scrollEnabled={true}
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
              source={{
                uri: sourceUri + 'plaineditor.html',
              }}
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
                maxWidth: '50%',
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
                <Paragraph
                  style={{maxWidth: '80%'}}
                  color={colors.icon}
                  size={SIZE.xs}>
                  <Text style={{color: 'red', fontWeight: 'bold'}}>
                    (Incoming)
                  </Text>{' '}
                  Saved on {timeConverter(secondaryData?.dateEdited)}
                </Paragraph>
                <Icon
                  size={SIZE.lg}
                  name={secondary ? 'chevron-up' : 'chevron-down'}
                  color={colors.pri}
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
                  height={40}
                  onPress={onPressSaveCopyFromSecondaryWebView}
                  title="Save copy"
                />
              ) : null}
              <View style={{width: 10}} />
              {keepContentFrom === 'primary' ? (
                <Button
                  width={null}
                  height={40}
                  title="Discard"
                  type="accent"
                  accentColor="red"
                  accentText="light"
                  onPress={onPressDiscardFromSecondaryWebView}
                />
              ) : null}

              {keepContentFrom === 'primary' ? null : (
                <>
                  <View style={{width: 10}} />
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
                </>
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
                backgroundColor: 'transparent',
              }}
              onShouldStartLoadWithRequest={_onShouldStartLoadWithRequest}
              cacheMode="LOAD_DEFAULT"
              domStorageEnabled={true}
              scrollEnabled={true}
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
              source={{
                uri: sourceUri + 'plaineditor.html',
              }}
            />
          </Animated.View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

export default MergeEditor;
