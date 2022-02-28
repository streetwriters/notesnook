import Clipboard from '@react-native-clipboard/clipboard';
import { getLinkPreview } from 'link-preview-js';
import { HTMLRootElement } from 'node-html-parser/dist/nodes/html';
import React, { Fragment, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  NativeModules,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  UIManager,
  useWindowDimensions,
  View
} from 'react-native';
import Animated, { acc, Easing, timing, useValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import WebView from 'react-native-webview';
import ShareExtension from 'rn-extensions-share';
import isURL from 'validator/lib/isURL';
import { eSendEvent, eSubscribeEvent, eUnSubscribeEvent } from '../src/services/EventManager';
import { getElevation } from '../src/utils';
import { db } from '../src/utils/database';
import Storage from '../src/utils/database/storage';
import { sleep } from '../src/utils/time';
import { Search } from './search';
import { useShareStore } from './store';

const AnimatedKAV = Animated.createAnimatedComponent(KeyboardAvoidingView);
const AnimatedSAV = Animated.createAnimatedComponent(SafeAreaView);
async function sanitizeHtml(site) {
  try {
    let html = await fetch(site);
    html = await html.text();
    return sanitize(html, site);
  } catch (e) {
    return '';
  }
}

function makeHtmlFromUrl(url) {
  return `<a style="overflow-wrap:anywhere;white-space:pre-wrap" href='${url}' target='_blank'>${url}</a>`;
}

function makeHtmlFromPlainText(text) {
  if (!text) return '';

  return `<p style="overflow-wrap:anywhere;white-space:pre-wrap" >${text.replace(
    /(?:\r\n|\r|\n)/g,
    '<br>'
  )}</p>`;
}

function getBaseUrl(site) {
  var url = site.split('/').slice(0, 3).join('/');
  return url;
}

/**
 *
 * @param {HTMLRootElement} document
 */
function wrapTablesWithDiv(document) {
  const tables = document.getElementsByTagName('table');
  for (let table of tables) {
    table.setAttribute('contenteditable', 'true');
    const div = document.createElement('div');
    div.setAttribute('contenteditable', 'false');
    div.innerHTML = table.outerHTML;
    div.classList.add('table-container');
    table.replaceWith(div);
  }
  return document;
}

let elementBlacklist = [
  'script',
  'button',
  'input',
  'textarea',
  'style',
  'form',
  'link',
  'head',
  'nav',
  'iframe',
  'canvas',
  'select',
  'dialog',
  'footer'
];

/**
 *
 * @param {HTMLRootElement} document
 */
function removeInvalidElements(document) {
  let elements = document.querySelectorAll(elementBlacklist.join(','));
  for (let element of elements) {
    element.remove();
  }
  return document;
}

/**
 *
 * @param {HTMLRootElement} document
 */
function replaceSrcWithAbsoluteUrls(document, baseUrl) {
  console.log('parsing:', document);

  let images = document.querySelectorAll('img');
  console.log(images.length);
  for (var i = 0; i < images.length; i++) {
    let img = images[i];
    let url = getBaseUrl(baseUrl);
    let src = img.getAttribute('src');
    if (src.startsWith('/')) {
      if (src.startsWith('//')) {
        src = src.replace('//', 'https://');
      } else {
        src = url + src;
      }
    }
    if (src.startsWith('data:')) {
      img.remove();
    } else {
      img.setAttribute('src', src);
    }
  }
  console.log('end');
  return document;
}

/**
 *
 * @param {HTMLRootElement} document
 */
function fixCodeBlocks(document) {
  let elements = document.querySelectorAll('code,pre');
  console.log(elements.length);
  for (let element of elements) {
    element.classList.add('.hljs');
  }
  return document;
}

function sanitize(html, baseUrl) {
  let { parse } = require('node-html-parser');
  let parser = parse(html);
  parser = wrapTablesWithDiv(parser);
  parser = removeInvalidElements(parser);
  parser = replaceSrcWithAbsoluteUrls(parser, baseUrl);
  parser = fixCodeBlocks(parser);

  let htmlString = parser.outerHTML;

  htmlString = htmlString + `<hr>${makeHtmlFromUrl(baseUrl)}`;

  return htmlString;
}

let defaultNote = {
  title: null,
  id: null,
  content: {
    type: 'tiny',
    data: null
  }
};

const modes = {
  1: {
    type: 'text',
    title: 'Plain text',
    icon: 'card-text-outline'
  },
  2: {
    type: 'clip',
    title: 'Web clip',
    icon: 'web'
  },
  3: {
    type: 'link',
    title: 'Link',
    icon: 'link'
  }
};

const NotesnookShare = ({ quicknote = false }) => {
  const colors = useShareStore(state => state.colors);
  const accent = useShareStore(state => state.accent);

  const appendNote = useShareStore(state => state.appendNote);
  const [note, setNote] = useState({ ...defaultNote });
  const [loadingIntent, setLoadingIntent] = useState(true);
  const [loading, setLoading] = useState(false);
  const [floating, setFloating] = useState(false);
  const [rawData, setRawData] = useState({
    type: null,
    value: null
  });
  const [mode, setMode] = useState(1);
  const keyboardHeight = useRef(0);
  const { width, height } = useWindowDimensions();
  const webviewRef = useRef();
  const opacity = useValue(0);
  const translate = useValue(1000);
  const insets = Platform.OS === 'android' ? { top: StatusBar.currentHeight } : useSafeAreaInsets();
  const prevAnimation = useRef(null);
  const [showSearch, setShowSearch] = useState(false);
  const [kh, setKh] = useState(0);

  const animate = (opacityV, translateV) => {
    prevAnimation.current = translateV;
    if (Platform.OS === 'ios') return;
    timing(opacity, {
      toValue: opacityV,
      duration: 300,
      easing: Easing.in(Easing.ease)
    }).start();
    timing(translate, {
      toValue: translateV,
      duration: 300,
      easing: Easing.in(Easing.ease)
    }).start();
  };

  const onKeyboardDidShow = event => {
    let kHeight = event.endCoordinates.height;
    keyboardHeight.current = kHeight;
    setKh(kHeight);
    console.log('keyboard show/hide');
  };

  const onKeyboardDidHide = () => {
    keyboardHeight.current = 0;
    setKh(0);
    console.log('keyboard hide');
  };

  useEffect(() => {
    useShareStore.getState().setAccent();
    let keyboardWillChangeFrame = Keyboard.addListener(
      'keyboardWillChangeFrame',
      onKeyboardWillChangeFrame
    );
    let keyboardDidShow = Keyboard.addListener('keyboardDidShow', onKeyboardDidShow);
    let keyboardDidHide = Keyboard.addListener('keyboardDidHide', onKeyboardDidHide);
    return () => {
      keyboardWillChangeFrame?.remove();
      keyboardDidShow?.remove();
      keyboardDidHide?.remove();
    };
  }, []);

  const onKeyboardWillChangeFrame = event => {
    setFloating(event.endCoordinates.width !== width);
  };

  const showLinkPreview = async (note, link) => {
    let _note = note;
    _note.content.data = makeHtmlFromUrl(link);
    try {
      let preview = await getLinkPreview(link);
      _note.title = preview.title;
    } catch (e) {
      console.log(e);
    }
    return note;
  };

  const loadData = async () => {
    try {
      defaultNote.content.data = null;
      setNote({ ...defaultNote });
      const data = await ShareExtension.data();
      if (!data || data.length === 0) {
        setRawData({
          value: ''
        });
        setLoadingIntent(false);
        return;
      }
      let note = { ...defaultNote };
      for (let item of data) {
        if (item.type === 'text') {
          setRawData(item);
          if (isURL(item.value)) {
            note = await showLinkPreview(note, item.value);
          } else {
            note.content.data = makeHtmlFromPlainText(item.value);
          }
        }
      }
      setNote({ ...note });
    } catch (e) {}
    setLoadingIntent(false);
  };

  useEffect(() => {
    console.log('setting value in storage');
    loadData();
    useShareStore.getState().restoreAppendNote();
    sleep(50).then(() => {
      animate(1, 0);
      sleep(500).then(r => {
        Storage.write('shareExtensionOpened', 'opened');
      });
    });
  }, []);

  const close = async () => {
    animate(0, 1000);
    await sleep(300);
    setNote({ ...defaultNote });
    setLoadingIntent(true);
    if (quicknote) {
      ShareExtension.openURL('ShareMedia://MainApp');
    } else {
      ShareExtension.close();
    }
  };

  const onLoad = () => {
    postMessage(webviewRef, 'htmldiff', note.content?.data || '');
    console.log('on load');
    setTimeout(() => {
      let theme = { ...colors };
      theme.factor = 1;

      webviewRef.current?.injectJavaScript(`
        document.querySelector('.htmldiff_div').setAttribute('contenteditable', 'true');`);

      webviewRef.current?.injectJavaScript(`(function() {
        try { 
          pageTheme.colors = ${JSON.stringify(theme)};
          setTheme();
        } catch(e) {
          console.log(e);
        }
      })();
      
      `);
    }, 300);
  };

  function postMessage(webview, type, value = null) {
    let message = {
      type: type,
      value
    };
    webview.current?.postMessage(JSON.stringify(message));
  }

  const onPress = async () => {
    let content = await getContent();
    if (!content || content === '' || typeof content !== 'string') {
      return;
    }
    setLoading(true);
    await db.init();
    await db.notes.init();

    if (appendNote && !db.notes.note(appendNote.id)) {
      useShareStore.getState().setAppendNote(null);
      Alert.alert('The note you are trying to append to has been deleted.');
      return;
    }

    let _note;
    if (appendNote && db.notes.note(appendNote.id)) {
      let raw = await db.content.raw(appendNote.contentId);
      _note = {
        content: {
          data: raw.data + '\n' + content,
          type: 'tiny'
        },
        id: appendNote.id,
        sessionId: Date.now()
      };
    } else {
      _note = { ...note };
      _note.content.data = content;
      _note.sessionId = Date.now();
    }
    await db.notes.add(_note);
    await Storage.write('notesAddedFromIntent', 'added');
    close();
    setLoading(false);
  };

  const sourceUri = 'Web.bundle/site/plaineditor.html';

  const onShouldStartLoadWithRequest = request => {
    if (request.url.includes('/site/plaineditor.html')) {
      return true;
    } else {
      return false;
    }
  };

  const getContent = () => {
    return new Promise(resolve => {
      let oncontent = value => {
        eUnSubscribeEvent('share_content_event', oncontent);
        resolve(value);
      };
      eSubscribeEvent('share_content_event', oncontent);
      webviewRef.current?.injectJavaScript(`(function() {
        let html = document.querySelector(".htmldiff_div").innerHTML;
        if (!html) {
          html = '';
        }
        reactNativeEventHandler('tiny', html);
      })();`);
    });
  };

  const onMessage = event => {
    if (!event) return;
    let data = JSON.parse(event.nativeEvent.data);
    if (data.type === 'tiny') {
      eSendEvent('share_content_event', data.value);
    }
  };

  useEffect(() => {
    useShareStore.getState().setColors();
    onLoad();
  }, [note]);

  const changeMode = async m => {
    setMode(m);

    setLoading(true);
    try {
      if (m === 2) {
        let html = await sanitizeHtml(rawData.value);
        setNote(note => {
          note.content.data = html;
          return { ...note };
        });
      } else {
        let html = isURL(rawData.value)
          ? makeHtmlFromUrl(rawData.value)
          : makeHtmlFromPlainText(rawData.value);
        setNote(note => {
          note.content.data = html;
          return { ...note };
        });
      }
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };

  const onPaste = async () => {
    let text = await Clipboard.getString();
    if (text) {
      let content = await getContent();
      setNote(note => {
        note.content.data = content + '\n' + makeHtmlFromPlainText(text);
        return { ...note };
      });
    }
  };

  const Outer = Platform.OS === 'android' ? Modal : Fragment;

  const outerProps =
    Platform.OS === 'android'
      ? {
          animationType: 'fade',
          transparent: true,
          visible: true
        }
      : {};

  return (
    <Outer {...outerProps}>
      <AnimatedSAV
        style={{
          width: width > 500 ? 500 : width,
          height: height - kh,
          opacity: Platform.OS !== 'ios' ? opacity : 1,
          alignSelf: 'center',
          justifyContent: 'flex-end'
        }}
      >
        {quicknote && !showSearch ? (
          <View
            style={{
              width: '100%',
              backgroundColor: colors.bg,
              height: 50 + insets.top,
              paddingTop: insets.top,
              ...getElevation(1),
              marginTop: -insets.top,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <Button
              type="action"
              icon="close"
              iconColor={colors.pri}
              onPress={() => {
                if (showSearch) {
                  console.log('hide search');
                  setShowSearch(false);
                  animate(1, 0);
                } else {
                  close();
                }
              }}
              style={{
                width: 50,
                height: 50,
                marginBottom: 0
              }}
              iconSize={25}
            />

            <Text
              style={{
                color: colors.pri,
                fontSize: 17,
                fontFamily: 'OpenSans-Regular'
              }}
            >
              Quick note
            </Text>

            <Button
              type="action"
              icon="check"
              iconColor={accent.color}
              onPress={onPress}
              style={{
                width: 50,
                height: 50,
                marginBottom: 0
              }}
              iconSize={25}
            />
          </View>
        ) : (
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => {
              if (showSearch) {
                console.log('hide search');
                setShowSearch(false);
                animate(1, 0);
              } else {
                close();
              }
            }}
            style={{
              width: '100%',
              height: '100%',
              position: 'absolute'
            }}
          >
            <View
              style={{
                width: '100%',
                height: '100%',
                backgroundColor: 'white',
                opacity: 0.01
              }}
            />
            <View />
          </TouchableOpacity>
        )}

        {showSearch ? (
          <Search
            quicknote={quicknote}
            getKeyboardHeight={() => keyboardHeight.current}
            close={() => {
              setShowSearch(false);
              animate(1, 0);
            }}
          />
        ) : null}

        <View
          style={{
            paddingVertical: 25,
            backgroundColor: 'transparent',
            marginBottom: insets.top,
            display: showSearch ? 'none' : 'flex'
          }}
        >
          <View
            style={{
              maxHeight: '100%',
              paddingHorizontal: 12
            }}
          >
            <ScrollView
              horizontal
              contentContainerStyle={{
                alignItems: 'center',
                height: 50
              }}
              style={{
                width: '100%',
                height: 50,
                borderRadius: 10,
                flexDirection: 'row',
                bottom: -10
              }}
            >
              <Button
                color={colors.nav}
                onPress={() => {
                  useShareStore.getState().setAppendNote(null);
                }}
                icon="plus"
                iconSize={18}
                iconColor={!appendNote ? accent.color : colors.icon}
                title="New note"
                textColor={!appendNote ? accent.color : colors.icon}
                type="rounded"
                textStyle={{
                  fontSize: 13
                }}
                style={{
                  paddingHorizontal: 12,
                  ...getElevation(1),
                  height: 35
                }}
              />

              <Button
                color={colors.nav}
                onPress={() => {
                  setShowSearch(true);
                  animate(1, 1000);
                }}
                icon="text-short"
                iconSize={18}
                iconColor={appendNote ? accent.color : colors.icon}
                title={`${appendNote ? appendNote.title.slice(0, 25) : 'Append to note'}`}
                textColor={appendNote ? accent.color : colors.icon}
                type="rounded"
                textStyle={{
                  fontSize: 13
                }}
                style={{
                  paddingHorizontal: 12,
                  ...getElevation(1),
                  height: 35
                }}
              />
            </ScrollView>

            <View
              style={{
                width: '100%'
              }}
            >
              <View
                style={{
                  marginTop: 10,
                  minHeight: 100,
                  borderRadius: 10,
                  ...getElevation(quicknote ? 1 : 5),
                  backgroundColor: colors.bg,
                  overflow: 'hidden'
                }}
              >
                <View
                  style={{
                    width: '100%',
                    height: height * 0.3,
                    paddingBottom: 15,
                    borderRadius: 10
                  }}
                >
                  <WebView
                    onLoad={onLoad}
                    ref={webviewRef}
                    style={{
                      width: '100%',
                      height: '100%',
                      borderRadius: 10,
                      backgroundColor: 'transparent'
                    }}
                    cacheMode="LOAD_DEFAULT"
                    domStorageEnabled={true}
                    scrollEnabled={true}
                    bounces={false}
                    allowFileAccess={true}
                    scalesPageToFit={true}
                    allowingReadAccessToURL={Platform.OS === 'android' ? true : null}
                    onMessage={onMessage}
                    onShouldStartLoadWithRequest={onShouldStartLoadWithRequest}
                    allowFileAccessFromFileURLs={true}
                    allowUniversalAccessFromFileURLs={true}
                    originWhitelist={['*']}
                    javaScriptEnabled={true}
                    cacheEnabled={true}
                    source={
                      Platform.OS === 'ios'
                        ? { uri: sourceUri }
                        : {
                            uri: 'file:///android_asset/plaineditor.html',
                            baseUrl: 'file:///android_asset/'
                          }
                    }
                  />
                </View>

                {appendNote ? (
                  <Text
                    style={{
                      fontSize: 12,
                      color: colors.icon,
                      fontFamily: 'OpenSans-Regular',
                      paddingHorizontal: 12,
                      marginBottom: 10,
                      flexWrap: 'wrap'
                    }}
                  >
                    Above content will append to{' '}
                    <Text
                      style={{
                        color: accent.color,
                        fontFamily: 'OpenSans-SemiBold'
                      }}
                    >
                      "{appendNote.title}"
                    </Text>{' '}
                    . Click on "New note" to create a new note.
                  </Text>
                ) : null}

                <View
                  style={{
                    flexDirection: 'row',
                    paddingHorizontal: 12,
                    alignItems: 'flex-end',
                    justifyContent: 'space-between',
                    width: '100%'
                  }}
                >
                  <View
                    style={{
                      flexDirection: 'row'
                    }}
                  >
                    {rawData.value && isURL(rawData.value) ? (
                      <Button
                        color={mode == 2 ? colors.shade : colors.nav}
                        icon={modes[2].icon}
                        onPress={() => changeMode(2)}
                        title={modes[2].title}
                        iconSize={18}
                        iconColor={mode == 2 ? accent.color : colors.icon}
                        textColor={mode == 2 ? accent.color : colors.icon}
                        type="rounded"
                        style={{ paddingHorizontal: 12 }}
                      />
                    ) : null}
                    <Button
                      color={mode == 1 ? colors.shade : colors.nav}
                      icon={modes[1].icon}
                      onPress={() => changeMode(1)}
                      title={modes[1].title}
                      iconSize={18}
                      iconColor={mode == 1 ? accent.color : colors.icon}
                      textColor={mode == 1 ? accent.color : colors.icon}
                      type="rounded"
                      style={{ paddingHorizontal: 12 }}
                    />
                  </View>

                  {!quicknote ? (
                    <Button
                      color={accent.color}
                      onPress={onPress}
                      loading={loading || loadingIntent}
                      icon="check"
                      iconSize={20}
                      iconColor={colors.light}
                      style={{
                        paddingHorizontal: 0,
                        height: 40,
                        width: 40,
                        borderRadius: 100,
                        minWidth: 0
                      }}
                    />
                  ) : null}
                </View>
              </View>
            </View>

            <View
              style={{
                height: Platform.isPad ? 150 : Platform.OS === 'ios' ? 110 : 0
              }}
            />
          </View>
        </View>
      </AnimatedSAV>
    </Outer>
  );
};

const Button = ({
  title,
  onPress,
  color,
  loading,
  style,
  textStyle,
  icon,
  iconSize = 22,
  type = 'button',
  iconColor = 'gray',
  textColor = 'white',
  fontSize = 18
}) => {
  const types = {
    action: {
      style: {
        width: 60,
        height: 60,
        borderRadius: 100,
        minWidth: 0,
        paddingHorizontal: 0
      },
      textStyle: {}
    },
    button: {
      style: {
        height: 50,
        borderRadius: 5,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
        marginBottom: 10,
        minWidth: 80,
        paddingHorizontal: 20
      },
      textStyle: {}
    },
    rounded: {
      style: {
        marginRight: 15,
        height: 30,
        borderRadius: 100,
        paddingHorizontal: 6,
        marginTop: -2.5
      },
      textStyle: {
        fontSize: 12,
        marginLeft: 5
      }
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[
        {
          backgroundColor: color,
          height: 50,
          borderRadius: 5,
          justifyContent: 'center',
          alignItems: 'center',
          flexDirection: 'row',
          marginBottom: 10,
          minWidth: 80,
          paddingHorizontal: 20
        },
        types[type].style,
        style
      ]}
    >
      {loading ? <ActivityIndicator color={iconColor} /> : null}

      {icon && !loading ? <Icon name={icon} size={iconSize} color={iconColor || 'white'} /> : null}

      {title ? (
        <Text
          style={[
            {
              fontSize: fontSize || 18,
              fontFamily: 'OpenSans-Regular',
              color: textColor,
              marginLeft: loading ? 10 : 0
            },
            types[type].textStyle,
            textStyle
          ]}
        >
          {title}
        </Text>
      ) : null}
    </TouchableOpacity>
  );
};

export default NotesnookShare;
