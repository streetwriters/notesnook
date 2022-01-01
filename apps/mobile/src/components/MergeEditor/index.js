import KeepAwake from '@sayem314/react-native-keep-awake';
import {EV, EVENTS} from 'notes-core/common';
import React, {createRef, useEffect, useState} from 'react';
import {Modal, SafeAreaView, Text, View} from 'react-native';
import Animated from 'react-native-reanimated';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import WebView from 'react-native-webview';
import {useTracked} from '../../provider';
import {DDS} from '../../services/DeviceDetection';
import {
  eSendEvent,
  eSubscribeEvent,
  eUnSubscribeEvent
} from '../../services/EventManager';
import Navigation from '../../services/Navigation';
import Sync from '../../services/Sync';
import {dHeight} from '../../utils';
import {db} from '../../utils/database';
import {
  eApplyChanges,
  eShowMergeDialog,
  refreshNotesPage
} from '../../utils/Events';
import {openLinkInBrowser} from '../../utils/functions';
import {normalize, SIZE} from '../../utils/SizeUtils';
import {timeConverter} from '../../utils/TimeUtils';
import {
  getNote,
  sourceUri,
  updateNoteInEditor
} from '../../views/Editor/Functions';
import {ActionIcon} from '../ActionIcon';
import {Button} from '../Button';
import BaseDialog from '../Dialog/base-dialog';
import DialogButtons from '../Dialog/dialog-buttons';
import DialogContainer from '../Dialog/dialog-container';
import DialogHeader from '../Dialog/dialog-header';
import Seperator from '../Seperator';
import Paragraph from '../Typography/Paragraph';

const primaryWebView = createRef();
const secondaryWebView = createRef();
let note = null;
let primaryData = null;
let secondaryData = null;

function onMediaLoaded({hash, src}) {
  console.log('on media download complete');
  let inject = `
  (function(){
    const elements = document.querySelectorAll("img[data-hash=${hash}]");
    if (!elements || !elements.length) return;
    for (let element of elements) element.setAttribute("src", "${src}");
  })();`;
  primaryWebView.current?.injectJavaScript(inject);
  secondaryWebView.current?.injectJavaScript(inject);
}

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
  const [loadingAttachments, setLoadingAttachments] = useState(false);
  const insets = useSafeAreaInsets();

  const onPrimaryWebViewLoad = async () => {
    let content = await db.content.insertPlaceholders(
      primaryData,
      'placeholder.svg'
    );
    postMessage(primaryWebView, 'htmldiff', content.data);
    let theme = {...colors};
    theme.factor = normalize(1);
    postMessage(primaryWebView, 'theme', JSON.stringify(theme));
  };

  const onSecondaryWebViewLoad = async () => {
    let content = await db.content.insertPlaceholders(
      secondaryData,
      'placeholder.svg'
    );
    postMessage(secondaryWebView, 'htmldiff', content?.data);
    let theme = {...colors};
    theme.factor = normalize(1);
    postMessage(secondaryWebView, 'theme', JSON.stringify(theme));
  };

  function postMessage(webview, type, value = null) {
    let message = {
      type: type,
      value
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
            context: 'local'
          })
        )
        .then(r => {
          console.log('closed');
        });

      return false;
    } else {
      return true;
    }
  };

  const applyChanges = async () => {
    let content = keepContentFrom === 'primary' ? primaryData : secondaryData;
    let keepCopy =
      copyToSave === 'primary'
        ? primaryData
        : copyToSave === 'secondary'
        ? secondaryData
        : null;

    await db.notes.add({
      id: note.id,
      conflicted: false,
      dateEdited: content.dateEdited
    });

    await db.content.add({
      id: note.contentId,
      data: content.data,
      type: content.type,
      dateResolved: secondaryData.dateModified,
      sessionId: Date.now(),
      conflicted: false
    });

    if (keepCopy) {
      await db.notes.add({
        content: {
          data: keepCopy.data,
          type: keepCopy.type
        },
        id: null
      });
    }
    eSendEvent(refreshNotesPage);
    Navigation.setRoutesToUpdate([
      Navigation.routeNames.NotesPage,
      Navigation.routeNames.Favorites,
      Navigation.routeNames.Notes
    ]);
    if (getNote()?.id === note.id) {
      updateNoteInEditor();
    }
    close();
    await Sync.run();
  };

  const show = async item => {
    note = item;
    let content = await db.content.raw(note.contentId);
    switch (content.type) {
      case 'tiny':
        primaryData = content;
        secondaryData = content.conflicted;
    }
    setVisible(true);
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
    } else {
      setKeepContentFrom('primary');
    }
  };

  const onPressSaveCopyFromPrimaryWebView = () => {
    setCopyToSave('primary');
    setDialogVisible(true);
  };

  const onPressKeepFromSecondaryWebView = () => {
    if (keepContentFrom == 'secondary') {
      setKeepContentFrom(null);
    } else {
      setKeepContentFrom('secondary');
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
    db.fs.cancel(primaryData?.noteId);

    EV.unsubscribe(EVENTS.mediaAttachmentDownloaded, onMediaLoaded);
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
  };

  const onLoadImages = async () => {
    try {
      setLoadingAttachments(true);
      EV.subscribe(EVENTS.mediaAttachmentDownloaded, onMediaLoaded);
      await db.content.downloadMedia(primaryData.data.noteId, primaryData);
      await db.content.downloadMedia(primaryData.data.noteId, secondaryData);
      EV.unsubscribe(EVENTS.mediaAttachmentDownloaded, onMediaLoaded);
      setLoadingAttachments(false);
    } catch (e) {
      setLoadingAttachments(false);
      eUnSubscribeEvent(EVENTS.mediaAttachmentDownloaded, onMediaLoaded);
    }
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
          paddingTop: insets.top
        }}>
        <KeepAwake />
        {dialogVisible && (
          <BaseDialog visible={true}>
            <DialogContainer>
              <DialogHeader
                title="Apply Changes"
                paragraph="Apply selected changes to note?"
                padding={12}
              />
              <Seperator />
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
            backgroundColor: DDS.isLargeTablet() ? 'rgba(0,0,0,0.3)' : null
          }}>
          <View
            style={{
              width: '100%',
              height: 50,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingHorizontal: 12,
              paddingLeft: 6
            }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexShrink: 1
              }}>
              <ActionIcon
                onPress={close}
                color={colors.pri}
                name="arrow-left"
              />
              <Paragraph
                style={{flexWrap: 'wrap'}}
                color={colors.icon}
                size={SIZE.xs}>
                <Text style={{color: colors.accent, fontWeight: 'bold'}}>
                  (This Device)
                </Text>
                {'\n'}
                {timeConverter(primaryData?.dateEdited)}
              </Paragraph>
            </View>

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'flex-end'
              }}>
              {keepContentFrom === 'secondary' ? (
                <Button
                  onPress={onPressSaveCopyFromPrimaryWebView}
                  title="Save a copy"
                  type="grayBg"
                  height={30}
                  style={{
                    borderRadius: 100,
                    paddingHorizontal: 12
                  }}
                  fontSize={SIZE.xs}
                />
              ) : null}
              <View style={{width: 10}} />
              {keepContentFrom === 'secondary' ? (
                <Button
                  title="Discard"
                  type="accent"
                  accentColor="red"
                  height={30}
                  style={{
                    borderRadius: 100,
                    paddingHorizontal: 12
                  }}
                  fontSize={SIZE.xs}
                  accentText="light"
                  color={colors.errorText}
                  onPress={onPressDiscardFromPrimaryWebView}
                />
              ) : null}
              {keepContentFrom === 'secondary' ? null : (
                <>
                  <Button
                    type="grayBg"
                    title="Load images"
                    onPress={onLoadImages}
                    height={30}
                    loading={loadingAttachments}
                    fontSize={SIZE.xs}
                    icon="download"
                    style={{
                      borderRadius: 100,
                      paddingHorizontal: 12,
                      minWidth: 60
                    }}
                  />
                  <Button
                    height={30}
                    style={{
                      borderRadius: 100,
                      paddingHorizontal: 12,
                      minWidth: 60,
                      marginLeft: 10
                    }}
                    type="accent"
                    fontSize={SIZE.xs}
                    title={keepContentFrom === 'primary' ? 'Undo' : 'Keep'}
                    onPress={onPressKeepFromPrimaryWebView}
                  />
                </>
              )}
            </View>
          </View>

          <Animated.View
            style={{
              height: dHeight / 2 - (50 + insets.top / 2),
              backgroundColor: colors.bg,
              borderBottomWidth: 1,
              borderBottomColor: colors.nav
            }}>
            <WebView
              onLoad={onPrimaryWebViewLoad}
              ref={primaryWebView}
              style={{
                width: '100%',
                height: '100%',
                backgroundColor: 'transparent'
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
              source={{
                uri: sourceUri + 'plaineditor.html'
              }}
            />
          </Animated.View>

          <View
            style={{
              width: '100%',
              height: 50,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingHorizontal: 12
            }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexShrink: 1
              }}>
              <Paragraph
                style={{flexWrap: 'wrap'}}
                color={colors.icon}
                size={SIZE.xs}>
                <Text style={{color: 'red', fontWeight: 'bold'}}>
                  (Incoming)
                </Text>
                {'\n'}
                {timeConverter(secondaryData?.dateEdited)}
              </Paragraph>
            </View>

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'flex-end'
              }}>
              {keepContentFrom === 'primary' ? (
                <Button
                  height={30}
                  style={{
                    borderRadius: 100,
                    paddingHorizontal: 12,
                    minWidth: 60
                  }}
                  type="accent"
                  fontSize={SIZE.xs}
                  onPress={onPressSaveCopyFromSecondaryWebView}
                  title="Save a copy"
                />
              ) : null}
              <View style={{width: 10}} />
              {keepContentFrom === 'primary' ? (
                <Button
                  title="Discard"
                  type="accent"
                  height={30}
                  style={{
                    borderRadius: 100,
                    paddingHorizontal: 12,
                    minWidth: 60
                  }}
                  fontSize={SIZE.xs}
                  accentColor="red"
                  accentText="light"
                  onPress={onPressDiscardFromSecondaryWebView}
                />
              ) : null}

              {keepContentFrom === 'primary' ? null : (
                <>
                  <Button
                    type="grayBg"
                    title="Load images"
                    height={30}
                    loading={loadingAttachments}
                    fontSize={SIZE.xs}
                    icon="download"
                    style={{
                      borderRadius: 100,
                      paddingHorizontal: 12,
                      minWidth: 60
                    }}
                  />
                  <Button
                    height={30}
                    style={{
                      borderRadius: 100,
                      paddingHorizontal: 12,
                      minWidth: 60,
                      marginLeft: 10
                    }}
                    type="accent"
                    fontSize={SIZE.xs}
                    title={keepContentFrom === 'secondary' ? 'Undo' : 'Keep'}
                    onPress={onPressKeepFromSecondaryWebView}
                  />
                </>
              )}
            </View>
          </View>

          <Animated.View
            style={{
              height: dHeight / 2 - (50 + insets.top / 2),
              backgroundColor: colors.bg,
              borderRadius: 10
            }}>
            <WebView
              onLoad={onSecondaryWebViewLoad}
              ref={secondaryWebView}
              style={{
                width: '100%',
                height: '100%',
                backgroundColor: 'transparent'
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
              source={{
                uri: sourceUri + 'plaineditor.html'
              }}
            />
          </Animated.View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

export default MergeEditor;
