import Clipboard from '@react-native-clipboard/clipboard';
import absolutify from 'absolutify';
import React, { useEffect, useRef, useState } from 'react';
import { ScrollView } from 'react-native';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StatusBar,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View
} from 'react-native';
import Animated, { Easing, timing, useValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import WebView from 'react-native-webview';
import ShareExtension from 'rn-extensions-share';
import { eSendEvent, eSubscribeEvent, eUnSubscribeEvent } from '../src/services/EventManager';
import { getElevation } from '../src/utils';
import { db } from '../src/utils/database';
import Storage from '../src/utils/storage';
import { sleep } from '../src/utils/TimeUtils';
import { Search } from './search';
import { useShareStore } from './store';
import isURL from 'validator/lib/isURL';
import { getLinkPreview } from 'link-preview-js';

const AnimatedKAV = Animated.createAnimatedComponent(KeyboardAvoidingView);
const AnimatedSAV = Animated.createAnimatedComponent(SafeAreaView);
async function sanitizeHtml(site) {
  try {
    let html = await fetch(site);
    html = await html.text();
    let siteHtml = html.replace(
      /(?:<(script|button|input|textarea|style|link|head)(?:\s[^>]*)?>)\s*((?:(?!<\1)[\s\S])*)\s*(?:<\/\1>)/g,
      ''
    );
    return absolutify(siteHtml, site);
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
function absolutifyImgs(html, site) {
  let { parse } = require('node-html-parser');
  let parser = parse(html);

  let images = parser.querySelectorAll('img');
  for (var i = 0; i < images.length; i++) {
    let img = images[i];
    let url = getBaseUrl(site);
    let src = img.getAttribute('src');
    if (src.startsWith('/')) {
      if (src.startsWith('//')) {
        src = src.replace('//', 'https://');
      } else {
        src = url + src;
      }
    }
    if (src.startsWith('data:')) {
      src = '';
    }
    img.setAttribute('src', src);
  }
  return parser.outerHTML;
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
  };

  const onKeyboardDidHide = () => {
    keyboardHeight.current = 0;
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
    setTimeout(() => {
      webviewRef.current?.injectJavaScript(`document
      .querySelector('.htmldiff_div')
      .setAttribute('contenteditable', 'true');`);
      webviewRef.current?.injectJavaScript(`
      pageTheme.colors = ${theme};
      setTheme();
    `);
    }, 300);
    let theme = { ...colors };
    theme.factor = 1;

    postMessage(webviewRef, 'theme', JSON.stringify(theme));
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
    if (!content || content === '') {
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
    onLoad();
  }, [note]);

  const changeMode = async m => {
    setMode(m);

    setLoading(true);
    try {
      if (m === 2) {
        let html = await sanitizeHtml(rawData.value);
        html = await absolutifyImgs(html, rawData.value);
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

  return (
    <AnimatedSAV
      style={{
        width: width > 500 ? 500 : width,
        height: height,
        opacity: Platform.OS !== 'ios' ? opacity : 1,
        alignSelf: 'center'
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

      <AnimatedKAV
        enabled={!floating}
        onLayout={event => {
          if (prevAnimation.current === 0) return;
          translate.setValue(event.nativeEvent.layout.height + 30);
        }}
        style={{
          paddingVertical: 25,
          backgroundColor: 'transparent',
          marginBottom: insets.top,
          display: showSearch ? 'none' : 'flex'
        }}
        behavior={Platform.OS === 'ios' ? 'padding' : null}
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
              height: 45
            }}
            style={{
              width: '100%',
              height: 35,
              borderRadius: 10,
              flexDirection: 'row'
            }}
          >
            <Button
              color={appendNote ? colors.nav : accent.color}
              onPress={() => {
                useShareStore.getState().setAppendNote(null);
              }}
              icon="plus"
              iconSize={18}
              iconColor={!appendNote ? colors.light : colors.icon}
              title="Create new note"
              textColor={!appendNote ? colors.light : colors.icon}
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
              color={!appendNote ? colors.nav : accent.color}
              onPress={() => {
                setShowSearch(true);
                animate(1, 1000);
              }}
              icon="text-short"
              iconSize={18}
              iconColor={appendNote ? colors.light : colors.icon}
              title={`${appendNote ? appendNote.title.slice(0, 25) : 'Append to note'}`}
              textColor={appendNote ? colors.light : colors.icon}
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
            {!quicknote ? (
              <Button
                color={accent.color}
                onPress={onPress}
                loading={loading || loadingIntent}
                icon="check"
                iconSize={22}
                iconColor={colors.light}
                style={{
                  position: 'absolute',
                  zIndex: 999,
                  ...getElevation(10),
                  right: 24,
                  bottom: -25,
                  paddingHorizontal: 24,
                  height: 35,
                  borderRadius: 100
                }}
              />
            ) : null}

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
                  height: height * 0.25,
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
                    fontSize: 11,
                    color: colors.gray,
                    fontFamily: 'OpenSans-Regular',
                    paddingHorizontal: 12,
                    marginBottom: 10,
                    flexWrap: 'wrap'
                  }}
                >
                  This shared note will be appended to{' '}
                  <Text
                    style={{
                      color: accent.color,
                      fontFamily: 'OpenSans-SemiBold'
                    }}
                  >
                    "{appendNote.title}"
                  </Text>{' '}
                  . Click on "Create new note" to add to a new note instead.
                </Text>
              ) : null}

              <View
                style={{
                  flexDirection: 'row',
                  paddingHorizontal: 12,
                  paddingRight: 80,
                  alignItems: 'center'
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
            </View>
          </View>

          <View
            style={{
              height: Platform.isPad ? 150 : Platform.OS === 'ios' ? 110 : 40
            }}
          />
        </View>
      </AnimatedKAV>
    </AnimatedSAV>
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
